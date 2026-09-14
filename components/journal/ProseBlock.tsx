import type { ReactNode } from 'react';

/** Reading content stays visible before hydration and while scrolling. */
export function ProseBlock({ as: Tag = 'p', id, className, children }: {
  as?: 'p' | 'h2' | 'h3' | 'div'; id?: string; className?: string; children: ReactNode;
}) {
  return <Tag id={id} className={className}>{children}</Tag>;
}

/** Authored words remain verbatim while quotation research is in progress. */
export function ScriptureQuote({ verse, citation }: { verse: string; citation?: string }) {
  return <blockquote className="my-12 border-y border-gold/25 py-8">
    <p className="font-display text-2xl italic leading-relaxed text-ivory sm:text-3xl">{verse}</p>
    {citation && <footer className="mt-5"><cite className="text-meta not-italic uppercase tracking-[0.16em] text-gold-lt">{citation}</cite></footer>}
  </blockquote>;
}
