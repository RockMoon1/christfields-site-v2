'use server';

import { revalidatePath } from 'next/cache';
import { requireOsintAdmin } from '@/lib/osint-control/admin';
import {
  createActivationInvite,
  saveReleasePolicy,
  setDeviceStatus,
  type DeviceStatus,
  type ServiceStatus,
} from '@/lib/osint-control/store';
import { cleanMultiline, cleanText, parsePositiveInt } from '@/lib/osint-control/security';

export interface InviteActionState {
  ok: boolean;
  message: string;
  token?: string;
}

export interface PlainActionState {
  ok: boolean;
  message: string;
}

export const initialInviteState: InviteActionState = { ok: false, message: '' };
export const initialPlainState: PlainActionState = { ok: false, message: '' };

function actorLabel(access: Awaited<ReturnType<typeof requireOsintAdmin>>): string {
  return access.emails[0] || access.userId || 'osint-control-admin';
}

export async function createInviteAction(_: InviteActionState, formData: FormData): Promise<InviteActionState> {
  try {
    const access = await requireOsintAdmin();
    const days = parsePositiveInt(formData.get('expiresDays'), 14, 90);
    const expiresAt = new Date(Date.now() + days * 86_400_000).toISOString();
    const result = await createActivationInvite({
      label: cleanText(formData.get('label'), 120) || 'OSINT reviewer device',
      contact: cleanText(formData.get('contact'), 160),
      maxActivations: parsePositiveInt(formData.get('maxActivations'), 1, 25),
      expiresAt,
      actor: actorLabel(access),
    });
    revalidatePath('/dashboard/osint-control');
    return {
      ok: true,
      message: 'Invite created. Copy this token now; it will not be shown again.',
      token: result.token,
    };
  } catch (err) {
    console.error('createInviteAction failed', { name: err instanceof Error ? err.name : 'UnknownError' });
    return { ok: false, message: 'Could not create the invite. Check the admin allowlist and database migration.' };
  }
}

export async function setDeviceStatusAction(_: PlainActionState, formData: FormData): Promise<PlainActionState> {
  const status = cleanText(formData.get('status'), 20) as DeviceStatus;
  if (!['active', 'suspended', 'revoked'].includes(status)) {
    return { ok: false, message: 'Unknown device status.' };
  }
  try {
    const access = await requireOsintAdmin();
    await setDeviceStatus({
      deviceId: cleanText(formData.get('deviceId'), 80),
      status,
      reason: cleanMultiline(formData.get('reason'), 500),
      actor: actorLabel(access),
    });
    revalidatePath('/dashboard/osint-control');
    return { ok: true, message: `Device marked ${status}.` };
  } catch (err) {
    console.error('setDeviceStatusAction failed', { name: err instanceof Error ? err.name : 'UnknownError' });
    return { ok: false, message: 'Could not update that device.' };
  }
}

export async function saveReleasePolicyAction(_: PlainActionState, formData: FormData): Promise<PlainActionState> {
  const serviceStatus = cleanText(formData.get('serviceStatus'), 20) as ServiceStatus;
  if (!['active', 'maintenance', 'disabled'].includes(serviceStatus)) {
    return { ok: false, message: 'Unknown service status.' };
  }
  try {
    const access = await requireOsintAdmin();
    await saveReleasePolicy({
      serviceStatus,
      latestVersion: cleanText(formData.get('latestVersion'), 40),
      minimumVersion: cleanText(formData.get('minimumVersion'), 40),
      downloadUrl: cleanText(formData.get('downloadUrl'), 500),
      sha256: cleanText(formData.get('sha256'), 80),
      message: cleanMultiline(formData.get('message'), 500),
      actor: actorLabel(access),
    });
    revalidatePath('/dashboard/osint-control');
    return { ok: true, message: 'Release policy saved.' };
  } catch (err) {
    console.error('saveReleasePolicyAction failed', { name: err instanceof Error ? err.name : 'UnknownError' });
    return { ok: false, message: 'Could not save the release policy.' };
  }
}
