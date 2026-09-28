import Link from 'next/link';
import { CommunityPage, communityStyles as s } from '@/components/community/CommunityPage';
import { communityMetadata } from '@/lib/community-seo';

const description = 'Christ Fields is a Christian technology company and community. Get to know FaithFlow, the Iron and Ember community in Colorado, and ScholarFlow.';
export const metadata = communityMetadata('/about', 'About Christ Fields, FaithFlow and Iron and Ember', description);

export default function AboutPage() {
  return (
    <CommunityPage path="/about" label="About" eyebrow="Christ Fields · Faith, community & tools" title="Faith lived together." description={description}>
      <section className={s.section} aria-labelledby="fields">
        <h2 id="fields">What is Christ Fields?</h2>
        <div><p>Christ Fields brings Christian community and practical technology together. Our work is grounded in faith, connection, and helping people grow with others who know them.</p><p>FaithFlow is our framework for community. ScholarFlow is our learning-focused project. They are different parts of the Christ Fields ecosystem, with their own purposes.</p><p><Link href="/#vision">Read our vision</Link> and explore <Link href="/scholarflow">ScholarFlow</Link>.</p></div>
      </section>
      <section className={s.section} aria-labelledby="faithflow">
        <h2 id="faithflow">FaithFlow and Iron and Ember.</h2>
        <div><p>FaithFlow is the Christ Fields framework for walking together in Christian community. Iron and Ember is the in-person community within it, with leader-led small groups forming inside the wider community.</p><p>Shared Scripture, prayer, friendship, and accountability are part of that life together. The digital tools support people between gatherings; the community is made up of real relationships.</p><p><Link href="/faithflow">Learn about FaithFlow</Link> or read <Link href="/journal/iron-and-ember-our-community">the story of Iron and Ember</Link>.</p></div>
      </section>
      <section className={s.section} aria-labelledby="local">
        <h2 id="local">Rooted in Colorado.</h2>
        <div><p>Our community outreach focuses on Centennial, Parker, and nearby south Denver communities. If you are looking for Christian friendship or a small group in the area, we invite you to ask about current availability and meeting details.</p><p><Link href="/small-groups">Explore local small groups</Link> or <Link href="/finding-community">read about finding community</Link>.</p></div>
      </section>
    </CommunityPage>
  );
}
