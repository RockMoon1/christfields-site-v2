import Link from 'next/link';
import type { MDXComponents } from 'mdx/types';
import { cn } from '@/lib/utils';

/**
 * Custom MDX element renderers for journal posts.
 *
 * Every Markdown element gets a Christ Fields-styled equivalent. Headings use
 * the display serif. Blockquotes become scripture-styled cards. Links are
 * smartly routed (internal links use next/link, external get target=_blank).
 */
export const mdxComponents: MDXComponents = {
  h1: ({ children, ...rest }) => (
    <h1
      {...rest}
      className="mb-6 mt-12 font-display text-4xl font-light leading-tight text-ivory md:text-5xl"
    >
      {children}
    </h1>
  ),

  h2: ({ children, id, ...rest }) => (
    <h2
      {...rest}
      id={id}
      className="mb-4 mt-12 scroll-mt-28 font-display text-3xl font-light leading-tight text-ivory md:text-4xl"
    >
      {children}
    </h2>
  ),

  h3: ({ children, ...rest }) => (
    <h3
      {...rest}
      className="mb-3 mt-8 font-display text-2xl font-light text-ivory md:text-3xl"
    >
      {children}
    </h3>
  ),

  p: ({ children, ...rest }) => (
    <p
      {...rest}
      className="mb-5 text-base leading-relaxed text-ivory-dim md:text-lg"
    >
      {children}
    </p>
  ),

  // Blockquote becomes a scripture-style callout. Long quotes inside posts
  // should still feel like the verse cards elsewhere on the site.
  blockquote: ({ children, ...rest }) => (
    <blockquote
      {...rest}
      className="my-8 border-l-2 border-gold/60 bg-gold/[0.04] py-4 pl-6 pr-4"
    >
      <div className="font-display text-xl italic leading-relaxed text-ivory md:text-2xl">
        {children}
      </div>
    </blockquote>
  ),

  ul: ({ children, ...rest }) => (
    <ul {...rest} className="mb-5 ml-1 space-y-2 text-ivory-dim">
      {children}
    </ul>
  ),

  ol: ({ children, ...rest }) => (
    <ol {...rest} className="mb-5 ml-1 list-decimal space-y-2 pl-6 text-ivory-dim marker:text-gold">
      {children}
    </ol>
  ),

  li: ({ children, ...rest }) => (
    <li {...rest} className="relative pl-6 text-base leading-relaxed md:text-lg">
      <span aria-hidden className="absolute left-0 top-3 text-gold">✦</span>
      {children}
    </li>
  ),

  strong: ({ children, ...rest }) => (
    <strong {...rest} className="font-medium text-ivory">
      {children}
    </strong>
  ),

  em: ({ children, ...rest }) => (
    <em {...rest} className="text-gold-lt">
      {children}
    </em>
  ),

  hr: ({ ...rest }) => (
    <hr
      {...rest}
      className="my-12 h-px border-0 bg-gradient-to-r from-transparent via-gold/40 to-transparent"
    />
  ),

  a: ({ href = '', children, ...rest }) => {
    const isExternal = href.startsWith('http');
    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold-lt underline decoration-gold/40 decoration-1 underline-offset-4 transition-colors hover:text-gold hover:decoration-gold"
          {...rest}
        >
          {children}
        </a>
      );
    }
    return (
      <Link
        href={href}
        className="text-gold-lt underline decoration-gold/40 decoration-1 underline-offset-4 transition-colors hover:text-gold hover:decoration-gold"
      >
        {children}
      </Link>
    );
  },

  code: ({ children, className, ...rest }) => {
    // Inline code (no language class)
    if (!className) {
      return (
        <code
          {...rest}
          className="rounded-sm border border-border-sub bg-black-3 px-1.5 py-0.5 font-mono text-[0.92em] text-gold-lt"
        >
          {children}
        </code>
      );
    }
    // Code block (has language- class). Keep the className for syntax highlighters later.
    return (
      <code
        {...rest}
        className={cn('font-mono text-sm leading-relaxed text-ivory', className)}
      >
        {children}
      </code>
    );
  },

  pre: ({ children, ...rest }) => (
    <pre
      {...rest}
      className="my-6 overflow-x-auto rounded-sm border border-border-sub bg-black-3 p-5 text-sm"
    >
      {children}
    </pre>
  ),
};
