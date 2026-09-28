import type { Metadata } from 'next';

const BASE = 'https://christfields2717.com';

export function communityMetadata(path: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: `${BASE}${path}` },
    openGraph: {
      type: 'website',
      siteName: 'Christ Fields',
      title,
      description,
      url: `${BASE}${path}`,
      images: [{ url: '/assets/og-image.png', width: 1200, height: 630, alt: 'Christ Fields' }],
    },
    twitter: { card: 'summary_large_image', title, description, images: ['/assets/og-image.png'] },
  };
}

/** Describes the public page without inventing a venue, event or local branch. */
export function communitySchema(path: string, name: string, description: string) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${BASE}${path}#webpage`,
        url: `${BASE}${path}`,
        name,
        description,
        inLanguage: 'en-US',
        isPartOf: { '@id': `${BASE}/#website` },
        about: { '@id': `${BASE}/#organization` },
        breadcrumb: { '@id': `${BASE}${path}#breadcrumb` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${BASE}${path}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Christ Fields', item: `${BASE}/` },
          { '@type': 'ListItem', position: 2, name, item: `${BASE}${path}` },
        ],
      },
    ],
  };
}

export function serializeSchema(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
