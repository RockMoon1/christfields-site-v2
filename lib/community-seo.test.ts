import { describe, expect, it } from 'vitest';
import { communitySchema, serializeSchema } from './community-seo';
import sitemap from '@/app/sitemap';

describe('public discovery data', () => {
  it('keeps text from ending the JSON-LD script', () => {
    const value = { name: '</script><script>alert("injected")</script>' };
    const encoded = serializeSchema(value);
    expect(encoded).not.toContain('<');
    expect(JSON.parse(encoded)).toEqual(value);
  });

  it('references the existing organization without inventing a place or event', () => {
    const graph = communitySchema('/small-groups', 'Small groups', 'Local community')['@graph'];
    expect(graph[0]).toMatchObject({
      '@type': 'WebPage',
      about: { '@id': 'https://christfields2717.com/#organization' },
      url: 'https://christfields2717.com/small-groups',
    });
    expect(graph.map((node) => node['@type'])).toEqual(['WebPage', 'BreadcrumbList']);
  });

  it('discovers new pages without assigning unrelated build dates', () => {
    const routes = sitemap();
    for (const path of ['/small-groups', '/finding-community', '/about']) {
      expect(routes.find((route) => route.url === `https://christfields2717.com${path}`)).toBeDefined();
    }
    expect(routes.find((route) => route.url === 'https://christfields2717.com/')?.lastModified).toBeUndefined();
    expect(routes.find((route) => route.url.endsWith('/journal/what-faithflow-is-and-is-not'))?.lastModified).toEqual(new Date('2026-09-28'));
  });
});
