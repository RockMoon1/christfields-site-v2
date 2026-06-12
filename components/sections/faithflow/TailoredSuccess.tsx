'use client';

import { motion } from 'motion/react';
import type {
  ContentSection,
  ResourceSection,
  ScriptureSection,
  TailoredContent,
} from '@/lib/content/faithflow';

export function TailoredSuccess({ content }: { content: TailoredContent }) {
  return (
    <motion.div
      className="ff-success-content text-left"
      initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.75, delay: 0.1 }}
    >
      <div className="mx-auto mb-7 h-px max-w-xs bg-gradient-to-r from-transparent via-gold to-transparent opacity-50" />

      <p className="mb-2 text-center text-[11px] font-medium uppercase tracking-[0.22em] text-gold">
        {content.eyebrow}
      </p>
      <h4 className="mb-10 text-center font-display text-3xl font-light leading-tight tracking-wide text-ivory">
        {content.title}
      </h4>

      <div className="space-y-10">
        {content.sections.map((section, i) => (
          <SectionBlock key={`${section.type}-${i}`} section={section} index={i} />
        ))}
      </div>
    </motion.div>
  );
}

function SectionBlock({ section, index }: { section: ContentSection; index: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, delay: 0.18 + index * 0.06 }}
    >
      <h5 className="mb-3 border-b border-border-sub pb-2 font-display text-xl font-medium tracking-wide text-gold-lt">
        {section.heading}
      </h5>

      {section.type === 'prose' && (
        <div className="space-y-3 text-[15px] leading-relaxed text-ivory-dim">
          {section.paragraphs.map((p, i) => (
            <p key={i} dangerouslySetInnerHTML={{ __html: p }} />
          ))}
        </div>
      )}

      {section.type === 'list' && (
        <ul className="divide-y divide-border-sub">
          {section.items.map((item, i) => (
            <li key={i} className="flex gap-3 py-3 text-sm leading-relaxed text-ivory-dim">
              <span aria-hidden className="mt-1 text-xs text-gold">
                {'\u2726'}
              </span>
              <span dangerouslySetInnerHTML={{ __html: item }} />
            </li>
          ))}
        </ul>
      )}

      {section.type === 'scriptures' && <ScripturesGrid section={section} />}

      {section.type === 'resources' && <ResourceList section={section} />}
    </motion.section>
  );
}

function ScripturesGrid({ section }: { section: ScriptureSection }) {
  return (
    <ul className="grid gap-4">
      {section.items.map((s, i) => (
        <motion.li
          key={i}
          className="rounded-sm border border-border-sub bg-black-3 p-5"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, delay: 0.08 * i }}
        >
          <cite className="mb-2 block text-[11px] not-italic uppercase tracking-[0.16em] text-gold">
            {s.ref}
          </cite>
          <blockquote className="font-display text-base italic leading-relaxed text-ivory-dim">
            &ldquo;{s.text}&rdquo;
          </blockquote>
        </motion.li>
      ))}
    </ul>
  );
}

function ResourceList({ section }: { section: ResourceSection }) {
  return (
    <>
      {section.intro && (
        <p className="mb-4 text-sm leading-relaxed text-silver">{section.intro}</p>
      )}
      <ul className="border-t border-border-sub">
        {section.items.map((item) => (
          <li key={item.url} className="border-b border-border-sub">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 py-4 transition-colors duration-200 hover:bg-gold/[0.05]"
            >
              <div className="flex-1 transition-transform duration-300 ease-out group-hover:translate-x-1.5">
                <span className="block text-sm font-medium text-ivory transition-colors group-hover:text-gold-lt">
                  {item.name}
                </span>
                <span className="block text-xs leading-relaxed text-silver">{item.desc}</span>
              </div>
              <span
                aria-hidden
                className="text-gold opacity-70 transition-[opacity,transform] duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
              >
                &nearr;
              </span>
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
