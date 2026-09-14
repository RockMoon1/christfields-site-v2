# Local preview lifecycle

Use `scripts/preview.ps1` from a Windows PowerShell terminal in this repository. It launches the installed Next.js CLI directly through Node in a hidden, separate process, binds only to `127.0.0.1:3000`, and retains separate timestamped output and error logs under the gitignored `.claude/recon/preview/` directory.

```powershell
.\scripts\preview.ps1 start -Mode dev
.\scripts\preview.ps1 status
.\scripts\preview.ps1 stop
```

Stop the development preview before a production build: both modes use `.next`. Then start the resulting production preview explicitly.

```powershell
.\scripts\preview.ps1 stop
npm run build
.\scripts\preview.ps1 start -Mode production
.\scripts\preview.ps1 status
```

Refresh an already-open browser after switching modes so it requests the current build's assets. The helper does not build, restart automatically, commit, publish, or print environment variables. A start waits for HTTP 200 and reports the saved PID and log locations; an unsuccessful startup leaves its logs available for diagnosis. `status` reports process ownership and HTTP availability separately. HTTP 200 alone does not prove every page or asset works.

The saved process identity includes PID, creation time, executable path, and the repository's Next CLI path. Repeating `start` in the same mode reuses the recorded process. A different mode requires an explicit stop. An occupied port belonging to an unrecorded process is left alone. `stop` controls only the identified process and its recorded descendants, checking creation times against PID reuse; it does not kill processes by name or by port. Logs are retained after stopping.

## Evidence from the September 7, 2026 review follow-up

- Before this change, port 3000 had no listener. The earlier `foundation-preview.log` and `preview-server.log` ended after Next's Ready message, without a recorded exception or shutdown reason.
- The previous root execution session, 28793, later returned exit code 1 with empty additional output. That establishes that the execution ended unsuccessfully; it does not identify an application crash, a tool lifecycle termination, or another cause.
- The helper started development preview PID 39240. Startup returned HTTP 200, and the initiating shell completed with exit code 0. A separate later shell verified the same PID, creation time, and executable, and again received HTTP 200. Subsequent browser navigation checks reused that preview successfully.
- The startup logs for that run are `.claude/recon/preview/20260907-230856-188-dev.stdout.log` and the corresponding `.stderr.log`. The current process record is `.claude/recon/preview/process.json`.
- After browser captures finished, the helper stopped its recorded development process and descendants. The production build completed successfully. A new production process, PID 19348, started through the helper and survived the starting shell exit and the subsequent Playwright navigation check. Fresh-shell status still reported HTTP 200. Evidence: `.claude/recon/verification/production-preview-{start,status}.log` and `navigation-production-followup.log`; startup logs are `.claude/recon/preview/20260907-231745-187-production.{stdout,stderr}.log`.
- A repeated development start retained PID 39240 and returned HTTP 200. Requesting production mode while that development process was running was refused without replacing it. The fresh-shell status, idempotence, and mode-guard output is saved in `.claude/recon/verification/preview-lifecycle-check.log`.

This verifies survival across the tested shell exit and later tool calls. It is not a guarantee across a computer restart, user sign-out, external process termination, or future Codex task lifecycle changes. Check `status` before a browser review and inspect both recorded logs if the preview is unavailable. Do not describe an untested future lifetime as verified.

## Batch 2a: unavailable preview guard (8 September 2026)

The previously recorded production process was absent at the start of Batch 2. Its retained logs did not identify a shutdown cause. The earlier successful survival checks remain historical observations; they do not establish why that process later ended. A subsequent production session also ended between the completed before capture and the requested switch to development, without an identified cause.

The accepted alternative is now implemented: `scripts/lib/local-preview-health.mjs` rejects an unavailable preview **before browser verification begins**. It accepts only credential-free loopback HTTP, requires HTTP 200 and a complete HTML response, refuses redirects, and reports `PREVIEW_UNAVAILABLE` on failure. It neither starts nor restarts a process. Both public capture scripts, the Batch 2 capture, and the public/journey browser tests use it. This distinguishes unavailable infrastructure from an image or UI defect; it does not prove every asset loads or every later request succeeds.

Controlled reproduction stopped only the helper's recorded process. The guard exited 1 with `PREVIEW_UNAVAILABLE`; restarting through the helper restored HTTP 200, followed by 27 successful baseline captures. Evidence: `.claude/recon/verification/batch2-preview-guard-stopped.log`, `batch2-preview-restart.log`, and `.claude/recon/shots/public-batch2/before/capture.json`. The source stayed unchanged during that capture. A browser exception or a later failed request must still be reported separately.

Do not claim the historical shutdown cause was diagnosed or the preview will remain available indefinitely. Check status at the beginning of Claude's review and refresh its tab after a mode/build switch.

The first after-capture run also lost its listener mid-run. Its 16-frame partial manifest is preserved under `shots/public-batch2/after-attempt1`; it is not the final comparison. For further diagnosis, `start -Mode production -ObserveExit` optionally keeps the launching shell attached to the process handle and records its exit code if it later terminates. This observer never restarts a server. Without `-ObserveExit`, startup behavior is unchanged. An observed launch plus a successful test run does not establish the cause of earlier exits.

Two further attempts preserved under `after-attempt2` and `after-attempt3` recorded exit code `-1073740791` (`0xC0000409`) on the machine's Node 24.15.0. Directly serving the four globe files did not prevent the third exit, and isolated Sharp WebP/AVIF conversions passed. That experiment was reverted; the site retains normal image optimization.

[Node's own issue tracker records a similar silent Windows HTTP-connection crash on 24.15.0, with later versions passing its reproduction](https://github.com/nodejs/node/issues/63620). This is a plausible explanation, not proof that this site's uncollected native stack is identical. The final local preview uses the existing bundled Node 24.19.0 via the helper's optional `-NodePath` argument. Nothing changed the system Node installation, PATH, project dependencies, or deployment configuration. The process record now includes executable and version; requesting a different runtime while a recorded preview is running requires stopping that preview first.

The machine-specific command used for this verification is:

```powershell
.\scripts\preview.ps1 start -Mode production -ObserveExit -NodePath 'C:\Users\lpell1\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
```

`-ObserveExit` keeps that launching terminal occupied for diagnosis; omit it for the ordinary detached start. Use the recorded runtime for public verification too. Evidence includes `batch2-production-runtime24-19.log`, the final capture manifest, and `batch2-preview-runtime-diagnosis.json` under `.claude/recon/verification/`.

## Button navigation scope check

A read-only TypeScript syntax-tree scan of `app/` and `components/` found 19 production `<Button>` source callsites: 14 provide `href`, and none combine `href` with `pending`. `ProductShelf` supplies `p.href`, so its one source callsite can render multiple product links. This does not establish complete navigation compatibility; the actual public route and modified-click browser checks remain the direct behavioral evidence.
