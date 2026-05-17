import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import readingTime from 'reading-time';

/**
 * Journal post types and loader.
 *
 * Each post lives as a single .mdx file in content/journal. The frontmatter
 * is parsed by gray-matter. Reading time is auto-computed from word count
 * unless explicitly set in the frontmatter.
 *
 * Posts are read off disk at build time (server components / static pages)
 * so this never runs in the browser. Sync fs calls are intentional.
 */

const JOURNAL_DIR = path.join(process.cwd(), 'content', 'journal');

export type JournalCategory = 'Devotional' | 'Build Notes' | 'FaithFlow' | 'Iron and Ember' | 'ScholarFlow';

export interface JournalFrontmatter {
  title: string;
  slug: string;
  date: string;
  category: JournalCategory;
  excerpt: string;
  cover?: {
    alt?: string;
    color?: string;
  };
  readingTime?: number;
}

export interface JournalPost {
  slug: string;
  frontmatter: JournalFrontmatter;
  /** Computed reading time in whole minutes. */
  readingMinutes: number;
  /** Raw MDX content. */
  body: string;
}

function readPostFile(filename: string): JournalPost | null {
  const filepath = path.join(JOURNAL_DIR, filename);
  if (!fs.existsSync(filepath)) return null;

  const raw = fs.readFileSync(filepath, 'utf8');
  const { data, content } = matter(raw);
  const fm = data as JournalFrontmatter;

  // Use the explicit reading time if set, otherwise compute from word count.
  const minutes = fm.readingTime ?? Math.max(1, Math.round(readingTime(content).minutes));

  return {
    slug: fm.slug || filename.replace(/\.mdx?$/, ''),
    frontmatter: fm,
    readingMinutes: minutes,
    body: content,
  };
}

/**
 * Return all journal posts, newest first.
 */
export function getAllPosts(): JournalPost[] {
  if (!fs.existsSync(JOURNAL_DIR)) return [];

  return fs
    .readdirSync(JOURNAL_DIR)
    .filter((name) => name.endsWith('.mdx') || name.endsWith('.md'))
    .map(readPostFile)
    .filter((p): p is JournalPost => p !== null)
    .sort((a, b) => (a.frontmatter.date < b.frontmatter.date ? 1 : -1));
}

/**
 * Find a single post by slug, or null if not found.
 */
export function getPostBySlug(slug: string): JournalPost | null {
  const all = getAllPosts();
  return all.find((p) => p.slug === slug) ?? null;
}

/**
 * Return the unique list of categories used by current posts, in display order.
 */
export function getAllCategories(): JournalCategory[] {
  const set = new Set<JournalCategory>();
  for (const post of getAllPosts()) {
    set.add(post.frontmatter.category);
  }
  // Preserve a stable order even if a category temporarily disappears.
  const order: JournalCategory[] = ['Devotional', 'Build Notes', 'FaithFlow', 'Iron and Ember', 'ScholarFlow'];
  return order.filter((c) => set.has(c));
}

/**
 * Get the post that comes after the given slug (older, since we sort newest first).
 * Used for the "next post" suggestion at the bottom of each article.
 */
export function getNextPost(currentSlug: string): JournalPost | null {
  const all = getAllPosts();
  const idx = all.findIndex((p) => p.slug === currentSlug);
  if (idx === -1 || idx === all.length - 1) return null;
  return all[idx + 1];
}
