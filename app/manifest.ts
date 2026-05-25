import type { MetadataRoute } from 'next';

/**
 * Web App Manifest. Lets the site be installed to a phone home screen or a
 * desktop ("Add to Home Screen" / "Install app"): it gets the Christ Fields
 * icon, launches full-screen (display: standalone) with no browser chrome, and
 * opens straight to the site. Next automatically links this at
 * /manifest.webmanifest, so no <link> tag is needed.
 *
 * Icons use the square, dark-background BIMI mark (SVG scales crisply at any
 * size and works as a maskable icon since it already has a solid background).
 * iOS home-screen icons come from the apple-touch-icon in app/layout.tsx.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Christ Fields',
    short_name: 'Christ Fields',
    description: 'A Christian technology company and community. Iron sharpens iron.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#060908',
    theme_color: '#060908',
    icons: [
      { src: '/icons/icon-192.png', type: 'image/png', sizes: '192x192', purpose: 'any' },
      { src: '/icons/icon-512.png', type: 'image/png', sizes: '512x512', purpose: 'any' },
      { src: '/icons/icon-512.png', type: 'image/png', sizes: '512x512', purpose: 'maskable' },
      // Bonus: crisp at any size on browsers that support SVG manifest icons.
      { src: '/bimi-logo.svg', type: 'image/svg+xml', sizes: 'any', purpose: 'any' },
    ],
  };
}
