#!/usr/bin/env node
/**
 * Fails the build if any source file still reads or writes a table that
 * 019_drop_teaching.sql removes. Run as `npm run check:tables` (and in CI).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DROPPED = [
  'progress_areas',
  'progress_entries',
  'member_notes',
  'area_journal',
  'practices',
  'practice_logs',
  'prayer_requests',
  'gratitude_entries',
  'mood_checkins',
  'reflections',
  'thought_records',
  'memory_verses',
  'dashboard_prefs',
  'group_attendance',
  'ai_verse_usage',
];

const ROOTS = ['app', 'lib', 'components'];
const EXT = new Set(['.ts', '.tsx']);
const pattern = new RegExp(`\\.from\\(\\s*['"\`](${DROPPED.join('|')})['"\`]`, 'g');

function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (EXT.has(p.slice(p.lastIndexOf('.')))) out.push(p);
  }
  return out;
}

const hits = [];
for (const root of ROOTS) {
  let files = [];
  try {
    files = walk(root, []);
  } catch {
    continue;
  }
  for (const f of files) {
    const text = readFileSync(f, 'utf8');
    let m;
    while ((m = pattern.exec(text)) !== null) {
      const line = text.slice(0, m.index).split('\n').length;
      hits.push(`${f}:${line} uses dropped table ${m[1]}`);
    }
  }
}

if (hits.length > 0) {
  console.error('Dropped-table references found:\n' + hits.join('\n'));
  process.exit(1);
}
console.log('check:tables ok — no references to dropped tables.');
