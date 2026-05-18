import { currentUser } from '@clerk/nextjs/server';

export default async function SettingsPage() {
  const user = await currentUser();

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-10">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-gold">
          Your account
        </p>
        <h2 className="font-display text-4xl font-light text-ivory md:text-5xl">
          <em className="not-italic text-gold-lt">Settings.</em>
        </h2>
      </header>

      <section className="rounded-sm border border-border-sub bg-black-3 p-8">
        <h3 className="mb-6 font-display text-2xl font-light text-ivory">Profile</h3>
        <dl className="grid gap-4 text-sm md:grid-cols-[160px_1fr]">
          <dt className="text-muted">Name</dt>
          <dd className="text-ivory">
            {user?.firstName || user?.username || 'Not set'}{' '}
            {user?.lastName || ''}
          </dd>
          <dt className="text-muted">Email</dt>
          <dd className="text-ivory">
            {user?.primaryEmailAddress?.emailAddress || 'Not set'}
          </dd>
          <dt className="text-muted">Member since</dt>
          <dd className="text-ivory">
            {user?.createdAt
              ? new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : 'Today'}
          </dd>
        </dl>

        <div className="mt-8 border-t border-border-sub pt-6">
          <p className="text-xs text-muted">
            To change your email, password, or profile photo, click your avatar in the top
            right and choose &ldquo;Manage account&rdquo;.
          </p>
        </div>
      </section>
    </div>
  );
}
