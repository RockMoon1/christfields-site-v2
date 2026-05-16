import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
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
    template: '%s by Christ Fields',
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
    apple: '/assets/logo.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#060908',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
      <body className="bg-black text-ivory antialiased">{children}</body>
    </html>
  );
}
