import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/**
 * AES-256-GCM at rest for the few secrets we hold on members' behalf: the
 * private calendar link a member pastes (a bearer URL to their whole calendar)
 * and, later, Google refresh tokens.
 *
 * Key: CALENDAR_TOKEN_KEY, 32 bytes as base64 (generate with
 * `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`).
 * Format: v1.<iv>.<tag>.<ciphertext>, all base64url.
 *
 * When the key is not configured (local dev before setup) the helpers report
 * that, and callers keep the plaintext path so nothing breaks; production sets
 * the key and everything new is encrypted.
 */

function keyBytes(): Buffer | null {
  const raw = process.env.CALENDAR_TOKEN_KEY;
  if (!raw) return null;
  try {
    const buf = Buffer.from(raw, 'base64');
    return buf.length === 32 ? buf : null;
  } catch {
    return null;
  }
}

export function isEncryptionConfigured(): boolean {
  return keyBytes() !== null;
}

export function encryptText(plain: string): string {
  const key = keyBytes();
  if (!key) throw new Error('CALENDAR_TOKEN_KEY is not configured.');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString('base64url')}.${tag.toString('base64url')}.${ct.toString('base64url')}`;
}

export function decryptText(payload: string): string | null {
  const key = keyBytes();
  if (!key) return null;
  try {
    const [v, ivB, tagB, ctB] = payload.split('.');
    if (v !== 'v1' || !ivB || !tagB || !ctB) return null;
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivB, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagB, 'base64url'));
    const pt = Buffer.concat([decipher.update(Buffer.from(ctB, 'base64url')), decipher.final()]);
    return pt.toString('utf8');
  } catch {
    return null;
  }
}
