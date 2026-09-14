import { createServer } from 'vite';
import tailwindcss from '@tailwindcss/postcss';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { createHash } from 'node:crypto';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const fixtureRoot = path.join(repoRoot, 'tests/browser/fixture');
const fixtureFile = (name) => path.join(fixtureRoot, name);
const logoBytes = fs.readFileSync(path.join(repoRoot, 'public/assets/logo.png'));
const aliases = [
  { find: '@/app/dashboard/(app)/community/actions', replacement: fixtureFile('actions.ts') },
  { find: '@/app/dashboard/(app)/events/actions', replacement: fixtureFile('actions.ts') },
  { find: '@/app/dashboard/(app)/settings/actions', replacement: fixtureFile('actions.ts') },
  { find: '@/app/dashboard/(app)/availability/actions', replacement: fixtureFile('actions.ts') },
  { find: '@/app/dashboard/(app)/feedback/actions', replacement: fixtureFile('actions.ts') },
  { find: '@/components/dashboard/PushSetup', replacement: fixtureFile('excluded-push.tsx') },
  { find: '@clerk/nextjs', replacement: fixtureFile('clerk.tsx') },
  { find: 'next/navigation', replacement: fixtureFile('next-navigation.ts') },
  { find: 'next/link', replacement: fixtureFile('next-link.tsx') },
  { find: 'next/image', replacement: fixtureFile('next-image.tsx') },
  { find: '@', replacement: repoRoot },
];

// Reuse exact Latin font bytes from the existing local build; never fetch fonts.
const fontFiles = new Map();
const fontFaces = new Set();
const fontSources = [];
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const cssDir = path.join(repoRoot, '.next/static/css');
if (fs.existsSync(cssDir)) {
  for (const name of fs.readdirSync(cssDir).filter((name) => name.endsWith('.css')).sort()) {
    const source = fs.readFileSync(path.join(cssDir, name), 'utf8');
    const faces = [...source.matchAll(/@font-face\{[^}]*\}/g)].map(([face]) => face)
      .filter((face) => /font-family:(?:Inter|Cormorant Garamond);/.test(face) && /unicode-range:u\+00\?\?/i.test(face));
    if (!faces.length) continue;
    fontSources.push({ file: `.next/static/css/${name}`, sha256: sha256(source) });
    for (const face of faces) {
      const asset = face.match(/url\(\/_next\/static\/media\/([\w.-]+\.woff2)\)/)?.[1];
      if (!asset) continue;
      const bytes = fs.readFileSync(path.join(repoRoot, '.next/static/media', asset));
      fontFiles.set(`/fixture-fonts/${asset}`, bytes);
      fontFaces.add(face.replace(`/_next/static/media/${asset}`, `/fixture-fonts/${asset}`));
    }
  }
}
const fontManifest = {
  mode: fontFaces.size ? 'verified-local-build-latin-fonts' : 'fallback-fonts-no-local-build',
  sources: fontSources,
  assets: [...fontFiles].map(([url, bytes]) => ({ url, bytes: bytes.length, sha256: sha256(bytes) })),
};
const mockedAsyncPages = new Set(['settings', 'availability', 'community'].map((area) => path.join(repoRoot, `app/dashboard/(app)/${area}/page.tsx`).replaceAll('\\', '/')));

const server = await createServer({
  configFile: false,
  root: fixtureRoot,
  cacheDir: path.join(repoRoot, 'node_modules/.vite-browser-fixture'),
  // Never read the app's .env.local or expose production configuration.
  envDir: false,
  publicDir: false,
  resolve: { alias: aliases },
  esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
  css: { postcss: { plugins: [tailwindcss({ base: repoRoot })] } },
  server: {
    host: '127.0.0.1', port: 3100, strictPort: true,
    fs: { allow: [repoRoot], deny: ['.env', '.env.*', '**/.env*', '**/docs/private/**', '**/.git/**'] },
  },
  plugins: [{
    name: 'fixture-local-fonts',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = new URL(request.url ?? '/', 'http://127.0.0.1:3100').pathname;
        if (pathname === '/assets/logo.png') {
          response.setHeader('Content-Type', 'image/png');
          response.end(logoBytes);
        } else if (pathname === '/fixture-fonts.css') {
          response.setHeader('Content-Type', 'text/css');
          response.end([...fontFaces].join('\n'));
        } else if (pathname === '/fixture-fonts.json') {
          response.setHeader('Content-Type', 'application/json');
          response.end(JSON.stringify(fontManifest));
        } else if (fontFiles.has(pathname)) {
          response.setHeader('Content-Type', 'font/woff2');
          response.end(fontFiles.get(pathname));
        } else next();
      });
    },
  }, {
    name: 'fixture-service-boundary', enforce: 'pre',
    resolveId(source, importer) {
      if (source === './actions' && mockedAsyncPages.has(importer?.split('?')[0].replaceAll('\\', '/'))) {
        return fixtureFile('actions.ts');
      }
      if (/lib\/(supabase|groups\/membership|notify|security\/crypto)|@clerk\/.*\/server|next\/(server|cache)/.test(source)) {
        throw new Error(`Fixture attempted a service import: ${source}`);
      }
      if (/\/actions(?:\.[cm]?[jt]sx?)?$/.test(source) && !source.includes('fixture') && !source.startsWith('./actions')) {
        throw new Error(`Unmocked server action in fixture: ${source}`);
      }
      return null;
    },
  }],
});

await server.listen();
console.log('Synthetic browser fixture ready at http://127.0.0.1:3100');
const stop = async () => { await server.close(); process.exit(0); };
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
