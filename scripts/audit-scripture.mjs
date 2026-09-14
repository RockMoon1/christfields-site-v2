/**
 * Offline, reproducible Scripture inventory. It never writes app data.
 * Run: node scripts/audit-scripture.mjs [--fetch-source]
 * The explicit fetch uses the Bible API provider's bulk source, not hundreds
 * of API calls. A source-text match is NOT a completed contextual review.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import ts from 'typescript';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = path.join(ROOT, 'docs/scripture');
const CACHE = path.join(OUT, 'source');
mkdirSync(CACHE, { recursive: true });
const REVISION = '7768dacf2653164dd036d14a2d3f877d925015d3';
const SOURCE = `https://raw.githubusercontent.com/seven1m/open-bibles/${REVISION}/eng-web.usfx.xml`;
const XML = path.join(CACHE, 'eng-web.usfx.xml');
const sha = (s) => createHash('sha256').update(s).digest('hex');
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const decode = (s) => s.replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
if (process.argv.includes('--fetch-source')) {
  const response = await fetch(SOURCE, { signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new Error(`Bulk source: HTTP ${response.status}`);
  const xml = await response.text();
  if (!xml.startsWith('<?xml') || !xml.includes('<book id="GEN">')) throw new Error('Unexpected XML source');
  writeFileSync(XML, xml);
  writeFileSync(path.join(CACHE, 'provenance.json'), JSON.stringify({ url: SOURCE, revision: REVISION, retrievedAt: new Date().toISOString(), sha256: sha(xml), bytes: Buffer.byteLength(xml), translation: 'World English Bible', edition: 'Classic family; pinned provider source snapshot. Not asserted identical to current eBible 2020 stable edition.', license: 'Public domain Bible text; https://ebible.org/eng-web/copyright.htm', providerDocumentation: 'https://bible-api.com/' }, null, 2) + '\n');
}

const BOOKS = [
  ['Genesis','GEN'],['Exodus','EXO'],['Leviticus','LEV'],['Numbers','NUM'],['Deuteronomy','DEU'],['Joshua','JOS'],['Judges','JDG'],['Ruth','RUT'],['1 Samuel','1SA'],['2 Samuel','2SA'],['1 Kings','1KI'],['2 Kings','2KI'],['1 Chronicles','1CH'],['2 Chronicles','2CH'],['Ezra','EZR'],['Nehemiah','NEH'],['Esther','EST'],['Job','JOB'],['Psalm','PSA'],['Proverbs','PRO'],['Ecclesiastes','ECC'],['Song of Solomon','SNG'],['Isaiah','ISA'],['Jeremiah','JER'],['Lamentations','LAM'],['Ezekiel','EZK'],['Daniel','DAN'],['Hosea','HOS'],['Joel','JOL'],['Amos','AMO'],['Obadiah','OBA'],['Jonah','JON'],['Micah','MIC'],['Nahum','NAM'],['Habakkuk','HAB'],['Zephaniah','ZEP'],['Haggai','HAG'],['Zechariah','ZEC'],['Malachi','MAL'],['Matthew','MAT'],['Mark','MRK'],['Luke','LUK'],['John','JHN'],['Acts','ACT'],['Romans','ROM'],['1 Corinthians','1CO'],['2 Corinthians','2CO'],['Galatians','GAL'],['Ephesians','EPH'],['Philippians','PHP'],['Colossians','COL'],['1 Thessalonians','1TH'],['2 Thessalonians','2TH'],['1 Timothy','1TI'],['2 Timothy','2TI'],['Titus','TIT'],['Philemon','PHM'],['Hebrews','HEB'],['James','JAS'],['1 Peter','1PE'],['2 Peter','2PE'],['1 John','1JN'],['2 John','2JN'],['3 John','3JN'],['Jude','JUD'],['Revelation','REV'],
];
const names = [...BOOKS.map(([n]) => n), 'Psalms', 'Song of Songs'].sort((a,b) => b.length-a.length);
const REF = new RegExp(`\\b(${names.join('|')})\\s+(\\d{1,3})(?::(\\d{1,3})(?:[-–](?:(\\d{1,3}):)?(\\d{1,3}))?)?`, 'g');
const refs = (s) => [...String(s).matchAll(REF)].map(m => ({ raw:m[0], ref:m[0].replace(/^Psalms /,'Psalm ').replace(/^Song of Songs /,'Song of Solomon ').replaceAll('–','-'), index:m.index }));
function parse(ref) {
  const m = [...ref.matchAll(REF)][0];
  if (!m || m[0].length !== ref.length) return null;
  const name = m[1].replace('Psalms','Psalm').replace('Song of Songs','Song of Solomon');
  return { book:name, bookId:BOOKS.find(([n])=>n===name)?.[1], chapter:Number(m[2]), verseStart:m[3]?Number(m[3]):null, chapterEnd:m[4]?Number(m[4]):Number(m[2]), verseEnd:m[5]?Number(m[5]):m[3]?Number(m[3]):null };
}
// The pinned USFX has explicit <v/> and <ve/> boundaries. Drop notes from verse
// text, retain them separately; no punctuation or quotation-mark repairs.
const chapters = {};
if (existsSync(XML)) {
  const xml = readFileSync(XML,'utf8');
  for (const book of xml.matchAll(/<book id="([^"]+)">([\s\S]*?)<\/book>/g)) {
    let chapter=0;
    for (const item of book[2].matchAll(/<c id="(\d+)"\s*\/>|<v id="(\d+)"\s*\/>([\s\S]*?)<ve\s*\/>/g)) {
      if (item[1]) { chapter=Number(item[1]); continue; }
      if (!chapter) continue;
      const body=item[3];
      const footnotes=[...body.matchAll(/<f\b[^>]*>([\s\S]*?)<\/f>/g)].map(m=>norm(decode(m[1].replace(/<[^>]*>/g,''))));
      const text=norm(decode(body.replace(/<f\b[^>]*>[\s\S]*?<\/f>/g,'').replace(/<x\b[^>]*>[\s\S]*?<\/x>/g,'').replace(/<[^>]*>/g,'')));
      (chapters[`${book[1]}:${chapter}`]??=[]).push({ verse:Number(item[2]), text, ...(footnotes.length?{footnotes}:{}) });
    }
  }
  if (Object.keys(chapters).length<1100) throw new Error('Incomplete source parsing');
}
function passage(ref) {
  const p=parse(ref); if (!p) return null;
  const result=[];
  for(let c=p.chapter;c<=p.chapterEnd;c++) {
    const chapter=chapters[`${p.bookId}:${c}`]; if(!chapter) return null;
    result.push(...chapter.filter(v=>(c!==p.chapter||p.verseStart===null||v.verse>=p.verseStart)&&(c!==p.chapterEnd||p.verseEnd===null||v.verse<=p.verseEnd)).map(v=>({chapter:c,...v})));
  }
  return result.length?{ ...p, text:result.map(v=>v.text).join(' '), verses:result, chapterSource:`https://bible-api.com/data/web/${p.bookId}/${p.chapter}` }:null;
}
function flags(text) {
  return [
    ...(text.split('“').length!==text.split('”').length?['unbalanced-curly-double-quotes']:[]),
    ...(/[,;:]\s*$/.test(text)?['ends-with-continuation-punctuation']:[]),
    ...(/[.…]{3}|…/.test(text)?['ellipsis-present']:[]),
  ];
}
const files = execFileSync('git',['ls-files','-z','--','app','components','content','lib'],{cwd:ROOT,encoding:'utf8'}).split('\0').filter(Boolean).filter(f=>/\.(?:tsx?|mdx|json)$/.test(f)&&!f.endsWith('.test.ts')&&!f.endsWith('.test.tsx')&&f!=='lib/dashboard/verses.json');
const usages=[];const quotations=[];const claims=[];const fileManifest=[];
for(const file of files) {
  const source=readFileSync(path.join(ROOT,file),'utf8');
  fileManifest.push({file,sha256:sha(source)});
  const lines=source.split(/\r?\n/);
  const lineAt=(pos)=>source.slice(0,pos).split('\n').length;
  for(const r of refs(source)) usages.push({...r,file,line:lineAt(r.index),sourceExcerpt:lines.slice(Math.max(0,lineAt(r.index)-3),lineAt(r.index)+2).join('\n'),classification:'reference occurrence; may be comment, placeholder, application, or quotation'});
  const addQuote=(ref,text,line,extraction)=> {
    if(!text?.trim()) return;
    quotations.push({ref,text:decode(text),file,line,extraction});
  };
  if(file.endsWith('.mdx')) {
    lines.forEach((line,i)=>{
      const rr=refs(line);
      if(/^\s*>/.test(line)&&rr.length) addQuote(rr[0].ref,line.replace(/^\s*>\s*/,'').slice(0,rr[0].index-line.indexOf('>')-2).replace(/\s*[—–-]\s*$/,'').trim(),i+1,'MDX blockquote');
      if(/\b(?:God|Jesus|Christ|[Ss]cripture|[Bb]iblical|[Bb]ible|[Gg]ospel|[Ss]in|[Ss]alvation)\b/.test(line)&&line.trim()) claims.push({file,line:i+1,text:line,reviewStatus:'application-review-pending'});
    });
    continue;
  }
  if(file==='lib/dashboard/themes.json') {
    const lexicon=JSON.parse(source);
    for(const [theme,record] of Object.entries(lexicon.themes)) claims.push({file,jsonPointer:`/themes/${theme}/nudge`,ref:record.passage,text:record.nudge,audience:'leader-facing application guidance',reviewStatus:'application-review-pending; selection inputs frozen'});
  }
  if(file.endsWith('.json')) continue;
  const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,file.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  const propName=(p)=>ts.isPropertyAssignment(p)&&(ts.isIdentifier(p.name)||ts.isStringLiteral(p.name))?p.name.text:null;
  const literal=(node)=>node&&(ts.isStringLiteralLike(node)||ts.isJsxText(node))?node.text:null;
  const visit=(node)=>{
    if(ts.isObjectLiteralExpression(node)) {
      const rp=node.properties.find(p=>['ref','scriptureRef'].includes(propName(p)));
      const tp=node.properties.find(p=>['text','quote','scriptureText','verse'].includes(propName(p)));
      if(rp&&tp&&literal(rp.initializer)&&literal(tp.initializer)) for(const r of refs(literal(rp.initializer))) addQuote(r.ref,literal(tp.initializer),lineAt(tp.initializer.getStart(ast)),'object ref/text pair');
    }
    if(ts.isArrayLiteralExpression(node)) {
      for(let i=1;i<node.elements.length;i++) {
        const right=literal(node.elements[i]),left=literal(node.elements[i-1]);
        if(right&&left&&refs(right).length===1&&refs(right)[0].raw===right&&!refs(left).length) addQuote(refs(right)[0].ref,left,lineAt(node.elements[i-1].getStart(ast)),'adjacent quote/reference array pair');
      }
    }
    const value=literal(node);
    if(value&&value.trim()) {
      const rr=refs(value);
      if(rr.length&&value.length>rr[0].raw.length+12&&/[“”"']/.test(value)&&!/^Write the passage like /.test(value)) addQuote(rr[0].ref,value,lineAt(node.getStart(ast)),'literal containing quotation and reference; verify presentation');
      if(/\b(?:God|Jesus|Christ|[Ss]cripture|[Bb]iblical|[Bb]ible|[Gg]ospel|[Ss]in|[Ss]alvation)\b/.test(value)&&value.length>30) claims.push({file,line:lineAt(node.getStart(ast)),text:value,reviewStatus:'application-review-pending'});
    }
    ts.forEachChild(node,visit);
  };visit(ast);
}
const corpusRaw=readFileSync(path.join(ROOT,'lib/dashboard/verses.json'),'utf8');
const corpus=JSON.parse(corpusRaw);
const manualFile=path.join(OUT,'manual-quotation-pairs.json');
if(existsSync(manualFile)) quotations.push(...JSON.parse(readFileSync(manualFile,'utf8')).map(q=>({...q,extraction:'manually paired from source markup; recorded baseline location'})));
const reviewFile=path.join(OUT,'reviewed-passages.json');
const reviews=existsSync(reviewFile)?JSON.parse(readFileSync(reviewFile,'utf8')):[];
const byRef=new Map(reviews.flatMap(r=>(r.refs??[r.ref]).map(ref=>[ref,r])));
const corpusInventory=corpus.map((v,index)=>{
  const source=passage(v.ref);
  const matching=source?norm(v.text)===norm(source.text):false;
  return {index,...v,normalizedReference:parse(v.ref),translation:{name:'World English Bible',edition:'Classic family; provider snapshot',provenanceStatus:matching?'verified-against-pinned-provider-source':'requires-review',sourceUrl:SOURCE},sourceText:source?.text??null,sourceComparison:source?(matching?'exact-after-whitespace-normalization':'different'):'source-unavailable',flags:flags(v.text),usages:[{file:'lib/dashboard/verses.json',jsonPointer:`/${index}`},...usages.filter(u=>u.ref===v.ref)],dynamicUsage:['verseForDay → VerseCard','verseForTheme → quiet reflection (selection frozen)'],review:byRef.get(v.ref)??{status:'pending-contextual-review',textStates:null,historicalReconstruction:null,interpretationAndApplication:null,crossReferences:[],uncertainties:['No reviewed literary boundary, speaker/audience analysis, or application assessment yet.']} };
});
const seen=new Set();
const quoteInventory=quotations.filter(q=>{const key=`${q.file}:${q.line}:${q.ref}:${q.text}`;if(seen.has(key))return false;seen.add(key);return true;}).map((q,index)=>{
  const source=passage(q.ref);
  const clean=norm(q.text.replace(/^[“"]|[”"]$/g,''));
  const match=source?clean===source.text:false;
  return {id:`Q${String(index+1).padStart(3,'0')}`,...q,sourceText:source?.text??null,sourceComparison:!source?'source-unavailable':match?'exact-after-whitespace-and-outer-quote-normalization':source.text.includes(clean)?'verbatim-excerpt':'different-or-extraction-needs-review',translation:match?'World English Bible, Classic provider snapshot':'unverified; do not label as WEB',proposedAction:match?'keep-exact-wording':'preserve-current-wording-pending-reviewed-change',review:byRef.get(q.ref)??{status:'pending-contextual-review'}};
});
const relevant=new Set([...corpus.map(v=>v.ref),...usages.map(u=>u.ref),...reviews.flatMap(r=>[r.boundary,...(r.crossReferences??[]).map(c=>c.ref)])].filter(Boolean).flatMap(ref=>{const p=parse(ref);return p?Array.from({length:p.chapterEnd-p.chapter+1},(_,i)=>`${p.bookId}:${p.chapter+i}`):[]}));
const relevantChapters=Object.fromEntries([...relevant].sort().filter(k=>chapters[k]).map(k=>[k,chapters[k]]));
const summary={generatedAt:new Date().toISOString(),corpusEntries:corpus.length,corpusSha256:sha(corpusRaw),sourceSnapshot:existsSync(XML)?sha(readFileSync(XML)):null,corpusSourceMatches:corpusInventory.filter(v=>v.sourceComparison==='exact-after-whitespace-normalization').length,corpusSourceDifferences:corpusInventory.filter(v=>v.sourceComparison==='different').length,curlyQuoteFlags:corpusInventory.filter(v=>v.flags.includes('unbalanced-curly-double-quotes')).length,continuationPunctuationFlags:corpusInventory.filter(v=>v.flags.includes('ends-with-continuation-punctuation')).length,authoredFilesScanned:files.length,referenceOccurrences:usages.length,extractedQuotations:quoteInventory.length,claimCandidates:claims.length,reviewedPassageRecords:reviews.length,corpusWithContextReview:corpusInventory.filter(v=>v.review.status!=='pending-contextual-review').length,remainingCorpusContextReview:corpusInventory.filter(v=>v.review.status==='pending-contextual-review').length,stage5Ready:false,limitations:['Reference/claim extraction is an inventory aid, not proof of semantic exhaustiveness.','Some JSX split across nodes requires manual quotation pairing.','No runtime member-entered text or private files were accessed.','Source matching and cached chapters do not constitute a complete hermeneutic review.','Current UI changes may move source line numbers; file hashes identify this scan.']};
const write=(name,data)=>writeFileSync(path.join(OUT,name),JSON.stringify(data,null,2)+'\n');
write('inventory.json',{summary,fileManifest,corpus:corpusInventory,quotations:quoteInventory,referenceOccurrences:usages,claimCandidates:claims});
write('chapters.json',{provenance:existsSync(path.join(CACHE,'provenance.json'))?JSON.parse(readFileSync(path.join(CACHE,'provenance.json'),'utf8')):null,chapters:relevantChapters});
write('summary.json',summary);
const cell=(x)=>String(x??'').replaceAll('|','\\|').replaceAll('\n',' ');
writeFileSync(path.join(OUT,'QUOTATION-CHANGE-TABLE.md'),`# Quotation change table\n\nGenerated from tracked authored source. This is a review queue, not an authorization to replace quotations. Raw source strings are preserved in inventory.json; a reference-containing template can include markup. No quotation changes have been applied by this script.\n\n| ID | Passage | Location | Current wording | Comparison to pinned WEB source | Proposed action |\n| --- | --- | --- | --- | --- | --- |\n`+quoteInventory.map(q=>`| ${q.id} | ${q.ref} | ${q.file}:${q.line} | ${cell(q.text)} | ${q.sourceComparison} | ${q.proposedAction} |`).join('\n')+'\n');
console.log(JSON.stringify(summary,null,2));
