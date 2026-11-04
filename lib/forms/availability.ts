export const POLL_SLUG = 'november-2026-car-camping';
export const POLL_TITLE = 'November car camping';
export const POLL_DATES = Array.from({ length: 30 }, (_, i) => `2026-11-${String(i + 1).padStart(2, '0')}`);
export const NOTICE_VERSION = '2026-11-04';
export type PollAnswer = {
  submissionId: string; name: string; interest: 'yes' | 'maybe' | 'no';
  available: string[]; unavailable: string[]; notes: string; consent: true; ageConfirmed: true;
};
export function validateAnswer(value: unknown, allowedDates = POLL_DATES): PollAnswer | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (typeof v.submissionId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v.submissionId)) return null;
  if (typeof v.name !== 'string' || !v.name.trim() || v.name.length > 80 || /[\x00-\x1f\x7f]/.test(v.name)) return null;
  if (!['yes', 'maybe', 'no'].includes(String(v.interest))) return null;
  if (typeof v.notes !== 'string' || v.notes.length > 1000 || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(v.notes)) return null;
  const dates = (x: unknown): x is string[] => Array.isArray(x) && x.length <= 62 && x.every(d => typeof d === 'string' && allowedDates.includes(d)) && new Set(x).size === x.length;
  if (!dates(v.available) || !dates(v.unavailable) || v.available.some(d => (v.unavailable as string[]).includes(d))) return null;
  if (v.consent !== true || v.ageConfirmed !== true) return null;
  return { submissionId: v.submissionId, name: v.name.trim(), interest: v.interest as PollAnswer['interest'], available: [...v.available].sort(), unavailable: [...v.unavailable].sort(), notes: v.notes.trim(), consent: true, ageConfirmed: true };
}
export function dateLabel(date: string) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
}
