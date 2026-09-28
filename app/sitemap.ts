import type { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/journal';

const BASE = 'https://christfields2717.com';

/**
 * Sitemap for Google and other search engines. Lists every route on the site
 * without inventing last-modified dates for static pages. Journal posts are added
 * dynamically based on what currently exists in content/journal.
 *
 * Next.js serves this at /sitemap.xml automatically.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/small-groups`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/finding-community`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/about`, changeFrequency: 'monthly', priority: 0.7 },
    {
      url: `${BASE}/`,
      changeFrequency: 'monthly',
      priority: 1.0,
    },
    {
      url: `${BASE}/faithflow`,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE}/scholarflow`,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE}/journal`,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${BASE}/faithflow-resources`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE}/scholarflow-resources`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE}/privacy`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE}/terms`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  const postRoutes: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${BASE}/journal/${post.slug}`,
    lastModified: new Date(post.frontmatter.updated ?? post.frontmatter.date),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...postRoutes];
}
