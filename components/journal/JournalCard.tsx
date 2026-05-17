'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { CardSpotlight } from '../motion/CardSpotlight';
import { TiltCard } from '../motion/TiltCard';
import type { JournalPost } from '@/lib/journal';

interface JournalCardProps {
  post: JournalPost;
  /** Whether this is the first / large hero card on the index page. */
  featured?: boolean;
  /** Pass through index for stagger animations from parent grid. */
  index?: number;
}

/**
 * One journal post in the index grid. Tilt on hover plus a gold spotlight.
 * Cover area uses a soft colored gradient driven by the post frontmatter so
 * we do not yet need real images. When real cover images are added later,
 * swap the gradient for an <Image>.
 */
export function JournalCard({ post, featured = false, index = 0 }: JournalCardProps) {
  const fm = post.frontmatter;
  const coverColor = fm.cover?.color ?? '#C9A548';

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -40px 0px' }}
      transition={{
        duration: 0.65,
        ease: [0.22, 1, 0.36, 1],
        delay: 0.06 * index,
      }}
      className={featured ? 'md:col-span-2 md:row-span-2' : ''}
    >
      <TiltCard max={5}>
        <CardSpotlight className="h-full rounded-sm" size={featured ? 440 : 280}>
          <Link
            href={`/journal/${post.slug}`}
            className="group flex h-full flex-col overflow-hidden rounded-sm border border-border-sub bg-black-2 transition-[border-color] duration-300 hover:border-border-gold"
          >
            {/* Cover panel. Colored gradient driven by frontmatter cover.color. */}
            <div
              className="relative aspect-[16/9] w-full overflow-hidden"
              style={{
                background: `radial-gradient(ellipse at 30% 30%, ${coverColor}55 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, ${coverColor}22 0%, transparent 60%), #0c110e`,
              }}
            >
              {/* Subtle gold scanline that animates on hover. Pure CSS, no JS. */}
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />
              {/* Bottom hairline */}
              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent"
              />
            </div>

            {/* Body */}
            <div className="flex flex-1 flex-col p-6 md:p-7">
              <div className="mb-3 flex items-center gap-3 text-[11px] uppercase tracking-[0.16em]">
                <span className="text-gold">{fm.category}</span>
                <span className="text-muted">·</span>
                <span className="text-silver">
                  {new Date(fm.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>

              <h3
                className={
                  featured
                    ? 'mb-3 font-display text-3xl font-light leading-tight text-ivory transition-colors duration-300 group-hover:text-gold-lt md:text-4xl'
                    : 'mb-3 font-display text-2xl font-light leading-tight text-ivory transition-colors duration-300 group-hover:text-gold-lt'
                }
              >
                {fm.title}
              </h3>

              <p className="mb-4 line-clamp-3 flex-1 text-sm leading-relaxed text-silver md:text-base">
                {fm.excerpt}
              </p>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">{post.readingMinutes} min read</span>
                <span
                  aria-hidden
                  className="text-gold opacity-70 transition-[opacity,transform] duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
                >
                  Read →
                </span>
              </div>
            </div>
          </Link>
        </CardSpotlight>
      </TiltCard>
    </motion.article>
  );
}
