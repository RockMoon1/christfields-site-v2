import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const output = '.claude/recon/review-patches/batch3b';
const beforeRoot = `${output}/before`;
const shotsRoot = '.claude/recon/shots/prayer-wall';
const files = ['components/dashboard/CommunityWall.tsx', 'app/dashboard/(app)/community/page.tsx'];
const expectedScreenshots = [390, 1280].flatMap(width =>
  ['wall', 'author-actions', 'form', 'empty'].map(state => `${width}-${state}.png`));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const readJson = async file => JSON.parse(await fs.readFile(file, 'utf8'));
const frozen = await readJson(`${output}/frozen-before.json`);
const protectedFiles = [...frozen.files, ...frozen.priorReviewedFiles];
if (protectedFiles.length !== 123 || new Set(protectedFiles.map(entry => entry.file)).size !== 123
    || frozen.totalProtectedFileCount !== 123) {
  throw new Error('Expected 123 distinct protected files in the Batch 3b baseline.');
}
const changedProtected = [];
for (const entry of protectedFiles) {
  if (hash(await fs.readFile(entry.file)) !== entry.sha256) changedProtected.push(entry.file);
}
if (changedProtected.length) throw new Error(`Protected files changed: ${changedProtected.join(', ')}`);

const before = await readJson(`${shotsRoot}/before/measurements.json`);
const after = await readJson(`${shotsRoot}/after/measurements.json`);
const instrument = await readJson(`${shotsRoot}/instrument.json`);
if (JSON.stringify(before.instrument) !== JSON.stringify(after.instrument)
    || JSON.stringify(before.instrument) !== JSON.stringify(instrument)) {
  throw new Error('Before/after instruments differ from each other or the frozen record.');
}
if (hash(await fs.readFile('scripts/capture-prayer-wall.mjs')) !== instrument.script
    || hash(await fs.readFile(`${shotsRoot}/capture.frozen.mjs`)) !== instrument.script
    || hash(await fs.readFile('scripts/serve-browser-fixture.mjs')) !== instrument.server) {
  throw new Error('Current or frozen capture tooling does not match the instrument.');
}
const fixtureFiles = (await fs.readdir('tests/browser/fixture', { withFileTypes: true }))
  .filter(entry => entry.isFile()).map(entry => entry.name).sort();
if (JSON.stringify(fixtureFiles) !== JSON.stringify(Object.keys(instrument.fixture).sort())) {
  throw new Error('Fixture file inventory changed after the capture baseline.');
}
for (const file of fixtureFiles) {
  if (hash(await fs.readFile(`tests/browser/fixture/${file}`)) !== instrument.fixture[file]) {
    throw new Error(`Fixture instrument changed: ${file}`);
  }
}

const screenshotEvidence = [];
for (const [expectedPhase, phase] of [['before', before], ['after', after]]) {
  if (phase.phase !== expectedPhase || phase.captures.length !== 8 || phase.errors.length
      || phase.blocked.length || !phase.sourcesUnchanged) {
    throw new Error(`${expectedPhase} evidence is incomplete.`);
  }
  const filenames = phase.captures.map(capture => capture.filename).sort();
  const savedPngs = (await fs.readdir(`${shotsRoot}/${expectedPhase}`)).filter(file => file.endsWith('.png')).sort();
  if (JSON.stringify(filenames) !== JSON.stringify([...expectedScreenshots].sort())
      || JSON.stringify(savedPngs) !== JSON.stringify(filenames)) {
    throw new Error(`${expectedPhase} screenshot inventory differs from the eight expected frames.`);
  }
  const hashes = new Set();
  for (const capture of phase.captures) {
    const bytes = await fs.readFile(`${shotsRoot}/${expectedPhase}/${capture.filename}`);
    if (!bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
      throw new Error(`Invalid PNG: ${expectedPhase}/${capture.filename}`);
    }
    if (hash(bytes) !== capture.sha256) throw new Error(`Screenshot changed: ${expectedPhase}/${capture.filename}`);
    hashes.add(capture.sha256);
  }
  if (hashes.size !== 8) throw new Error(`${expectedPhase} does not contain eight distinct screenshot frames.`);
  screenshotEvidence.push({ phase: expectedPhase, screenshots: 8, distinctPngs: hashes.size,
    measurementsSha256: hash(await fs.readFile(`${shotsRoot}/${expectedPhase}/measurements.json`)) });
}

const parts = [], sources = [];
for (const file of files) {
  const baseline = `${beforeRoot}/${file}`;
  const beforeHash = hash(await fs.readFile(baseline)), afterHash = hash(await fs.readFile(file));
  if (beforeHash !== before.sources[file] || afterHash !== after.sources[file]) {
    throw new Error(`Source/capture mismatch: ${file}`);
  }
  const result = spawnSync('git', ['-c', 'core.autocrlf=false', 'diff', '--no-index', '--', baseline, file],
    { encoding: 'utf8', maxBuffer: 8_000_000 });
  if (![0, 1].includes(result.status)) throw new Error(result.stderr || result.error?.message || 'git diff failed');
  parts.push(result.stdout.replaceAll(`a/${beforeRoot}/`, 'a/'));
  sources.push({ file, beforeSha256: beforeHash, afterSha256: afterHash });
}
const patch = parts.join('');
if (!patch.trim()) throw new Error('No prayer-wall changes to package.');
const check = spawnSync('git', ['apply', '--reverse', '--check', '--whitespace=nowarn', '-'],
  { input: patch, encoding: 'utf8' });
if (check.status !== 0) throw new Error(`Reverse check failed: ${check.stderr || check.error?.message}`);

const filename = '04c-prayer-wall.patch';
const manifest = {
  recordedAt: new Date().toISOString(), head: frozen.head,
  baseline: 'Current uncommitted source captured before Batch 3b; not a new git commit.',
  packages: [{ filename, sha256: hash(patch), sources, reverseCheck: 'pass' }],
  protectedFilesUnchanged: protectedFiles.length,
  protectedContractsUnchanged: frozen.files.length,
  priorReviewedFilesUnchanged: frozen.priorReviewedFiles.length,
  screenshotInstrumentIdentical: true, currentInstrumentMatchesCapture: true,
  beforeScreenshots: 8, afterScreenshots: 8, screenshotEvidence,
  caveat: 'Review slice depends on existing shared foundations. Actual page JSX uses synthetic data/actions; no authenticated, RSC, notification, or care-flow integration claim.',
};
await fs.writeFile(path.join(output, filename), patch);
await fs.writeFile(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest, null, 2));
