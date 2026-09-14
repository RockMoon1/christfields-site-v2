'use client';

import { motion } from 'motion/react';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { Button } from '../Button';
import { Container } from '../Container';

/** Words and actions are present at first paint. Only the background light
 * settles once; Scripture is selectable text without entrance choreography. */
export function Hero() {
  const reduce = useReducedMotion();
  return (
    <section id="home" className="relative isolate overflow-hidden border-b border-border-sub pt-[calc(var(--nav-h)+3rem)] pb-16 lg:min-h-[92svh] lg:pt-[calc(var(--nav-h)+4rem)] lg:pb-24">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_80%_50%,rgba(27,67,50,0.45),transparent_65%)]" />
      <motion.div aria-hidden initial={false} animate={reduce ? { opacity: 0.5 } : { opacity: [0.2, 0.65, 0.5] }} transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-2/3 bg-[radial-gradient(ellipse_at_60%_30%,rgba(201,165,72,0.1),transparent_60%)]" />
      <Container className="grid items-center gap-14 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
        <div>
          <h1 className="max-w-[8ch] font-display text-display-hero font-light tracking-[-0.025em] text-ivory">
            Iron<br />Sharpens<br /><span className="text-gold-lt">Iron.</span>
          </h1>
          <p className="mt-7 max-w-[43ch] text-base leading-relaxed text-ivory-dim sm:text-lg">
            A Christian community, and the tools to actually walk it out together. Grow with people
            who know your name, stay close to God, and sharpen each other along the way.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/scholarflow">Discover ScholarFlow <span aria-hidden>→</span></Button>
            <Button href="#vision" variant="ghost">Our Vision</Button>
          </div>
        </div>
        <div className="relative mb-4 lg:mb-0 lg:pl-5">
          <div aria-hidden className="pointer-events-none absolute -inset-x-4 -inset-y-7 border border-gold/10 sm:-inset-x-5 lg:left-0 lg:right-[-1.5rem] lg:-inset-y-8" />
          <div aria-hidden className="pointer-events-none absolute inset-y-6 -right-7 w-px bg-gold/25" />
          <blockquote className="relative border-y border-gold/35 bg-black-2/75 px-6 py-10 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.65)] sm:px-10 sm:py-14 lg:px-10 lg:py-20">
            <svg aria-hidden viewBox="0 0 40 28" fill="none" className="mb-9 h-7 w-10 text-gold/60"><path d="M15 2C7 5 3 11 3 21h12V10H8M36 2c-8 3-12 9-12 19h12V10h-7" stroke="currentColor" strokeWidth="1.2" /></svg>
            <p className="font-display text-[clamp(2rem,3.1vw,3rem)] font-light leading-[1.25] text-ivory">
              “As iron sharpens iron, so one person sharpens another.”
            </p>
            <footer className="mt-9 flex items-center gap-4">
              <span aria-hidden className="h-px w-10 bg-gold/60" />
              <cite className="text-meta not-italic uppercase tracking-[0.2em] text-gold-lt">Proverbs 27:17</cite>
            </footer>
          </blockquote>
        </div>
      </Container>
    </section>
  );
}
