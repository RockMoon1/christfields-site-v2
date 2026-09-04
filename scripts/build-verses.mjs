// Build lib/dashboard/verses.json: 366 verses, one per day of the year, with
// public-domain World English Bible text and theme tags from the same lexicon
// that reads members' quiet reflections (lib/dashboard/themes.json).
//
// Run once (or when the list changes):  node scripts/build-verses.mjs
// Fetches from bible-api.com (WEB translation), politely, about one request per
// second. The output is committed; the app never fetches at runtime.

import { readFileSync, writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const OUT = new URL('../lib/dashboard/verses.json', import.meta.url);
const LEX = JSON.parse(readFileSync(new URL('../lib/dashboard/themes.json', import.meta.url), 'utf8'));

// Curated, in a rough sweep through the Bible, leaning on the passages a small
// group actually turns to. Slightly more than 366 so a failed fetch costs nothing.
const REFS = [
  'Genesis 1:1', 'Genesis 1:27', 'Genesis 2:18', 'Genesis 12:2', 'Genesis 15:6', 'Genesis 28:15', 'Genesis 50:20',
  'Exodus 3:14', 'Exodus 14:14', 'Exodus 15:2', 'Exodus 20:8-10', 'Exodus 33:14', 'Exodus 34:6',
  'Leviticus 19:18', 'Numbers 6:24-26', 'Numbers 23:19',
  'Deuteronomy 6:4-5', 'Deuteronomy 7:9', 'Deuteronomy 10:12', 'Deuteronomy 30:19-20', 'Deuteronomy 31:6', 'Deuteronomy 31:8', 'Deuteronomy 33:27',
  'Joshua 1:8', 'Joshua 1:9', 'Joshua 24:15', 'Ruth 1:16', '1 Samuel 12:24', '1 Samuel 16:7', '1 Samuel 17:47',
  '2 Samuel 22:31', '1 Kings 8:56', '1 Kings 19:12', '2 Kings 6:16', '1 Chronicles 16:11', '1 Chronicles 16:34', '1 Chronicles 28:20',
  '2 Chronicles 7:14', '2 Chronicles 15:7', '2 Chronicles 20:15', 'Nehemiah 8:10', 'Esther 4:14',
  'Job 1:21', 'Job 19:25', 'Job 23:10', 'Job 42:2',
  'Psalm 1:1-2', 'Psalm 3:3', 'Psalm 4:8', 'Psalm 5:3', 'Psalm 8:3-4', 'Psalm 9:9-10', 'Psalm 13:5-6', 'Psalm 16:8', 'Psalm 16:11',
  'Psalm 18:2', 'Psalm 19:1', 'Psalm 19:14', 'Psalm 20:7', 'Psalm 23:1-3', 'Psalm 23:4', 'Psalm 25:4-5', 'Psalm 27:1', 'Psalm 27:4',
  'Psalm 27:14', 'Psalm 28:7', 'Psalm 29:11', 'Psalm 30:5', 'Psalm 31:24', 'Psalm 32:8', 'Psalm 33:4', 'Psalm 33:20-22', 'Psalm 34:4',
  'Psalm 34:8', 'Psalm 34:17', 'Psalm 34:18', 'Psalm 37:4', 'Psalm 37:5', 'Psalm 37:23-24', 'Psalm 40:1-2', 'Psalm 42:11', 'Psalm 46:1',
  'Psalm 46:10', 'Psalm 51:10', 'Psalm 51:17', 'Psalm 55:22', 'Psalm 56:3', 'Psalm 57:10', 'Psalm 62:1-2', 'Psalm 62:8', 'Psalm 63:1',
  'Psalm 66:19-20', 'Psalm 68:19', 'Psalm 71:5', 'Psalm 73:26', 'Psalm 84:11', 'Psalm 86:5', 'Psalm 86:15', 'Psalm 90:12', 'Psalm 90:14',
  'Psalm 91:1-2', 'Psalm 91:4', 'Psalm 94:19', 'Psalm 95:6-7', 'Psalm 100:4-5', 'Psalm 103:2-4', 'Psalm 103:8', 'Psalm 103:12', 'Psalm 107:1',
  'Psalm 112:7', 'Psalm 116:1-2', 'Psalm 118:6', 'Psalm 118:24', 'Psalm 119:9-11', 'Psalm 119:50', 'Psalm 119:105', 'Psalm 119:114',
  'Psalm 119:165', 'Psalm 121:1-2', 'Psalm 121:7-8', 'Psalm 126:5', 'Psalm 127:1', 'Psalm 127:3', 'Psalm 130:5', 'Psalm 133:1',
  'Psalm 136:1', 'Psalm 138:8', 'Psalm 139:13-14', 'Psalm 139:23-24', 'Psalm 141:3', 'Psalm 143:8', 'Psalm 145:18', 'Psalm 147:3',
  'Psalm 150:6',
  'Proverbs 1:7', 'Proverbs 2:6', 'Proverbs 3:3-4', 'Proverbs 3:5-6', 'Proverbs 3:9-10', 'Proverbs 3:11-12', 'Proverbs 4:23', 'Proverbs 4:25-27',
  'Proverbs 10:12', 'Proverbs 11:2', 'Proverbs 11:25', 'Proverbs 12:18', 'Proverbs 12:22', 'Proverbs 12:25', 'Proverbs 13:20', 'Proverbs 14:29',
  'Proverbs 15:1', 'Proverbs 15:22', 'Proverbs 16:3', 'Proverbs 16:9', 'Proverbs 16:24', 'Proverbs 16:32', 'Proverbs 17:17', 'Proverbs 17:22',
  'Proverbs 18:10', 'Proverbs 18:24', 'Proverbs 19:21', 'Proverbs 20:7', 'Proverbs 21:21', 'Proverbs 22:6', 'Proverbs 27:1', 'Proverbs 27:17',
  'Proverbs 28:13', 'Proverbs 29:25', 'Proverbs 30:5', 'Proverbs 31:25',
  'Ecclesiastes 3:1', 'Ecclesiastes 3:11', 'Ecclesiastes 4:9-10', 'Ecclesiastes 4:12', 'Ecclesiastes 7:9', 'Ecclesiastes 11:4', 'Ecclesiastes 12:13',
  'Song of Solomon 8:7',
  'Isaiah 1:18', 'Isaiah 6:8', 'Isaiah 9:6', 'Isaiah 12:2', 'Isaiah 26:3', 'Isaiah 26:4', 'Isaiah 30:15', 'Isaiah 30:21', 'Isaiah 33:2',
  'Isaiah 35:4', 'Isaiah 40:8', 'Isaiah 40:11', 'Isaiah 40:29', 'Isaiah 40:31', 'Isaiah 41:10', 'Isaiah 41:13', 'Isaiah 43:1-2', 'Isaiah 43:18-19',
  'Isaiah 46:4', 'Isaiah 49:15-16', 'Isaiah 50:7', 'Isaiah 53:5', 'Isaiah 54:10', 'Isaiah 55:6-7', 'Isaiah 55:8-9', 'Isaiah 58:11',
  'Isaiah 61:1', 'Isaiah 61:3', 'Isaiah 64:8', 'Isaiah 65:24', 'Isaiah 66:13',
  'Jeremiah 1:5', 'Jeremiah 17:7-8', 'Jeremiah 29:11', 'Jeremiah 29:12-13', 'Jeremiah 31:3', 'Jeremiah 32:17', 'Jeremiah 33:3',
  'Lamentations 3:22-23', 'Lamentations 3:25-26', 'Lamentations 3:32',
  'Ezekiel 36:26', 'Daniel 3:17-18', 'Daniel 9:9', 'Hosea 6:6', 'Hosea 14:4', 'Joel 2:13', 'Joel 2:25', 'Amos 5:24', 'Jonah 2:2',
  'Micah 6:8', 'Micah 7:7', 'Micah 7:18', 'Nahum 1:7', 'Habakkuk 3:17-18', 'Habakkuk 3:19', 'Zephaniah 3:17', 'Haggai 2:4', 'Zechariah 4:6',
  'Malachi 3:6',
  'Matthew 4:4', 'Matthew 5:3-4', 'Matthew 5:6', 'Matthew 5:8', 'Matthew 5:9', 'Matthew 5:14-16', 'Matthew 5:44', 'Matthew 6:6', 'Matthew 6:9-10',
  'Matthew 6:14', 'Matthew 6:19-21', 'Matthew 6:26', 'Matthew 6:31-33', 'Matthew 6:34', 'Matthew 7:7', 'Matthew 7:12', 'Matthew 7:24-25',
  'Matthew 9:36-37', 'Matthew 10:29-31', 'Matthew 11:28-30', 'Matthew 12:20', 'Matthew 14:27', 'Matthew 16:24', 'Matthew 17:20', 'Matthew 18:3',
  'Matthew 18:20', 'Matthew 18:21-22', 'Matthew 19:26', 'Matthew 20:28', 'Matthew 22:37-39', 'Matthew 25:21', 'Matthew 25:40', 'Matthew 26:41',
  'Matthew 28:18-20',
  'Mark 1:15', 'Mark 4:39', 'Mark 8:36', 'Mark 9:23-24', 'Mark 10:27', 'Mark 10:45', 'Mark 11:24-25', 'Mark 12:30-31', 'Mark 14:38', 'Mark 16:15',
  'Luke 1:37', 'Luke 1:45', 'Luke 5:16', 'Luke 6:31', 'Luke 6:35-36', 'Luke 6:38', 'Luke 9:23', 'Luke 10:27', 'Luke 10:41-42', 'Luke 11:9-10',
  'Luke 12:7', 'Luke 12:32', 'Luke 12:34', 'Luke 14:11', 'Luke 15:7', 'Luke 15:20', 'Luke 16:10', 'Luke 17:6', 'Luke 18:1', 'Luke 18:27',
  'Luke 19:10', 'Luke 21:19', 'Luke 22:42', 'Luke 23:34',
  'John 1:1', 'John 1:5', 'John 1:12', 'John 1:14', 'John 3:16', 'John 3:17', 'John 3:30', 'John 4:14', 'John 6:35', 'John 6:37', 'John 8:12',
  'John 8:32', 'John 8:36', 'John 10:10', 'John 10:11', 'John 10:27-28', 'John 11:25-26', 'John 12:46', 'John 13:34-35', 'John 14:1',
  'John 14:6', 'John 14:27', 'John 15:4-5', 'John 15:7', 'John 15:9', 'John 15:12-13', 'John 16:24', 'John 16:33', 'John 17:3', 'John 20:29',
  'Acts 1:8', 'Acts 2:42', 'Acts 2:46-47', 'Acts 3:19', 'Acts 4:12', 'Acts 4:31', 'Acts 16:31', 'Acts 17:27-28', 'Acts 20:24', 'Acts 20:35',
  'Romans 1:16', 'Romans 3:23-24', 'Romans 5:1', 'Romans 5:3-5', 'Romans 5:8', 'Romans 6:4', 'Romans 6:23', 'Romans 7:24-25', 'Romans 8:1',
  'Romans 8:6', 'Romans 8:11', 'Romans 8:15', 'Romans 8:18', 'Romans 8:26', 'Romans 8:28', 'Romans 8:31', 'Romans 8:37-39', 'Romans 10:9',
  'Romans 10:13', 'Romans 11:33', 'Romans 12:1', 'Romans 12:2', 'Romans 12:9-10', 'Romans 12:12', 'Romans 12:15', 'Romans 12:18', 'Romans 12:21',
  'Romans 13:8', 'Romans 14:17', 'Romans 15:4', 'Romans 15:5-6', 'Romans 15:13',
  '1 Corinthians 1:9', '1 Corinthians 1:18', '1 Corinthians 2:9', '1 Corinthians 6:19-20', '1 Corinthians 10:13', '1 Corinthians 10:31',
  '1 Corinthians 12:27', '1 Corinthians 13:4-5', '1 Corinthians 13:7', '1 Corinthians 13:12', '1 Corinthians 13:13', '1 Corinthians 15:57-58',
  '1 Corinthians 16:13-14',
  '2 Corinthians 1:3-4', '2 Corinthians 3:17', '2 Corinthians 4:8-9', '2 Corinthians 4:16-18', '2 Corinthians 5:7', '2 Corinthians 5:17',
  '2 Corinthians 5:21', '2 Corinthians 9:7-8', '2 Corinthians 10:5', '2 Corinthians 12:9', '2 Corinthians 12:10', '2 Corinthians 13:11',
  'Galatians 2:20', 'Galatians 5:1', 'Galatians 5:13', 'Galatians 5:22-23', 'Galatians 5:26', 'Galatians 6:2', 'Galatians 6:9', 'Galatians 6:10',
  'Ephesians 1:7', 'Ephesians 2:4-5', 'Ephesians 2:8-9', 'Ephesians 2:10', 'Ephesians 2:19', 'Ephesians 3:17-19', 'Ephesians 3:20-21',
  'Ephesians 4:2-3', 'Ephesians 4:15', 'Ephesians 4:25', 'Ephesians 4:26-27', 'Ephesians 4:29', 'Ephesians 4:32', 'Ephesians 5:1-2',
  'Ephesians 5:15-16', 'Ephesians 6:10-11', 'Ephesians 6:18',
  'Philippians 1:6', 'Philippians 1:9-10', 'Philippians 1:21', 'Philippians 2:3-4', 'Philippians 2:5-7', 'Philippians 2:13', 'Philippians 3:8',
  'Philippians 3:13-14', 'Philippians 3:20', 'Philippians 4:4-5', 'Philippians 4:6-7', 'Philippians 4:8', 'Philippians 4:11-12', 'Philippians 4:13',
  'Philippians 4:19',
  'Colossians 1:16-17', 'Colossians 2:6-7', 'Colossians 3:1-2', 'Colossians 3:12', 'Colossians 3:13', 'Colossians 3:14-15', 'Colossians 3:16',
  'Colossians 3:17', 'Colossians 3:23-24', 'Colossians 4:2', 'Colossians 4:6',
  '1 Thessalonians 5:11', '1 Thessalonians 5:16-18', '1 Thessalonians 5:24', '2 Thessalonians 3:3', '2 Thessalonians 3:5',
  '1 Timothy 1:15', '1 Timothy 4:12', '1 Timothy 6:6-7', '1 Timothy 6:12', '2 Timothy 1:7', '2 Timothy 2:13', '2 Timothy 2:15', '2 Timothy 3:16-17',
  '2 Timothy 4:7', 'Titus 2:11-12', 'Titus 3:4-5',
  'Hebrews 4:12', 'Hebrews 4:15-16', 'Hebrews 6:19', 'Hebrews 10:23', 'Hebrews 10:24-25', 'Hebrews 11:1', 'Hebrews 11:6', 'Hebrews 12:1-2',
  'Hebrews 12:11', 'Hebrews 13:5', 'Hebrews 13:8', 'Hebrews 13:16',
  'James 1:2-4', 'James 1:5', 'James 1:12', 'James 1:17', 'James 1:19-20', 'James 1:22', 'James 3:17', 'James 4:7-8', 'James 4:10', 'James 5:16',
  '1 Peter 1:3', '1 Peter 1:6-7', '1 Peter 2:9', '1 Peter 2:24', '1 Peter 3:15', '1 Peter 4:8', '1 Peter 4:10', '1 Peter 5:6-7', '1 Peter 5:10',
  '2 Peter 1:3', '2 Peter 3:9', '2 Peter 3:18',
  '1 John 1:9', '1 John 3:1', '1 John 3:18', '1 John 4:4', '1 John 4:7', '1 John 4:9-10', '1 John 4:18', '1 John 4:19', '1 John 5:4',
  '1 John 5:14', 'Jude 1:24-25',
  'Revelation 1:8', 'Revelation 3:20', 'Revelation 21:4', 'Revelation 21:5', 'Revelation 22:13', 'Revelation 22:17',
];

// Verse tagging: same lexicon as members' reflections, so a member carrying
// grief meets a verse tagged grief.
function esc(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function normalize(text) {
  return ` ${text.toLowerCase().replace(/[‘’]/g, "'").replace(/[^a-z0-9'\s-]/g, ' ').replace(/\s+/g, ' ')} `;
}
function countHits(hay, term) {
  const re = new RegExp(`(^|[^a-z0-9])${esc(term)}(?=$|[^a-z0-9])`, 'g');
  let n = 0;
  while (re.exec(hay)) n += 1;
  return n;
}
function tag(text) {
  const hay = normalize(text);
  const scored = [];
  for (const [key, t] of Object.entries(LEX.themes)) {
    let score = 0;
    for (const w of t.words) score += countHits(hay, w.toLowerCase());
    for (const p of t.phrases) score += countHits(hay, p.toLowerCase());
    if (score > 0) scored.push({ key, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map((s) => s.key);
}

// Make sure every theme's own passage is in the list.
for (const t of Object.values(LEX.themes)) if (!REFS.includes(t.passage)) REFS.push(t.passage);

async function fetchVerse(ref) {
  const url = `https://bible-api.com/${encodeURIComponent(ref)}?translation=web`;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const res = await fetch(url, { headers: { accept: 'application/json', 'user-agent': 'christfields-verses/1.0' } });
      if (res.status === 429) {
        await sleep(5000 * (attempt + 1));
        continue;
      }
      if (!res.ok) return null;
      const json = await res.json();
      const text = String(json.text || '').replace(/\s+/g, ' ').trim();
      if (!text) return null;
      return { ref: json.reference || ref, text };
    } catch {
      await sleep(2000);
    }
  }
  return null;
}

const out = [];
const seen = new Set();
let failed = 0;
for (const ref of REFS) {
  if (seen.has(ref)) continue;
  seen.add(ref);
  const v = await fetchVerse(ref);
  if (!v) {
    failed += 1;
    console.error('skip', ref);
  } else {
    out.push({ ref: v.ref, text: v.text, tags: tag(v.text) });
    process.stdout.write(`\r${out.length} fetched`);
  }
  await sleep(900);
}
console.log(`\n${out.length} verses, ${failed} skipped`);
if (out.length < 366) console.error(`WARNING: only ${out.length} verses; add references to reach 366`);
writeFileSync(OUT, JSON.stringify(out, null, 0) + '\n');
console.log('wrote', OUT.pathname);
