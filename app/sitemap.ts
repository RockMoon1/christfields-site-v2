import type { MetadataRoute } from 'next';

const BASE = 'https://christfields2717.com';

/**
 * Sitemap for Google and other search engines. Lists every route on the site
 * with a sensible last-modified date and priority.
 *
 * Next.js serves this at /sitemap.xml automatically.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const today = new Date();
  return [
    {
      url: `${BASE}/`,
      lastModified: today,
      changeFrequency: 'monthly',
      priority: 1.0,
    },
    {
      url: `${BASE}/faithflow`,
      lastModified: today,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE}/faithflow-resources`,
      lastModified: today,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE}/scholarflow-resources`,
      lastModified: today,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];
}
