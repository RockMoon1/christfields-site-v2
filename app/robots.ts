import type { MetadataRoute } from 'next';

/**
 * Robots.txt for crawlers. Allows all bots to crawl everything and points
 * them at the sitemap so they discover new routes automatically.
 *
 * Next.js serves this at /robots.txt automatically.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    sitemap: 'https://christfields2717.com/sitemap.xml',
    host: 'https://christfields2717.com',
  };
}
