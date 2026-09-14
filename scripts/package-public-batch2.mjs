import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Review artifacts only. Never stages, commits, applies, resets, or publishes.
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const base = git('rev-parse', 'HEAD').trim();
const before = JSON.parse(readFileSync('.claude/recon/shots/public-batch2/before/capture.json', 'utf8'));
const after = JSON.parse(readFileSync('.claude/recon/shots/public-batch2/after/capture.json', 'utf8'));
if (!before.sourceStableDuringCapture || !after.sourceStableDuringCapture || after.errors.length) {
  throw new Error('Capture was interrupted or source changed; do not package as complete.');
}
// A failed run still writes its diagnostic manifest in finally. Require the
// whole recorded scenario set, not merely an empty browser-error array.
if (before.screenshotCount !== 27 || after.screenshotCount !== 25) throw new Error('Incomplete capture scenario set.');
if (JSON.stringify(before.instrument) !== JSON.stringify(after.instrument)) throw new Error('Capture instruments differ.');
const destination = '.claude/recon/review-patches/batch2';
mkdirSync(destination, { recursive: true });
const slices = [
  ['03d1-growth-story', ['components/sections/JourneyScroll.tsx']],
  ['03d2-static-scripture-band', ['components/motion/ScriptureMarquee.tsx']],
  ['03d3-faithflow-example', ['components/sections/DashboardInvite.tsx', 'components/sections/faithflow/DashboardPreview.tsx']],
  ['03e-practice-focus', ['components/sections/PracticesScroll.tsx']],
  ['03f-lenis-cleanup', ['components/motion/SmoothScroll.tsx']],
];
const packages = [];
for (const [name, files] of slices) {
  let patch = '';
  const sources = [];
  for (const file of files) {
    const oldPath = `.claude/recon/batch2-before-source/${file.split('/').at(-1)}`;
    const oldBytes = readFileSync(oldPath);
    const currentBytes = readFileSync(file);
    const beforeHash = hash(oldBytes);
    const afterHash = hash(currentBytes);
    if (before.sourcesBefore[file] && beforeHash !== before.sourcesBefore[file]) throw new Error(`Before source mismatch: ${file}`);
    if (after.sourcesBefore[file] && afterHash !== after.sourcesBefore[file]) throw new Error(`After source mismatch: ${file}`);
    const result = spawnSync('git', ['diff', '--no-index', '--binary', '--', oldPath, file], { encoding: 'utf8' });
    if (result.status !== 1) throw new Error(`Expected a reviewable difference for ${file}: ${result.stderr}`);
    patch += result.stdout
      .replace(/^diff --git .*$/m, `diff --git a/${file} b/${file}`)
      .replace(/^--- .*$/m, `--- a/${file}`)
      .replace(/^\+\+\+ .*$/m, `+++ b/${file}`);
    sources.push({ file, beforeSha256: beforeHash, afterSha256: afterHash,
      beforeProvenance: before.sourcesBefore[file] ? 'Exact bytes recorded by before capture; also matches HEAD after Git checkout line endings.'
        : 'Local source copied immediately before this adjacent fix; builds on the previously reviewed checkpoint.' });
  }
  const output = `${destination}/${name}.patch`;
  writeFileSync(output, patch);
  git('apply', '--reverse', '--check', '--whitespace=nowarn', output);
  packages.push({ name, patch: output, sha256: hash(patch), bytes: Buffer.byteLength(patch), reverseCheck: 'passed', sources });
}
const frozen = ['lib/dashboard/verses.json', 'lib/dashboard/themes.json', 'lib/dashboard/themes.ts',
  'lib/dashboard/verses.ts', 'lib/dashboard/rhythm.ts', 'lib/dashboard/questions.ts',
  'lib/groups/membership.ts', 'lib/schedule/public-event.ts'];
const invariants = frozen.map(file => {
  const original = git('show', `${base}:${file}`).replaceAll('\r\n', '\n');
  const current = readFileSync(file, 'utf8').replaceAll('\r\n', '\n');
  if (original !== current) throw new Error(`Frozen file changed: ${file}`);
  return { file, unchanged: true, sha256LF: hash(current) };
});
const manifest = { base, createdAt: new Date().toISOString(), packages, invariants,
  instrument: after.instrument, beforeBuild: before.buildId, afterBuild: after.buildId,
  evidence: { before: '.claude/recon/shots/public-batch2/before/capture.json',
    after: '.claude/recon/shots/public-batch2/after/capture.json',
    interruptedAttempt: '.claude/recon/shots/public-batch2/after-attempt1/capture.json' },
  supportFiles: ['DESIGN.md', 'docs/design/PUBLIC-BATCH2-REVIEW.md', 'docs/design/LOCAL-PREVIEW.md',
    'docs/design/PUBLIC-CONTRAST-REVIEW.md', 'docs/design/REVIEW-CHECKPOINT.md', 'scripts/preview.ps1',
    'scripts/lib/local-preview-health.mjs', 'scripts/lib/local-preview-health.d.mts',
    'scripts/capture-design.mjs', 'scripts/capture-public-contrast.mjs',
    'scripts/capture-public-batch2.mjs', 'scripts/capture-public-batch2-supplement.mjs',
    'scripts/package-public-batch2.mjs', 'playwright.public.config.ts',
    'tests/browser/public-motion.pw.ts', 'tests/browser/journey-images.pw.ts',
    'tests/browser/public-batch2.pw.ts', 'tests/browser/scripture-band.pw.ts', 'tests/browser/faithflow-preview.pw.ts'],
  notes: ['No commits or pushes. These are incremental review slices, verified in the combined production build.',
    'Earlier review patches remain unchanged; do not apply these slices on top of a later cumulative patch of the same files.',
    '03e and 03f are separate adjacent fixes; 03c remains the independently reviewed contrast batch.',
    'AGENTS.md, .agents, private documents, secrets, and generated screenshots are not included in patches.',
    'Support files are listed for direct review separately from the five production-code slices.',
    'Scripture wording is preserved; no edition or contextual-review completion is claimed.'],
};
writeFileSync(`${destination}/manifest.json`, JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ packages: packages.map(({ name, bytes, reverseCheck }) => ({ name, bytes, reverseCheck })), frozenFiles: invariants.length }, null, 2));
