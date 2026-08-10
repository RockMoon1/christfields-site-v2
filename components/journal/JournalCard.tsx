'use client';

import Image from 'next/image';
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
 * One journal post in the index grid. Magazine treatment: the card is
 * unveiled with a staggered clip-path entrance (media grammar, not the
 * body-copy fade), the cover band carries the post's coverColor plus a
 * giant outlined category watermark, and hover answers with a cover glow
 * and a small title shift — transforms only, so the layout never moves.
 * Tilt on hover plus a gold spotlight. Covers with a real image
 * (cover.src) render it with a slow hover zoom and a legibility scrim;
 * posts without one keep the tinted-gradient band.
 */
export function JournalCard({ post, featured = false, index = 0 }: JournalCardProps) {
  const fm = post.frontmatter;
  const coverColor = fm.cover?.color ?? '#C9A548';

  return (
    <motion.article
      initial={{ opacity: 0, clipPath: 'inset(8% 6% 8% 6% round 8px)', scale: 0.985 }}
      whileInView={{ opacity: 1, clipPath: 'inset(0% 0% 0% 0% round 0px)', scale: 1 }}
      viewport={{ once: true, margin: '0px 0px -40px 0px' }}
      transition={{
        duration: 0.85,
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
            {/* Cover panel. Real image when the post has one, else the tinted
                gradient driven by frontmatter cover.color. */}
            <div
              className="relative aspect-[16/9] w-full overflow-hidden"
              style={{
                background: `radial-gradient(ellipse at 30% 30%, ${coverColor}55 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, ${coverColor}22 0%, transparent 60%), var(--color-black-2)`,
              }}
            >
              {fm.cover?.src && (
                <>
                  <Image
                    src={fm.cover.src}
                    alt=""
                    fill
                    sizes={featured ? '(min-width: 768px) 66vw, 100vw' : '(min-width: 768px) 33vw, 100vw'}
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  />
                  {/* Legibility scrim so the watermark and hairlines still read. */}
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25"
                  />
                </>
              )}
              {/* Outlined category watermark — magazine masthead texture for
                  the otherwise-empty cover band. Decorative only. */}
              <span
                aria-hidden
                className={
                  featured
                    ? 'cf-outline-text pointer-events-none absolute -bottom-2 left-4 select-none whitespace-nowrap font-display text-6xl font-light uppercase tracking-[0.06em] md:text-8xl'
                    : 'cf-outline-text pointer-events-none absolute -bottom-1 left-4 select-none whitespace-nowrap font-display text-5xl font-light uppercase tracking-[0.06em]'
                }
              >
                {fm.category}
              </span>
              {/* Cover glow keyed to the post color. Softly present at rest on
                  touch screens; answers the cursor on pointer devices. */}
              <div
                aria-hidden
                className="absolute inset-0 opacity-50 transition-opacity duration-500 md:opacity-0 md:group-hover:opacity-100"
                style={{
                  background: `radial-gradient(ellipse at 50% 100%, ${coverColor}40 0%, transparent 65%)`,
                }}
              />
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
                    ? 'mb-3 font-display text-3xl font-light leading-tight text-ivory transition-[color,transform] duration-300 group-hover:translate-x-1 group-hover:text-gold-lt md:text-4xl'
                    : 'mb-3 font-display text-2xl font-light leading-tight text-ivory transition-[color,transform] duration-300 group-hover:translate-x-1 group-hover:text-gold-lt'
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
