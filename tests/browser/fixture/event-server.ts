/** Synthetic server boundary: no authentication, token or runtime service access. */
export async function auth() { return { userId: null }; }
export async function getMemberTimeZone() { return 'America/Denver'; }
export function appUrl() { return 'https://example.invalid'; }
export function mintIcsToken(): never { throw new Error('Token minting is excluded from this fixture.'); }
