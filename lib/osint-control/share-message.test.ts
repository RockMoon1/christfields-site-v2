import { describe, expect, it } from 'vitest';
import { buildReviewerInviteMessage } from './share-message';

describe('buildReviewerInviteMessage', () => {
  it('builds a private reviewer message with the activation command filled in', () => {
    const message = buildReviewerInviteMessage({
      token: 'cfosint_exampleTokenForTestsOnly1234567890',
      label: 'Reviewer 1 - Alex',
      contact: 'Discord: alex',
      baseUrl: 'https://christfields2717.com/',
    });

    expect(message).toContain('Use only synthetic/demo data for now.');
    expect(message).toContain('extract the OSINT reviewer zip');
    expect(message).toContain('node .\\feedback-pilot.js --data .\\feedback-demo-data');
    expect(message).toContain('$env:OSINT_DATA_DIR = "$PWD\\feedback-demo-data"');
    expect(message).toContain('--url https://christfields2717.com');
    expect(message).toContain('--token cfosint_exampleTokenForTestsOnly1234567890');
    expect(message).toContain('--name "Reviewer 1 - Alex"');
    expect(message).toContain('--contact "Discord: alex"');
    expect(message).toContain('http://127.0.0.1:7337');
    expect(message).not.toContain('\\_');
  });

  it('keeps command values single-line and quote-safe', () => {
    const message = buildReviewerInviteMessage({
      token: 'cfosint_token',
      label: 'Reviewer "Laptop"\nNorth',
      contact: 'Discord: "alex"',
      baseUrl: 'not-a-url',
    });

    expect(message).toContain('--url https://christfields2717.com');
    expect(message).toContain('--name "Reviewer \'Laptop\' North"');
    expect(message).toContain('--contact "Discord: \'alex\'"');
  });
});
