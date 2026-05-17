import type { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/journal';

const BASE = 'https://christfields2717.com';

/**
 * Sitemap for Google and other search engines. Lists every route on the site
 * with a sensible last-modified date and priority. Journal posts are added
 * dynamically based on what currently exists in content/journal.
 *
 * Next.js serves this at /sitemap.xml automatically.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const today = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
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
      url: `${BASE}/journal`,
      lastModified: today,
      changeFrequency: 'weekly',
      priority: 0.85,
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

  const postRoutes: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${BASE}/journal/${post.slug}`,
    lastModified: new Date(post.frontmatter.date),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...postRoutes];
}
