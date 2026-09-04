/**
 * The quiet questions. One a week, rotating, plain, and never graded. They are
 * doors, not assignments: a member answers in private, keeps the words, and
 * gets a verse back. Nobody reads the answer.
 */

export interface QuietQuestion {
  key: string;
  text: string;
}

export const QUESTIONS: QuietQuestion[] = [
  { key: 'heaviest', text: 'What has been heaviest this week?' },
  { key: 'saw-god', text: 'Where did you see God this week, even for a second?' },
  { key: 'avoiding', text: 'What are you avoiding right now?' },
  { key: 'thankful-small', text: 'What small thing were you thankful for today?' },
  { key: 'hard-to-say', text: 'What is hard to say out loud right now?' },
  { key: 'tired-of', text: 'What are you tired of carrying?' },
  { key: 'need-prayer', text: 'If someone prayed for you tonight, what would you want them to pray?' },
  { key: 'forgive', text: 'Is there someone you are finding hard to forgive?' },
  { key: 'afraid', text: 'What are you afraid of this month?' },
  { key: 'hope-for', text: 'What are you quietly hoping for?' },
  { key: 'relationship', text: 'Which relationship needs attention right now?' },
  { key: 'temptation', text: 'Where do you keep falling in the same place?' },
  { key: 'rest', text: 'When did you last really rest?' },
  { key: 'honest-god', text: 'What would you say to God if you were completely honest?' },
  { key: 'proud-of', text: 'What are you a little proud of this week?' },
  { key: 'lonely', text: 'When did you feel most alone this week?' },
  { key: 'decision', text: 'What decision is sitting on you?' },
  { key: 'money', text: 'How is money feeling right now?' },
  { key: 'body', text: 'How is your body doing, honestly?' },
  { key: 'family', text: 'How are things at home?' },
  { key: 'work', text: 'What is work taking out of you?' },
  { key: 'doubt', text: 'What do you find hard to believe right now?' },
  { key: 'joy', text: 'What brought you joy this week?' },
  { key: 'regret', text: 'Is there something you wish you could undo?' },
  { key: 'growing', text: 'Where do you sense you are growing?' },
  { key: 'stuck', text: 'Where do you feel stuck?' },
  { key: 'gift', text: 'Who has been a gift to you lately?' },
  { key: 'anger', text: 'What made you angry this week, and why?' },
  { key: 'wish-known', text: 'What do you wish someone here knew about you?' },
  { key: 'next-step', text: 'What is one small step you could take this week?' },
];

/** ISO week number for a YYYY-MM-DD key (UTC arithmetic, same on every server). */
export function weekOf(dayKey: string): number {
  const y = Number(dayKey.slice(0, 4));
  const m = Number(dayKey.slice(5, 7)) - 1;
  const d = Number(dayKey.slice(8, 10));
  const date = new Date(Date.UTC(y, m, d));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = Date.UTC(date.getUTCFullYear(), 0, 1);
  return Math.ceil(((date.getTime() - yearStart) / 86_400_000 + 1) / 7);
}

/** "2026-W36": the key a reflection is filed under, so one question serves the whole week. */
export function weekKey(dayKey: string): string {
  const y = Number(dayKey.slice(0, 4));
  const w = weekOf(dayKey);
  return `${y}-W${w < 10 ? `0${w}` : w}`;
}

export function questionForWeek(dayKey: string): QuietQuestion {
  const y = Number(dayKey.slice(0, 4)) || 0;
  const idx = (weekOf(dayKey) - 1 + y * 7) % QUESTIONS.length;
  return QUESTIONS[idx];
}

export function questionByKey(key: string): QuietQuestion | null {
  return QUESTIONS.find((q) => q.key === key) ?? null;
}
