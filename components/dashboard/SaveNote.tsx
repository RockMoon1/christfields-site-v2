'use client';

/**
 * One calm line for when a save did not go through.
 *
 * The Reflect cards used to swallow failures into console.error, so a member
 * who wrote something honest and lost it to a dropped connection just saw the
 * save button go quiet. This says so plainly, and reassures them that what
 * they typed is still on screen. aria-live so it is announced, not only seen.
 */
export const SAVE_FAILED = 'Could not save just now. Your words are still here. Try again.';

export function SaveNote({ message }: { message: string | null }) {
  return (
    <div aria-live="polite">
      {message && (
        <p className="rounded-sm border border-gold/35 bg-gold/[0.07] px-3 py-2 text-xs leading-relaxed text-ivory-dim">
          {message}
        </p>
      )}
    </div>
  );
}
