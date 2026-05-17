import Link from 'next/link';
import Image from 'next/image';
import { Container } from './Container';

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

export function Footer({ columns = defaultColumns }: FooterProps) {
  return (
    <footer className="border-t border-border-sub bg-black-2 py-16">
      <Container>
        <div className="grid gap-12 md:grid-cols-3">
          <div>
            <div className="logo-fire-wrap" style={{ width: 56, height: 56 }}>
              <div className="logo-fire-glow" />
              <div className="logo-fire-glow2" />
              {Array.from({ length: 10 }).map((_, i) => (
                <span key={i} className={`logo-ember logo-ember-${i + 3}`} />
              ))}
              <Image
                src="/assets/logo.png"
                alt="Christ Fields"
                width={56}
                height={56}
                sizes="56px"
                loading="lazy"
                className="logo-fire-img relative z-[2]"
                style={{ width: 56, height: 'auto' }}
              />
            </div>
            <p className="mt-4 font-display text-xl italic text-ivory-dim">Iron sharpens iron.</p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">Proverbs 27:17</p>
          </div>

          {columns.map((col) => (
            <div key={col.heading}>
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
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-2 border-t border-border-sub pt-6 text-xs text-muted md:flex-row md:items-center">
          <p>&copy; {new Date().getFullYear()} Christ Fields. All rights reserved.</p>
          <p className="font-display italic">As iron sharpens iron. Proverbs 27:17</p>
        </div>
      </Container>
    </footer>
  );
}
