'use client';

import { motion, type Variants } from 'motion/react';
import { Container } from '../../Container';
import { SectionHeader } from '@/components/SectionHeader';

type Tone = 'body' | 'strong' | 'accent';

interface Segment {
  text: string;
  tone: Tone;
}

/**
 * The manifesto, verbatim. Segments carry their original semantic emphasis
 * (strong for the opening declaration, em for the gold accent lines) so the
 * rendered text and document semantics stay character-for-character identical
 * to the original markup — only the entrance changed.
 */
const CREED: Segment[][] = [
  [
    {
      text: 'FaithFlow is not an app. It is not a brand or an online group.',
      tone: 'strong',
    },
    {
      text: 'FaithFlow is the Christ Fields community framework for real people walking together in Christ.',
      tone: 'body',
    },
  ],
  [
    { text: 'It is built on a simple truth:', tone: 'body' },
    { text: 'you do not grow alone.', tone: 'accent' },
    {
      text: 'Scripture teaches us that we need each other. Accountability, friendship, and faithful community are essential to discipleship.',
      tone: 'body',
    },
  ],
  [
    {
      text: 'FaithFlow creates space for people to gather in small groups, study Scripture together, walk through life’s challenges with honesty, and sharpen each other in faith, discipline, and truth.',
      tone: 'body',
    },
  ],
  [
    { text: 'This is real community.', tone: 'body' },
    { text: 'Not digital. Not transactional.', tone: 'accent' },
    {
      text: 'Friends meeting, doing life together, and helping each other follow Christ more faithfully.',
      tone: 'body',
    },
  ],
];

const WORD_STAGGER = 0.045;

const wordVariants: Variants = {
  hidden: { opacity: 0.12, y: 6 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * WORD_STAGGER, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  }),
};

const toneClass: Record<Tone, string> = {
  body: '',
  strong: 'font-normal text-ivory',
  accent: 'text-gold-lt',
};

/** Renders one segment's words as individually-animated spans. Words never
 *  break mid-word; the string itself is never altered. */
function SegmentWords({ segment, startIndex }: { segment: Segment; startIndex: number }) {
  const tokens = segment.text.split(/(\s+)/).filter((t) => t.length > 0);
  let wordIndex = startIndex;

  const content = tokens.map((token, i) => {
    if (/^\s+$/.test(token)) {
      return <span key={`s-${i}`}> </span>;
    }
    const idx = wordIndex;
    wordIndex += 1;
    return (
      <motion.span
        key={`${token}-${i}`}
        custom={idx}
        variants={wordVariants}
        className="inline-block whitespace-nowrap will-change-transform"
      >
        {token}
      </motion.span>
    );
  });

  if (segment.tone === 'strong') {
    return <strong className={toneClass.strong}>{content}</strong>;
  }
  if (segment.tone === 'accent') {
    return <em className={toneClass.accent}>{content}</em>;
  }
  return <>{content}</>;
}

/** One creed paragraph: a whileInView container whose words brighten from
 *  near-dark to full ivory in reading order, so reveal pace = reading pace. */
function CreedParagraph({ segments }: { segments: Segment[] }) {
  const fullText = segments.map((s) => s.text).join(' ');
  let offset = 0;

  return (
    <motion.p
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '0px 0px -18% 0px' }}
      aria-label={fullText}
      className="font-display text-[clamp(1.4rem,2.5vw,2rem)] font-light leading-[1.55] text-ivory-dim"
    >
      <span aria-hidden>
        {segments.map((segment, i) => {
          const start = offset;
          offset += segment.text.split(/\s+/).filter(Boolean).length;
          return (
            <span key={i}>
              {i > 0 && ' '}
              <SegmentWords segment={segment} startIndex={start} />
            </span>
          );
        })}
      </span>
    </motion.p>
  );
}

/**
 * The page's signature moment: the FaithFlow manifesto rendered as a creed.
 * Each paragraph's words sit nearly dark until the reader reaches them, then
 * brighten one by one at reading pace (transform/opacity only — cheap on
 * phones, and Motion honors reduced motion site-wide).
 */
export function WhatIsFaithFlow() {
  return (
    <section id="what" className="relative z-[2] py-[110px]">
      <Container>
        <SectionHeader
          align="left"
          eyebrow="The Framework"
          title={
            <>
              What Is <em className="not-italic text-gold-lt">FaithFlow?</em>
            </>
          }
          titleClassName="text-[clamp(2.4rem,4.5vw,3.75rem)] leading-[1.1]"
          className="mb-14"
        />

        <div className="max-w-3xl space-y-8">
          {CREED.map((segments, i) => (
            <CreedParagraph key={i} segments={segments} />
          ))}
        </div>
      </Container>
    </section>
  );
}
