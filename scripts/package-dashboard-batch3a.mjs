import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const output = '.claude/recon/review-patches/batch3a';
const beforeRoot = `${output}/before`;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const groups = {
  '04a-settings': ['components/dashboard/YouCards.tsx', 'components/dashboard/FeedbackCard.tsx', 'components/dashboard/GoogleCards.tsx', 'components/dashboard/InstallAppCard.tsx', 'app/dashboard/(app)/settings/page.tsx'],
  '04b-availability': ['components/dashboard/AvailabilityBoard.tsx', 'app/dashboard/(app)/availability/page.tsx'],
};
const frozen = JSON.parse(await fs.readFile(`${output}/frozen-before.json`, 'utf8'));
const changedProtected = [];
for (const entry of frozen.files) {
  if (hash(await fs.readFile(entry.file)) !== entry.sha256) changedProtected.push(entry.file);
}
if (changedProtected.length) throw new Error(`Protected files changed: ${changedProtected.join(', ')}`);
const before = JSON.parse(await fs.readFile('.claude/recon/shots/dashboard-batch3a/before/measurements.json', 'utf8'));
const after = JSON.parse(await fs.readFile('.claude/recon/shots/dashboard-batch3a/after/measurements.json', 'utf8'));
if (JSON.stringify(before.instrument) !== JSON.stringify(after.instrument)) throw new Error('Before/after instruments differ.');
for (const phase of [before, after]) {
  if (phase.captures.length !== 14 || phase.errors.length || phase.blocked.length || !phase.sourcesUnchanged) throw new Error(`${phase.phase} evidence is incomplete.`);
  for (const capture of phase.captures) {
    if (hash(await fs.readFile(`.claude/recon/shots/dashboard-batch3a/${phase.phase}/${capture.filename}`)) !== capture.sha256) throw new Error(`Screenshot changed: ${capture.filename}`);
  }
}
const packages = [];
for (const [name, files] of Object.entries(groups)) {
  const parts = [], sources = [];
  for (const file of files) {
    const source = `${beforeRoot}/${file}`;
    const beforeHash = hash(await fs.readFile(source)), afterHash = hash(await fs.readFile(file));
    if (beforeHash !== before.sources[file] || afterHash !== after.sources[file]) throw new Error(`Source/capture mismatch: ${file}`);
    const result = spawnSync('git', ['-c', 'core.autocrlf=false', 'diff', '--no-index', '--', source, file], { encoding: 'utf8', maxBuffer: 8_000_000 });
    if (![0, 1].includes(result.status)) throw new Error(result.stderr);
    parts.push(result.stdout.replaceAll(`a/${beforeRoot}/`, 'a/'));
    sources.push({ file, beforeSha256: beforeHash, afterSha256: afterHash });
  }
  const patch = parts.join('');
  const filename = `${name}.patch`;
  await fs.writeFile(path.join(output, filename), patch);
  const check = spawnSync('git', ['apply', '--reverse', '--check', '--whitespace=nowarn', path.join(output, filename)], { encoding: 'utf8' });
  if (check.status !== 0) throw new Error(`Reverse check failed: ${check.stderr}`);
  packages.push({ filename, sha256: hash(patch), sources, reverseCheck: 'pass' });
}
const manifest = {
  recordedAt: new Date().toISOString(), head: frozen.head,
  baseline: 'Current uncommitted source captured before Batch 3a; not a new git commit.',
  packages, protectedFilesUnchanged: frozen.files.length,
  screenshotInstrumentIdentical: true, beforeScreenshots: 14, afterScreenshots: 14,
  caveat: 'Review slices depend on existing shared foundations; combined checkpoint tested. No authenticated or push/Clerk integration claim.',
};
await fs.writeFile(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest, null, 2));
