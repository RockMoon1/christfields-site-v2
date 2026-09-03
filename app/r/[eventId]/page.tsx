import { TokenAnswer } from './TokenAnswer';

export const dynamic = 'force-dynamic';

/**
 * The one-tap answer page a reminder email or text links to. Outside
 * /dashboard, so Clerk never gates it. The server renders only a shell; the
 * browser reads the token from the URL fragment (never sent to any server or
 * scanner) and asks for the event basics.
 */
export default async function TokenPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  return (
    <main className="min-h-screen bg-black-2 px-4 py-8 text-ivory">
      <div className="mx-auto max-w-md">
        <p className="mb-6 text-center text-[10px] font-medium uppercase tracking-[0.24em] text-gold">Christ Fields</p>
        <TokenAnswer eventId={eventId} />
      </div>
    </main>
  );
}
