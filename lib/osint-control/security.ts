import { createHash, createHmac, randomBytes, randomUUID } from 'node:crypto';

export const ACTIVATION_TOKEN_PREFIX = 'cfosint_';

export function createActivationToken(): string {
  return `${ACTIVATION_TOKEN_PREFIX}${randomBytes(32).toString('base64url')}`;
}

export function createDeviceSecret(): string {
  return `osdev_${randomBytes(32).toString('base64url')}`;
}

export function createInstallId(): string {
  return randomUUID();
}

export function isActivationToken(value: unknown): value is string {
  return typeof value === 'string' && /^cfosint_[A-Za-z0-9_-]{32,96}$/.test(value);
}

export function isDeviceSecret(value: unknown): value is string {
  return typeof value === 'string' && /^osdev_[A-Za-z0-9_-]{32,96}$/.test(value);
}

export function isInstallId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9._:-]{8,128}$/.test(value);
}

export function hashSecret(value: string, pepper = process.env.OSINT_CONTROL_SECRET_PEPPER || ''): string {
  const normalized = value.trim();
  const digest = pepper
    ? createHmac('sha256', pepper).update(normalized, 'utf8').digest('hex')
    : createHash('sha256').update(normalized, 'utf8').digest('hex');
  return `${pepper ? 'hmac-sha256' : 'sha256'}:${digest}`;
}

export function hashOptional(value: string | null | undefined): string | null {
  const clean = String(value || '').trim();
  return clean ? hashSecret(clean) : null;
}

export function parsePositiveInt(value: FormDataEntryValue | null, fallback: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(max, Math.floor(n)));
}

export function cleanText(value: unknown, max: number): string {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, max);
}

export function cleanMultiline(value: unknown, max: number): string {
  return String(value || '').trim().replace(/\r\n?/g, '\n').slice(0, max);
}

export function compareVersions(a: string, b: string): number {
  const left = normalizeVersion(a);
  const right = normalizeVersion(b);
  if (!left.length || !right.length) return 0;
  const len = Math.max(left.length, right.length);
  for (let i = 0; i < len; i += 1) {
    const av = left[i] ?? 0;
    const bv = right[i] ?? 0;
    if (av < bv) return -1;
    if (av > bv) return 1;
  }
  return 0;
}

export function isVersionBelow(current: string, minimum: string): boolean {
  if (!minimum.trim()) return false;
  return compareVersions(current, minimum) < 0;
}

function normalizeVersion(value: string): number[] {
  const clean = value.trim().replace(/^v/i, '');
  if (!/^\d+(?:\.\d+){0,3}$/.test(clean)) return [];
  return clean.split('.').map((part) => Number(part));
}
