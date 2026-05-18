export default function PhotosPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-10">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-gold">
          Group memory
        </p>
        <h2 className="font-display text-4xl font-light text-ivory md:text-5xl">
          <em className="not-italic text-gold-lt">Photos.</em>
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-silver">
          Photos you and your group have taken. Once you upload, your moments will live
          here with a slow scroll animation we are still building.
        </p>
      </header>

      <div className="rounded-sm border border-dashed border-border-sub bg-black-3/40 p-16 text-center">
        <p className="font-display text-xl italic text-silver">Coming soon.</p>
        <p className="mt-2 text-sm text-muted">
          Photo upload and the 3D scroll gallery are the next thing we are building. Hold
          tight.
        </p>
      </div>
    </div>
  );
}
