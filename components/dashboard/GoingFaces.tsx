import type { RsvpFace } from '@/lib/schedule/public-event';

/**
 * Who is in, as faces before numbers. First names and photos snapshotted when
 * each person answered; a gold circle with an initial when there is no photo;
 * a plain gold circle when the snapshot is blank (answers made before this
 * version). Declines never appear here.
 */
export function GoingFaces({ faces, compact = false }: { faces: RsvpFace[]; compact?: boolean }) {
  const going = faces.filter((f) => f.status === 'going');
  const maybe = faces.filter((f) => f.status === 'maybe');
  if (going.length === 0 && maybe.length === 0) {
    return <p className={compact ? 'text-xs text-muted' : 'text-sm text-muted'}>Nobody has answered yet. Be the first.</p>;
  }

  const shown = going.slice(0, compact ? 4 : 6);
  const rest = going.length - shown.length;
  const names = shown.map((f) => f.displayName).filter(Boolean);
  let line = '';
  if (going.length === 0) line = `${maybe.length} not sure yet`;
  else if (names.length === going.length && going.length <= 3) line = `${joinNames(names)} ${going.length === 1 ? 'is' : 'are'} in`;
  else if (names.length > 0) line = `${joinNames(names.slice(0, 2))} and ${going.length - Math.min(2, names.length)} others are in`;
  else line = `${going.length} are in`;
  if (going.length > 0 && maybe.length > 0) line += `, ${maybe.length} not sure`;

  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-2">
        {shown.map((f, i) => (
          <Face key={`${f.displayName}-${i}`} face={f} size={compact ? 26 : 32} />
        ))}
        {rest > 0 && (
          <span
            className="flex items-center justify-center rounded-full border border-black-2 bg-black-4 text-[10px] font-medium text-ivory-dim"
            style={{ width: compact ? 26 : 32, height: compact ? 26 : 32 }}
          >
            +{rest}
          </span>
        )}
      </div>
      <p className={compact ? 'text-xs text-ivory-dim' : 'text-sm text-ivory-dim'}>{line}</p>
    </div>
  );
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

export function Face({ face, size = 32 }: { face: { displayName: string; imageUrl: string }; size?: number }) {
  const initial = face.displayName.trim().charAt(0).toUpperCase();
  if (face.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={face.imageUrl}
        alt={face.displayName || ''}
        width={size}
        height={size}
        className="rounded-full border border-black-2 object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-label={face.displayName || 'A member'}
      className="flex items-center justify-center rounded-full border border-black-2 bg-gold/20 font-display text-sm text-gold-lt"
      style={{ width: size, height: size }}
    >
      {initial}
    </span>
  );
}
