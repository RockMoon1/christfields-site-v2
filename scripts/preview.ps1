param(
  [ValidateSet('start', 'status', 'stop')][string]$Action = 'status',
  [ValidateSet('dev', 'production')][string]$Mode = 'dev',
  [switch]$ObserveExit,
  [string]$NodePath
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$runtimeDir = Join-Path $repoRoot '.claude/recon/preview'
$statePath = Join-Path $runtimeDir 'process.json'
$previewUrl = 'http://127.0.0.1:3000/'
$nextCli = Join-Path $repoRoot 'node_modules/next/dist/bin/next'

function Read-PreviewState {
  if (Test-Path -LiteralPath $statePath) {
    return Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
  }
  return $null
}

function Get-OwnedProcess($state) {
  if ($null -eq $state) { return $null }
  $candidate = Get-Process -Id $state.processId -ErrorAction SilentlyContinue
  if ($null -eq $candidate) { return $null }
  $details = Get-CimInstance Win32_Process -Filter "ProcessId = $($state.processId)"
  if ($candidate.StartTime.ToUniversalTime().Ticks -ne ([datetime]$state.startedUtc).ToUniversalTime().Ticks -or
      $candidate.Path -ne $state.executable -or
      $null -eq $details.CommandLine -or
      $details.CommandLine.IndexOf($nextCli, [StringComparison]::OrdinalIgnoreCase) -lt 0) {
    throw 'Saved PID no longer identifies this preview. Refusing to control it.'
  }
  return $candidate
}

function Test-PreviewHttp {
  try {
    $response = Invoke-WebRequest -Uri $previewUrl -UseBasicParsing -TimeoutSec 3
    return $response.StatusCode -eq 200
  } catch { return $false }
}

function Show-PreviewStatus($state, $process) {
  [pscustomobject]@{
    running = $null -ne $process
    http200 = Test-PreviewHttp
    url = $previewUrl
    mode = $(if ($state) { $state.mode } else { $null })
    executable = $(if ($state) { $state.executable } else { $null })
    nodeVersion = $(if ($state) { $state.nodeVersion } else { $null })
    processId = $(if ($process) { $process.Id } else { $null })
    stdout = $(if ($state) { $state.stdout } else { $null })
    stderr = $(if ($state) { $state.stderr } else { $null })
  } | ConvertTo-Json
}

$savedState = Read-PreviewState
$ownedProcess = Get-OwnedProcess $savedState
if ($Action -eq 'status') {
  Show-PreviewStatus $savedState $ownedProcess
  exit
}

if ($Action -eq 'stop') {
  if ($null -eq $ownedProcess) {
    Write-Output 'No process owned by this helper is running.'
    exit
  }
  # Take descendants before stopping the parent; never kill by port or process name.
  $processTable = @(Get-CimInstance Win32_Process)
  $treeIds = [Collections.Generic.List[int]]::new()
  $treeIds.Add($ownedProcess.Id)
  for ($index = 0; $index -lt $treeIds.Count; $index++) {
    foreach ($child in $processTable | Where-Object { $_.ParentProcessId -eq $treeIds[$index] }) {
      $treeIds.Add([int]$child.ProcessId)
    }
  }
  $null = Get-OwnedProcess $savedState
  # Check descendant creation times too, in case a PID was reused after the snapshot.
  foreach ($processId in $treeIds.ToArray()) {
    $snapshot = $processTable | Where-Object { $_.ProcessId -eq $processId }
    $current = Get-CimInstance Win32_Process -Filter "ProcessId = $processId"
    if ($current -and $snapshot -and $current.CreationDate -eq $snapshot.CreationDate) {
      Stop-Process -Id $processId -ErrorAction SilentlyContinue
    }
  }
  Write-Output 'Stopped the recorded preview process and its recorded descendants. Logs retained.'
  exit
}

if ($ownedProcess) {
  if ($savedState.mode -ne $Mode) { throw 'A different preview mode is running. Stop it explicitly first.' }
  if ($NodePath -and (Resolve-Path -LiteralPath $NodePath).Path -ne $savedState.executable) {
    throw 'A different Node runtime is running. Stop it explicitly first.'
  }
  Show-PreviewStatus $savedState $ownedProcess
  exit
}
if (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue) {
  throw 'Port 3000 is occupied by another process. Refusing to replace it.'
}
if (-not (Test-Path -LiteralPath $nextCli)) { throw 'Next.js is missing. Install project dependencies first.' }
if ($Mode -eq 'production' -and -not (Test-Path -LiteralPath (Join-Path $repoRoot '.next/BUILD_ID'))) {
  throw 'No production build found. Run the project build first.'
}
$nodeExecutable = if ($NodePath) {
  (Resolve-Path -LiteralPath $NodePath).Path
} else {
  (Get-Command node -CommandType Application | Select-Object -First 1).Source
}
$null = New-Item -ItemType Directory -Path $runtimeDir -Force
$runStamp = Get-Date -Format 'yyyyMMdd-HHmmss-fff'
$stdoutPath = Join-Path $runtimeDir "$runStamp-$Mode.stdout.log"
$stderrPath = Join-Path $runtimeDir "$runStamp-$Mode.stderr.log"
$nextCommand = if ($Mode -eq 'production') { 'start' } else { 'dev' }
$previewProcess = Start-Process -FilePath $nodeExecutable -ArgumentList @("`"$nextCli`"", $nextCommand, '--hostname', '127.0.0.1', '--port', '3000') -WorkingDirectory $repoRoot -WindowStyle Hidden -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath -PassThru
$newState = [pscustomobject]@{
  processId = $previewProcess.Id
  startedUtc = $previewProcess.StartTime.ToUniversalTime().ToString('o')
  executable = $nodeExecutable
  nodeVersion = (& $nodeExecutable --version)
  mode = $Mode
  stdout = $stdoutPath
  stderr = $stderrPath
}
$newState | ConvertTo-Json | Set-Content -LiteralPath $statePath -Encoding UTF8
for ($attempt = 0; $attempt -lt 15; $attempt++) {
  if ($null -eq (Get-OwnedProcess $newState)) { throw "Preview exited. Inspect $stderrPath and $stdoutPath" }
  if (Test-PreviewHttp) {
    Show-PreviewStatus $newState (Get-OwnedProcess $newState)
    if ($ObserveExit) {
      # Optional diagnostic observer retains the launch handle so a later exit
      # code is recoverable. It never restarts the server or changes its scope.
      $previewProcess.WaitForExit()
      [pscustomobject]@{
        processId = $previewProcess.Id
        exitedUtc = [datetime]::UtcNow.ToString('o')
        exitCode = $previewProcess.ExitCode
      } | ConvertTo-Json
    }
    exit
  }
  Start-Sleep -Seconds 1
}
throw "Preview has not returned HTTP 200 yet. Inspect $stderrPath and $stdoutPath; it has not been restarted."
