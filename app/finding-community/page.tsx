import Link from 'next/link';
import { CommunityPage, communityStyles as s } from '@/components/community/CommunityPage';
import { communityMetadata } from '@/lib/community-seo';

const description = 'Feeling lonely or looking for Christian friendship near Centennial or Parker? Learn about connection through Iron and Ember, the FaithFlow community at Christ Fields.';
export const metadata = communityMetadata('/finding-community', 'Finding Christian community near Centennial and Parker', description);

export default function FindingCommunityPage() {
  return (
    <CommunityPage path="/finding-community" label="Finding community" eyebrow="Christian friendship · A first conversation" title="You can start where you are." description={description}>
      <section className={s.section} aria-labelledby="connection">
        <h2 id="connection">Wanting connection is a place to start.</h2>
        <div>
          <p>Maybe you are new to the area, missing close friendships, or feeling disconnected even when people are around. You do not need a polished explanation to ask about community.</p>
          <p>FaithFlow brings people together around Christian faith, Scripture, prayer, and shared life. Iron and Ember is our in-person community in Colorado, with small groups forming within it. Our outreach focuses on Centennial, Parker, and the surrounding south Denver area.</p>
          <p>A group can be a place to get to know people and walk alongside them. Building friendship takes time; we do not promise an instant sense of belonging or a particular emotional outcome.</p>
        </div>
      </section>
      <section className={s.section} aria-labelledby="message">
        <h2 id="message">Your first message can be simple.</h2>
        <div>
          <p>You might say: “I live near Parker and I am looking for Christian friends. Could you tell me about your small groups?”</p>
          <p>Tell us your general area and what you hope to find. You do not need to share private struggles or medical information in an inquiry. We can start with practical questions about the community, current availability, and what a possible next step would look like.</p>
          <p><Link href="/small-groups">See how our small-group inquiries work</Link>.</p>
        </div>
      </section>
      <section className={s.section} aria-labelledby="support">
        <h2 id="support">Community, with honest boundaries.</h2>
        <div>
          <p>FaithFlow is Christian community, not professional counseling, mental-health treatment, or a crisis service. Friendship and spiritual encouragement can sit alongside professional support; they are not a replacement for it.</p>
          <p>If you need immediate emotional support in the United States, call or text <a href="tel:988">988</a> or visit the <a href="https://988lifeline.org/">988 Lifeline</a>. If you are in immediate danger, call 911. Our inquiry form is not monitored for emergencies.</p>
        </div>
      </section>
    </CommunityPage>
  );
}
