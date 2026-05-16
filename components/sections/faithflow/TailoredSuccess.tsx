import type {
  ContentSection,
  ResourceSection,
  ScriptureSection,
  TailoredContent,
} from '@/lib/content/faithflow';

/**
 * Renders the rich tailored content that appears inside the FaithFlow success
 * card. Each option in the form dropdown produces a different layout of prose,
 * lists, scripture cards, and resource links.
 *
 * HTML embedded inside paragraphs and list items (like <strong> and <em>) is
 * trusted because it comes from a static content file under our control, not
 * user input. dangerouslySetInnerHTML is intentional here.
 */
export function TailoredSuccess({ content }: { content: TailoredContent }) {
  return (
    <div className="ff-success-content text-left">
      <div className="mx-auto mb-7 h-px max-w-xs bg-gradient-to-r from-transparent via-gold to-transparent opacity-50" />

      <p className="mb-2 text-center text-[11px] font-medium uppercase tracking-[0.22em] text-gold">
        {content.eyebrow}
      </p>
      <h4 className="mb-10 text-center font-display text-3xl font-light leading-tight tracking-wide text-ivory">
        {content.title}
      </h4>

      <div className="space-y-10">
        {content.sections.map((section, i) => (
          <SectionBlock key={`${section.type}-${i}`} section={section} />
        ))}
      </div>
    </div>
  );
}

function SectionBlock({ section }: { section: ContentSection }) {
  return (
    <section>
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
            <li
              key={i}
              className="relative py-3 pl-7 text-sm leading-relaxed text-ivory-dim before:absolute before:left-0 before:top-3.5 before:text-xs before:text-gold before:content-['✦']"
              dangerouslySetInnerHTML={{ __html: item }}
            />
          ))}
        </ul>
      )}

      {section.type === 'scriptures' && <ScripturesGrid section={section} />}

      {section.type === 'resources' && <ResourceList section={section} />}
    </section>
  );
}

function ScripturesGrid({ section }: { section: ScriptureSection }) {
  return (
    <ul className="grid gap-4">
      {section.items.map((s, i) => (
        <li
          key={i}
          className="rounded-sm border border-border-sub bg-black-3 p-5"
        >
          <cite className="mb-2 block text-[11px] not-italic uppercase tracking-[0.16em] text-gold">
            {s.ref}
          </cite>
          <blockquote className="font-display text-base italic leading-relaxed text-ivory-dim">
            &ldquo;{s.text}&rdquo;
          </blockquote>
        </li>
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
              className="group flex items-center gap-3 py-4 transition-[background,padding] duration-200 hover:bg-gold/[0.05] hover:pl-3"
            >
              <div className="flex-1">
                <span className="block text-sm font-medium text-ivory transition-colors group-hover:text-gold-lt">
                  {item.name}
                </span>
                <span className="block text-xs leading-relaxed text-silver">{item.desc}</span>
              </div>
              <span
                aria-hidden
                className="text-gold opacity-70 transition-[opacity,transform] duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
              >
                ↗
              </span>
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
