import type { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { Container } from '@/components/Container';
import { Footer } from '@/components/Footer';
import { Nav } from '@/components/Nav';
import { communitySchema, serializeSchema } from '@/lib/community-seo';
import styles from './community.module.css';

const links = [
  { href: '/small-groups', label: 'Small groups' },
  { href: '/faithflow', label: 'FaithFlow' },
  { href: '/about', label: 'About' },
  { href: '/faithflow#get-involved', label: 'Ask about a group', cta: true },
];

export function CommunityPage({ path, label, eyebrow, title, description, children }: {
  path: string; label: string; eyebrow: string; title: string; description: string; children: ReactNode;
}) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeSchema(communitySchema(path, label, description)) }} />
      <Nav links={links} alwaysScrolled />
      <main id="main" className={styles.page}>
        <Container>
          <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
            <Link href="/">Christ Fields</Link><span aria-hidden>/</span><span aria-current="page">{label}</span>
          </nav>
          <header className={styles.header}>
            <p className={styles.eyebrow}>{eyebrow}</p>
            <h1>{title}</h1>
            <p className={styles.lede}>{description}</p>
            <Button href="/faithflow#get-involved" fx={false} className={styles.button}>Ask about a group <span aria-hidden>→</span></Button>
          </header>
          {children}
          <section className={styles.invitation} aria-labelledby="next-step">
            <p className={styles.eyebrow}>A place to begin</p>
            <h2 id="next-step">Start with a conversation.</h2>
            <p>Tell us a little about yourself, your general area, and the kind of community you are looking for. We can talk through current availability and a possible next step.</p>
            <div className={styles.actions}>
              <Button href="/faithflow#get-involved" fx={false} className={styles.button}>Get in touch <span aria-hidden>→</span></Button>
              <a href="mailto:proverbs@christfields2717.com" className={styles.textLink}>Email Christ Fields</a>
            </div>
            <p className={styles.note}>An inquiry starts a conversation; it does not reserve a place in a group.</p>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}

export { styles as communityStyles };
