const DEFAULT_BASE_URL = 'https://christfields2717.com';
const LOCAL_DASHBOARD_URL = 'http://127.0.0.1:7338';

export interface ReviewerInviteMessageInput {
  token: string;
  label: string;
  contact: string;
  baseUrl?: string;
}

export function buildReviewerInviteMessage(input: ReviewerInviteMessageInput): string {
  const baseUrl = normalizeBaseUrl(input.baseUrl || DEFAULT_BASE_URL);
  const label = cliValue(input.label || 'Reviewer laptop');
  const contact = cliValue(input.contact || 'Discord: your-name');

  return [
    'Hey, thank you for helping test the Christfields OSINT dashboard.',
    '',
    'Important boundaries:',
    '- Use only synthetic/demo data for now.',
    '- Do not enter real case details, private personal info, evidence, screenshots, or credentials.',
    '- Do not share this invite token with anyone else.',
    '- If access is suspended or revoked later, the local dashboard may lock on its next check-in.',
    '',
    'When you have the OSINT folder on your machine, open a terminal in that folder and run:',
    '',
    `node control-client.js activate --url ${baseUrl} --token ${input.token} --name "${label}" --contact "${contact}"`,
    '',
    'Then start the dashboard with:',
    '',
    'node server.js',
    '',
    'After it starts, open:',
    '',
    LOCAL_DASHBOARD_URL,
  ].join('\n');
}

function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, '');
  return /^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(trimmed) ? trimmed : DEFAULT_BASE_URL;
}

function cliValue(value: string): string {
  return value
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/["]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
}
