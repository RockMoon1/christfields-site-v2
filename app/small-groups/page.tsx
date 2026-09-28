import Link from 'next/link';
import { CommunityPage, communityStyles as s } from '@/components/community/CommunityPage';
import { communityMetadata } from '@/lib/community-seo';

const title = 'Christian small groups near Centennial and Parker';
const description = 'Looking for a Christian small group near Centennial or Parker, Colorado? Meet Iron and Ember, the FaithFlow community at Christ Fields, and ask about getting connected.';
export const metadata = communityMetadata('/small-groups', title, description);

export default function SmallGroupsPage() {
  return (
    <CommunityPage path="/small-groups" label="Small groups" eyebrow="FaithFlow · Centennial & Parker, Colorado" title="Faith grows in good company." description={description}>
      <section className={s.section} aria-labelledby="community">
        <h2 id="community">One community.<br />People who know you.</h2>
        <div>
          <p>Iron and Ember is the in-person FaithFlow community within Christ Fields. Small groups form within that wider community, with leaders who know their people. The purpose is to walk with Christ together through Scripture, prayer, friendship, and honest accountability.</p>
          <p>It is more than attending a meeting. It is making room for people in ordinary life, encouraging one another, and growing in faith together.</p>
          <p><Link href="/faithflow">Explore FaithFlow</Link> or read <Link href="/journal/iron-and-ember-our-community">how Iron and Ember became our community</Link>.</p>
        </div>
      </section>
      <section className={s.section} aria-labelledby="area">
        <h2 id="area">Connecting around Centennial and Parker.</h2>
        <div>
          <p>Our local outreach focuses on Centennial, Parker, and nearby communities in the south Denver area. If you are looking for a group within roughly a 35-minute drive of Centennial, we would like to hear where you are coming from.</p>
          <p>That is a starting point for a conversation, not a fixed travel boundary or a promise of a meeting in your city. Actual travel time depends on the meeting location and traffic. Ask us about current groups, availability, and meeting details before making plans.</p>
        </div>
      </section>
      <section className={s.section} aria-labelledby="begin">
        <h2 id="begin">How to take the first step.</h2>
        <ol>
          <li><strong>Reach out.</strong> Use the FaithFlow inquiry form and choose the option that best describes your interest.</li>
          <li><strong>Tell us what you are looking for.</strong> Your general area and what you hope for in a community are a useful start. Share only what you are comfortable sharing.</li>
          <li><strong>Talk through a possible fit.</strong> We can discuss current availability, expectations, and meeting details. Sending a message does not guarantee placement in a group.</li>
        </ol>
      </section>
      <section className={s.section} aria-labelledby="questions">
        <h2 id="questions">A few things you may be wondering.</h2>
        <dl className={s.faq}>
          <div><dt>Is this an in-person group or an online group?</dt><dd>Iron and Ember is an in-person community in Colorado. FaithFlow also provides tools that support the community between gatherings.</dd></div>
          <div><dt>Are groups open to new members right now?</dt><dd>You can ask about joining. Availability and the right next step depend on the current groups; the team will confirm those details with you.</dd></div>
          <div><dt>Where and when do you meet?</dt><dd>Ask the team for current meeting details before attending. This page does not publish a fixed schedule or a walk-in meeting address.</dd></div>
          <div><dt>Are there age requirements or costs?</dt><dd>Ask about eligibility, age requirements, and any costs for the specific group or activity you are considering. Those details should be confirmed before you commit.</dd></div>
          <div><dt>What if I am mostly looking for friendship?</dt><dd>Friendship is part of life together in FaithFlow. Read about <Link href="/finding-community">finding Christian community when you feel disconnected</Link>, then reach out to tell us what you are hoping for.</dd></div>
        </dl>
      </section>
    </CommunityPage>
  );
}
