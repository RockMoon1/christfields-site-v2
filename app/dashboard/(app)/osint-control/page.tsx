import { ControlConsole } from '@/components/osint-control/ControlConsole';
import { getOsintAdminAccess } from '@/lib/osint-control/admin';
import { getControlPanelData, OsintControlNotConfigured } from '@/lib/osint-control/store';

export const dynamic = 'force-dynamic';

export default async function OsintControlPage() {
  const access = await getOsintAdminAccess();

  if (!access.configured) {
    return (
      <GateCard
        eyebrow="Setup needed"
        title="Choose who can control OSINT access."
        body="Set OSINT_CONTROL_ADMIN_EMAILS or OSINT_CONTROL_ADMIN_USER_IDS in Netlify environment variables. Until that exists, this console denies everyone."
      />
    );
  }

  if (!access.allowed) {
    return (
      <GateCard
        eyebrow="Not allowed"
        title="This console is limited to explicit OSINT admins."
        body="Being signed in to Christ Fields is not enough. Add your verified Clerk email or Clerk user ID to the OSINT control allowlist."
      />
    );
  }

  try {
    const data = await getControlPanelData();
    return <ControlConsole data={data} />;
  } catch (err) {
    if (err instanceof OsintControlNotConfigured) {
      return (
        <GateCard
          eyebrow="Database setup"
          title="Run the OSINT control migration."
          body="Apply db/migrations/021_osint_control.sql to the Christ Fields Supabase project, then refresh this page."
        />
      );
    }
    console.error('OSINT control page failed', { name: err instanceof Error ? err.name : 'UnknownError' });
    return (
      <GateCard
        eyebrow="Unavailable"
        title="The control console could not load."
        body="The page is protected, but the database query failed. Check Netlify environment variables and Supabase health."
      />
    );
  }
}

function GateCard({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="mx-auto max-w-2xl">
      <section className="rounded-sm border border-border-gold bg-black-3 p-8">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.24em] text-gold">{eyebrow}</p>
        <h1 className="font-display text-3xl font-light leading-tight text-ivory">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-silver">{body}</p>
      </section>
    </div>
  );
}
