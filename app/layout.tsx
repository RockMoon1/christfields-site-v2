import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import { MarketingFx } from '@/components/motion/MarketingFx';
import { MotionProvider } from '@/components/motion/MotionProvider';
import { SmoothScroll } from '@/components/motion/SmoothScroll';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://christfields2717.com'),
  title: {
    default: 'Christ Fields',
    // A neutral separator: "Privacy Policy by Christ Fields" read as authorship;
    // the middle dot works for products and plain pages alike.
    template: '%s · Christ Fields',
  },
  description:
    'Christ Fields is a technology company rooted in Christian faith. Building tools and communities for people who want to live and work with wisdom, integrity, and faithfulness.',
  openGraph: {
    type: 'website',
    siteName: 'Christ Fields',
    title: 'Christ Fields',
    description:
      'Christ Fields is a technology company rooted in Christian faith. Iron sharpens iron.',
    images: ['/assets/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Christ Fields',
    description: 'A Christian technology company. Iron sharpens iron.',
    images: ['/assets/og-image.png'],
  },
  icons: {
    icon: '/assets/logo.png',
    apple: '/icons/apple-icon-180.png',
  },
  // Lets iOS "Add to Home Screen" launch full-screen (no Safari chrome) with
  // the right title. Android/desktop standalone comes from the web manifest.
  appleWebApp: {
    capable: true,
    title: 'Christ Fields',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  themeColor: '#060908',
  width: 'device-width',
  initialScale: 1,
  // Lets the installed iOS app draw under the status bar; the dashboard chrome
  // pads with env(safe-area-inset-*) so nothing hides behind it.
  viewportFit: 'cover',
};

/**
 * Organization + WebSite structured data (JSON-LD). Helps search engines
 * understand who Christ Fields is and surface richer results. Rendered once,
 * site-wide, from the root layout.
 */
const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://christfields2717.com/#organization',
      name: 'Christ Fields',
      url: 'https://christfields2717.com',
      logo: 'https://christfields2717.com/assets/logo.png',
      email: 'proverbs@christfields2717.com',
      description:
        'A Christian technology company and community, building tools and groups for people who want to live and work with wisdom, integrity, and faithfulness.',
      slogan: 'Iron sharpens iron.',
    },
    {
      '@type': 'WebSite',
      '@id': 'https://christfields2717.com/#website',
      name: 'Christ Fields',
      url: 'https://christfields2717.com',
      inLanguage: 'en-US',
      publisher: { '@id': 'https://christfields2717.com/#organization' },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
      <body className="bg-black text-ivory antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <MotionProvider>
          <SmoothScroll>
            {/* Skip link. Visible only when focused via keyboard tab. */}
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-sm focus:bg-gold focus:px-4 focus:py-2 focus:text-xs focus:font-medium focus:uppercase focus:tracking-[0.12em] focus:text-black"
            >
              Skip to content
            </a>
            {/* Marketing-only effects; they skip /dashboard and /r on purpose. */}
            <MarketingFx />
            {children}
          </SmoothScroll>
        </MotionProvider>
      </body>
    </html>
  );
}
