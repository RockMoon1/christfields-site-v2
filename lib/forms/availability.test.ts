import { describe, it, expect } from 'vitest';
import { validateAnswer, dateLabel } from './availability';
const answer = { submissionId: '672bfda3-0048-4bc6-a612-bbca7b284e86', name: 'Test Person', interest: 'yes', available: ['2026-11-07'], unavailable: ['2026-11-08'], notes: '', consent: true, ageConfirmed: true };
describe('public poll validation', () => {
  it('accepts only real, non-conflicting November date choices', () => {
    expect(validateAnswer(answer)).not.toBeNull();
    for (const date of ['2026-11-31','2026-12-01','2025-11-07','2026-11-07T00:00:00Z']) expect(validateAnswer({...answer, available:[date]})).toBeNull();
    expect(validateAnswer({...answer, unavailable:answer.available})).toBeNull();
    expect(validateAnswer({...answer, available:['2026-11-07','2026-11-07']})).toBeNull();
  });
  it('rejects malformed and excessive inputs and missing privacy confirmations', () => {
    for (const value of [null, [], 'hello', {...answer, name: 'x'.repeat(81)}, {...answer, notes:'x'.repeat(1001)}, {...answer, interest:'other'}, {...answer, consent:false}, {...answer, ageConfirmed:false}, {...answer, submissionId:'invalid'}, {...answer, name:'Test\nHeader'}]) expect(validateAnswer(value)).toBeNull();
  });
  it('allows undecided dates and not attending without collecting contact details', () => {
    expect(validateAnswer({...answer, interest:'no', available:[], unavailable:[]})).not.toBeNull();
    expect(dateLabel('2026-11-01')).toBe('Sun, Nov 1');
  });
});
