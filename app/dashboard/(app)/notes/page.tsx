export default function NotesPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-10">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-gold">
          From Christ Fields
        </p>
        <h2 className="font-display text-4xl font-light text-ivory md:text-5xl">
          <em className="not-italic text-gold-lt">Notes</em> for you.
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-silver">
          Anything we want you to see, encouragements, scriptures, reminders, prayer
          requests, will show up here. Personal, never automated.
        </p>
      </header>

      <div className="rounded-sm border border-dashed border-border-sub bg-black-3/40 p-16 text-center">
        <p className="font-display text-xl italic text-silver">No notes yet.</p>
        <p className="mt-2 text-sm text-muted">
          When someone from Christ Fields writes you a note, you will see it here and get
          an email.
        </p>
      </div>
    </div>
  );
}
