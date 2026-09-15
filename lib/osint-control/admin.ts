import { auth, clerkClient } from '@clerk/nextjs/server';

export interface OsintAdminAccess {
  configured: boolean;
  allowed: boolean;
  userId: string | null;
  emails: string[];
}

export function parseCsvAllowlist(value: string | undefined): Set<string> {
  return new Set(
    String(value || '')
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function osintAdminAllowlists(env: Partial<NodeJS.ProcessEnv> = process.env): {
  userIds: Set<string>;
  emails: Set<string>;
} {
  return {
    userIds: parseCsvAllowlist(`${env.OSINT_CONTROL_ADMIN_USER_IDS || ''},${env.CHRISTFIELDS_ADMIN_USER_IDS || ''}`),
    emails: parseCsvAllowlist(`${env.OSINT_CONTROL_ADMIN_EMAILS || ''},${env.CHRISTFIELDS_ADMIN_EMAILS || ''}`),
  };
}

export function isOsintAdminMatch(
  input: { userId: string | null; emails: string[] },
  allowlists = osintAdminAllowlists(),
): boolean {
  if (input.userId && allowlists.userIds.has(input.userId.toLowerCase())) return true;
  return input.emails.some((email) => allowlists.emails.has(email.toLowerCase()));
}

export function isOsintAdminConfigured(allowlists = osintAdminAllowlists()): boolean {
  return allowlists.userIds.size > 0 || allowlists.emails.size > 0;
}

export async function getOsintAdminAccess(): Promise<OsintAdminAccess> {
  const allowlists = osintAdminAllowlists();
  const configured = isOsintAdminConfigured(allowlists);
  const { userId } = await auth();
  if (!userId) return { configured, allowed: false, userId: null, emails: [] };

  let emails: string[] = [];
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    emails = user.emailAddresses
      .filter((email) => email.id === user.primaryEmailAddressId || email.verification?.status === 'verified')
      .map((email) => email.emailAddress.toLowerCase());
  } catch (err) {
    console.error('OSINT admin email lookup failed', err);
  }

  return {
    configured,
    allowed: configured && isOsintAdminMatch({ userId, emails }, allowlists),
    userId,
    emails,
  };
}

export async function requireOsintAdmin(): Promise<OsintAdminAccess> {
  const access = await getOsintAdminAccess();
  if (!access.configured || !access.allowed) {
    throw new Error(access.configured ? 'OSINT control admin access denied.' : 'OSINT control admins are not configured.');
  }
  return access;
}
