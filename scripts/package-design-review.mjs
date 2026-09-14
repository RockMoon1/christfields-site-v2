import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Read-only Git inspection: this never stages, commits, resets, or applies a patch.
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 40 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
const base = git('rev-parse', 'HEAD').trim();
const destination = '.claude/recon/review-patches';
mkdirSync(destination, { recursive: true });
const tracked = git('diff', '--name-only', 'HEAD').trim().split('\n').filter(Boolean);
const untracked = git('ls-files', '--others', '--exclude-standard').trim().split('\n').filter(Boolean);
const ignoredPreexisting = new Set(['AGENTS.md', 'docs/LOVABLE-PROMPT-STUDY-DESK.md']);
const files = [...tracked, ...untracked].filter(p => !ignoredPreexisting.has(p) && !p.startsWith('.agents/') && !p.startsWith('.omc/'));
const foundation = new Set(['DESIGN.md', 'app/globals.css', 'components/Button.tsx', 'lib/use-reduced-motion.ts', 'lib/utils.ts', 'lib/utils.test.ts']);
const dashboard = new Set(['app/dashboard/layout.tsx', 'lib/clerk-appearance.ts',
  'components/lead/LeaderStrip.tsx', 'components/leader/RosterPanel.tsx',
  ...['TopBar', 'RouteSkeleton', 'CommunityWall', 'EventCard', 'ConfirmAction'].map(p => `components/dashboard/${p}.tsx`)]);
function group(path) {
  if (path.startsWith('docs/scripture/') || path === 'scripts/audit-scripture.mjs') return '01-scripture-inventory';
  if (foundation.has(path) || path.startsWith('components/ui/') || path === 'docs/design/skill-inventory.md') return '02-foundations';
  if (dashboard.has(path) || (path.startsWith('app/dashboard/(app)/') && path.endsWith('/page.tsx'))) return '04-dashboard-repairs';
  if (['components/Nav.tsx', 'components/Logo.tsx', 'components/Reveal.tsx', 'components/SectionHeader.tsx', 'app/template.tsx', 'components/sections/BentoGrid.tsx', 'components/sections/Values.tsx'].includes(path) || path.startsWith('components/motion/')) return '03a-motion-and-navigation';
  if (['components/sections/PracticesScroll.tsx', 'components/sections/DayScroll.tsx'].includes(path)) return '03c-public-contrast';
  if (path.startsWith('components/sections/') || path.startsWith('components/journal/') || path === 'app/page.tsx') return '03b-public-composition-draft';
  return '00-review-tooling-and-report';
}
const groups = Map.groupBy(files, group);
const packages = [];
for (const [name, paths] of [...groups].sort(([a], [b]) => a.localeCompare(b))) {
  const oldFiles = paths.filter(p => tracked.includes(p));
  let patch = oldFiles.length ? git('diff', '--binary', 'HEAD', '--', ...oldFiles) : '';
  for (const path of paths.filter(p => !tracked.includes(p))) {
    const result = spawnSync('git', ['diff', '--no-index', '--binary', '--', '/dev/null', path], { encoding: 'utf8', maxBuffer: 40 * 1024 * 1024 });
    if (![0, 1].includes(result.status)) throw new Error(result.stderr || `Cannot package ${path}`);
    patch += result.stdout;
  }
  const patchFile = `${destination}/${name}.patch`;
  writeFileSync(patchFile, patch);
  const check = spawnSync('git', ['apply', '--reverse', '--check', '--whitespace=nowarn', patchFile], { encoding: 'utf8' });
  if (check.status !== 0) throw new Error(`Patch check failed for ${name}: ${check.stderr}`);
  packages.push({ name, patch: patchFile, bytes: Buffer.byteLength(patch), sha256: createHash('sha256').update(patch).digest('hex'), files: paths.sort(), reverseApplyCheck: 'passed' });
}
const frozen = ['lib/dashboard/verses.json', 'lib/dashboard/themes.json', 'lib/dashboard/themes.ts', 'lib/dashboard/verses.ts', 'lib/dashboard/rhythm.ts', 'lib/dashboard/questions.ts', 'lib/groups/membership.ts', 'lib/schedule/public-event.ts'];
const invariants = frozen.map(path => {
  const original = git('show', `${base}:${path}`).replaceAll('\r\n', '\n');
  const current = readFileSync(path, 'utf8').replaceAll('\r\n', '\n');
  if (original !== current) throw new Error(`Frozen file changed: ${path}`);
  return { path, unchanged: true, sha256LF: createHash('sha256').update(current).digest('hex') };
});
const manifest = { base, capturedAt: new Date().toISOString(), notes: ['These are separate review patches against the named baseline, not commits.', 'Foundation includes the shared preference hook and CSS needed by later patches.', 'Public composition remains a draft. Scripture contextual review remains incomplete.', 'Pre-existing AGENTS.md, .agents, .omc and the unrelated study-desk prompt are excluded.'], packages, invariants };
writeFileSync(`${destination}/manifest.json`, JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(packages.map(({ name, files, bytes, reverseApplyCheck }) => ({ name, files: files.length, bytes, reverseApplyCheck })), null, 2));
