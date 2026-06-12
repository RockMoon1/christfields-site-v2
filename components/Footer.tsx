'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { Container } from './Container';
import { Logo } from './Logo';
import { Reveal } from './Reveal';

interface FooterColumn {
  heading: string;
  links: { href: string; label: string }[];
}

interface FooterProps {
  columns?: FooterColumn[];
}

const defaultColumns: FooterColumn[] = [
  {
    heading: 'Navigate',
    links: [
      { href: '/#vision', label: 'Vision' },
      { href: '/#projects', label: 'Projects' },
      { href: '/journal', label: 'Journal' },
      { href: '/#join', label: 'Join' },
    ],
  },
  {
    heading: 'Contact',
    links: [{ href: 'mailto:proverbs@christfields2717.com', label: 'proverbs@christfields2717.com' }],
  },
];

/**
 * Site footer. The page used to end on its flattest note; now it ends on a
 * brand moment: columns reveal in a left-to-right stagger as the footer
 * scrolls into view, and a giant outlined CHRIST FIELDS wordmark rises
 * gently behind the copyright bar with a small scroll parallax (a footer
 * flourish — the one place outside the hero parallax is allowed). The
 * flame mark reuses the shared <Logo /> so the footer fire never drifts
 * from the nav's.
 */
export function Footer({ columns = defaultColumns }: FooterProps) {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] });
  const wordmarkRise = useTransform(scrollYProgress, [0, 1], [64, 0]);

  return (
    <footer
      ref={ref}
      className="relative overflow-hidden border-t border-border-sub bg-black-2 pt-16"
    >
      <Container className="relative z-10">
        <div className="grid gap-12 md:grid-cols-3">
          <Reveal>
            <Logo size={56} />
            <p className="mt-4 font-display text-xl italic text-ivory-dim">Iron sharpens iron.</p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">Proverbs 27:17</p>
          </Reveal>

          {columns.map((col, i) => (
            <Reveal key={col.heading} delay={0.12 * (i + 1)}>
              <h4 className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-gold">
                {col.heading}
              </h4>
              <div className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm text-silver transition-colors hover:text-ivory"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </Container>

      {/* Giant outlined wordmark — a quiet watermark, not content. It rises
          a touch slower than the page (small y parallax) so the footer has
          depth without motion noise. */}
      <motion.div
        aria-hidden
        style={{ y: reduceMotion ? 0 : wordmarkRise }}
        className="pointer-events-none relative -mb-[2.5vw] mt-12 select-none"
      >
        <p className="cf-outline-text whitespace-nowrap text-center font-display text-[14vw] font-light leading-[0.85] tracking-[0.03em]">
          CHRIST FIELDS
        </p>
      </motion.div>

      <Container className="relative z-10">
        <div className="flex flex-col items-start justify-between gap-2 border-t border-border-sub pb-8 pt-6 text-xs text-muted md:flex-row md:items-center">
          <p>&copy; {new Date().getFullYear()} Christ Fields. All rights reserved.</p>
          <p className="font-display italic">As iron sharpens iron. Proverbs 27:17</p>
        </div>
      </Container>
    </footer>
  );
}
