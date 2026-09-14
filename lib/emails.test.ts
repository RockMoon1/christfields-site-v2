import { describe, expect, it } from 'vitest';
import {
  autoReplyText,
  normalizePublicSubmissionFormName,
  notificationHtml,
  publicSubmissionLabel,
} from './emails';

describe('public submission email helpers', () => {
  it('normalizes the OSINT feedback form name', () => {
    expect(normalizePublicSubmissionFormName('osint-feedback')).toBe('osint-feedback');
    expect(normalizePublicSubmissionFormName('unexpected')).toBe('waitlist');
  });

  it('labels OSINT feedback distinctly for inbox notifications', () => {
    expect(publicSubmissionLabel('osint-feedback')).toBe('OSINT dashboard feedback');

    const html = notificationHtml({
      formName: 'osint-feedback',
      name: 'River Reviewer',
      email: 'river@example.invalid',
      interest: 'Source review',
      message: 'Discord: river#0000\nSynthetic-only confirmation: yes\n\nThe mirrored source needs a clearer warning.',
    });

    expect(html).toContain('New OSINT dashboard feedback submission');
    expect(html).toContain('The mirrored source needs a clearer warning.');
  });

  it('keeps the OSINT auto reply scoped to synthetic material', () => {
    const text = autoReplyText({ firstName: 'River', formName: 'osint-feedback' });

    expect(text).toContain('synthetic or demo material only');
    expect(text).toContain('proverbs@christfields2717.com');
  });
});
