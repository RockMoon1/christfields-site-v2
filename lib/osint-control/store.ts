import { getSupabase } from '@/lib/supabase';
import {
  cleanMultiline,
  cleanText,
  createActivationToken,
  createDeviceSecret,
  hashOptional,
  hashSecret,
} from '@/lib/osint-control/security';

export type DeviceStatus = 'active' | 'suspended' | 'revoked';
export type ServiceStatus = 'active' | 'maintenance' | 'disabled';
export type ActivationTokenStatus = 'active' | 'disabled' | 'expired';

export class OsintControlNotConfigured extends Error {
  constructor(message = 'OSINT control database tables are not configured.') {
    super(message);
    this.name = 'OsintControlNotConfigured';
  }
}

export class OsintControlPublicError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'OsintControlPublicError';
  }
}

export interface ReleasePolicy {
  serviceStatus: ServiceStatus;
  latestVersion: string;
  minimumVersion: string;
  downloadUrl: string;
  sha256: string;
  message: string;
  updatedBy: string;
  updatedAt: string;
}

export interface ControlDevice {
  id: string;
  installId: string;
  label: string;
  contact: string;
  status: DeviceStatus;
  platform: string;
  appVersion: string;
  firstSeenAt: string;
  lastSeenAt: string | null;
  statusChangedAt: string;
  revokedAt: string | null;
  revokedBy: string | null;
  revokeReason: string | null;
  tokenId: string | null;
}

export interface ActivationInvite {
  id: string;
  label: string;
  contact: string;
  status: ActivationTokenStatus;
  maxActivations: number;
  activationCount: number;
  expiresAt: string | null;
  createdBy: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface ControlEvent {
  id: string;
  eventType: string;
  actor: string | null;
  deviceId: string | null;
  tokenId: string | null;
  reason: string | null;
  createdAt: string;
}

export interface ControlPanelData {
  policy: ReleasePolicy;
  devices: ControlDevice[];
  invites: ActivationInvite[];
  events: ControlEvent[];
}

interface PolicyRow {
  service_status: ServiceStatus;
  latest_version: string;
  minimum_version: string;
  download_url: string;
  sha256: string;
  message: string;
  updated_by: string;
  updated_at: string;
}

interface DeviceRow {
  id: string;
  token_id: string | null;
  install_id: string;
  label: string;
  contact: string | null;
  status: DeviceStatus;
  platform: string | null;
  app_version: string | null;
  first_seen_at: string;
  last_seen_at: string | null;
  status_changed_at: string;
  revoked_at: string | null;
  revoked_by: string | null;
  revoke_reason: string | null;
}

interface InviteRow {
  id: string;
  label: string;
  contact: string | null;
  status: ActivationTokenStatus;
  max_activations: number;
  activation_count: number;
  expires_at: string | null;
  created_by: string;
  created_at: string;
  last_used_at: string | null;
}

interface EventRow {
  id: string;
  event_type: string;
  actor: string | null;
  device_id: string | null;
  token_id: string | null;
  reason: string | null;
  created_at: string;
}

interface PolicyRpcRow {
  device_id: string;
  device_status: DeviceStatus;
  service_status: ServiceStatus;
  latest_version: string | null;
  minimum_version: string | null;
  download_url: string | null;
  sha256: string | null;
  message: string | null;
  server_time: string;
}

export interface ControlApiPolicy {
  deviceId: string;
  deviceStatus: DeviceStatus;
  serviceStatus: ServiceStatus;
  latestVersion: string;
  minimumVersion: string;
  downloadUrl: string;
  sha256: string;
  message: string;
  serverTime: string;
}

const DEFAULT_POLICY: ReleasePolicy = {
  serviceStatus: 'active',
  latestVersion: '',
  minimumVersion: '',
  downloadUrl: '',
  sha256: '',
  message: '',
  updatedBy: 'default',
  updatedAt: '',
};

function missingTable(error: { code?: string; message?: string } | null | undefined): boolean {
  return error?.code === '42P01' || error?.code === '42883' || /does not exist|schema cache/i.test(error?.message || '');
}

function throwIfError(error: { code?: string; message?: string } | null | undefined): void {
  if (!error) return;
  if (missingTable(error)) throw new OsintControlNotConfigured();
  throw new Error(error.message || 'OSINT control database operation failed.');
}

function toPolicy(row: PolicyRow | null): ReleasePolicy {
  if (!row) return DEFAULT_POLICY;
  return {
    serviceStatus: row.service_status,
    latestVersion: row.latest_version || '',
    minimumVersion: row.minimum_version || '',
    downloadUrl: row.download_url || '',
    sha256: row.sha256 || '',
    message: row.message || '',
    updatedBy: row.updated_by || '',
    updatedAt: row.updated_at || '',
  };
}

function toDevice(row: DeviceRow): ControlDevice {
  return {
    id: row.id,
    installId: row.install_id,
    label: row.label,
    contact: row.contact || '',
    status: row.status,
    platform: row.platform || '',
    appVersion: row.app_version || '',
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
    statusChangedAt: row.status_changed_at,
    revokedAt: row.revoked_at,
    revokedBy: row.revoked_by,
    revokeReason: row.revoke_reason,
    tokenId: row.token_id,
  };
}

function toInvite(row: InviteRow): ActivationInvite {
  return {
    id: row.id,
    label: row.label,
    contact: row.contact || '',
    status: row.status,
    maxActivations: row.max_activations,
    activationCount: row.activation_count,
    expiresAt: row.expires_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
  };
}

function toEvent(row: EventRow): ControlEvent {
  return {
    id: row.id,
    eventType: row.event_type,
    actor: row.actor,
    deviceId: row.device_id,
    tokenId: row.token_id,
    reason: row.reason,
    createdAt: row.created_at,
  };
}

function toApiPolicy(row: PolicyRpcRow): ControlApiPolicy {
  return {
    deviceId: row.device_id,
    deviceStatus: row.device_status,
    serviceStatus: row.service_status,
    latestVersion: row.latest_version || '',
    minimumVersion: row.minimum_version || '',
    downloadUrl: row.download_url || '',
    sha256: row.sha256 || '',
    message: row.message || '',
    serverTime: row.server_time,
  };
}

export async function getControlPanelData(): Promise<ControlPanelData> {
  const sb = getSupabase();
  const [policyRes, devicesRes, invitesRes, eventsRes] = await Promise.all([
    sb.from('osint_control_release_policy').select('*').eq('id', 'global').maybeSingle(),
    sb.from('osint_control_devices').select('*').order('last_seen_at', { ascending: false, nullsFirst: false }).limit(100),
    sb.from('osint_control_activation_tokens').select('id,label,contact,status,max_activations,activation_count,expires_at,created_by,created_at,last_used_at').order('created_at', { ascending: false }).limit(50),
    sb.from('osint_control_events').select('id,event_type,actor,device_id,token_id,reason,created_at').order('created_at', { ascending: false }).limit(50),
  ]);

  for (const res of [policyRes, devicesRes, invitesRes, eventsRes]) throwIfError(res.error);

  return {
    policy: toPolicy(policyRes.data as PolicyRow | null),
    devices: ((devicesRes.data as DeviceRow[] | null) ?? []).map(toDevice),
    invites: ((invitesRes.data as InviteRow[] | null) ?? []).map(toInvite),
    events: ((eventsRes.data as EventRow[] | null) ?? []).map(toEvent),
  };
}

export async function createActivationInvite(input: {
  label: string;
  contact: string;
  maxActivations: number;
  expiresAt: string | null;
  actor: string;
}): Promise<{ invite: ActivationInvite; token: string }> {
  const token = createActivationToken();
  const row = {
    token_hash: hashSecret(token),
    label: cleanText(input.label, 120) || 'OSINT reviewer device',
    contact: cleanText(input.contact, 160) || null,
    max_activations: Math.max(1, Math.min(25, Math.floor(input.maxActivations) || 1)),
    expires_at: input.expiresAt,
    created_by: cleanText(input.actor, 160) || 'unknown-admin',
  };
  const { data, error } = await getSupabase()
    .from('osint_control_activation_tokens')
    .insert(row)
    .select('id,label,contact,status,max_activations,activation_count,expires_at,created_by,created_at,last_used_at')
    .single();
  throwIfError(error);
  return { invite: toInvite(data as InviteRow), token };
}

export async function setDeviceStatus(input: {
  deviceId: string;
  status: DeviceStatus;
  reason: string;
  actor: string;
}): Promise<void> {
  const now = new Date().toISOString();
  const status = input.status;
  const reason = cleanMultiline(input.reason, 500);
  const actor = cleanText(input.actor, 160) || 'unknown-admin';
  const patch = {
    status,
    status_changed_at: now,
    updated_at: now,
    revoked_at: status === 'revoked' ? now : null,
    revoked_by: status === 'revoked' ? actor : null,
    revoke_reason: status === 'active' ? null : reason || null,
  };

  const sb = getSupabase();
  const { error } = await sb.from('osint_control_devices').update(patch).eq('id', input.deviceId);
  throwIfError(error);
  const { error: eventError } = await sb.from('osint_control_events').insert({
    event_type: `device_${status}`,
    actor,
    device_id: input.deviceId,
    reason: reason || `Device marked ${status}.`,
  });
  throwIfError(eventError);
}

export async function saveReleasePolicy(input: {
  serviceStatus: ServiceStatus;
  latestVersion: string;
  minimumVersion: string;
  downloadUrl: string;
  sha256: string;
  message: string;
  actor: string;
}): Promise<void> {
  const serviceStatus: ServiceStatus = ['active', 'maintenance', 'disabled'].includes(input.serviceStatus)
    ? input.serviceStatus
    : 'active';
  const actor = cleanText(input.actor, 160) || 'unknown-admin';
  const row = {
    id: 'global',
    service_status: serviceStatus,
    latest_version: cleanText(input.latestVersion, 40),
    minimum_version: cleanText(input.minimumVersion, 40),
    download_url: cleanText(input.downloadUrl, 500),
    sha256: cleanText(input.sha256, 80),
    message: cleanMultiline(input.message, 500),
    updated_by: actor,
    updated_at: new Date().toISOString(),
  };
  const sb = getSupabase();
  const { error } = await sb.from('osint_control_release_policy').upsert(row, { onConflict: 'id' });
  throwIfError(error);
  const { error: eventError } = await sb.from('osint_control_events').insert({
    event_type: 'release_policy_updated',
    actor,
    reason: `Service status: ${serviceStatus}`,
  });
  throwIfError(eventError);
}

export async function activateDevice(input: {
  activationToken: string;
  installId: string;
  label: string;
  contact: string;
  platform: string;
  appVersion: string;
  ip: string | null;
  userAgent: string | null;
}): Promise<{ policy: ControlApiPolicy; deviceSecret: string }> {
  const deviceSecret = createDeviceSecret();
  const { data, error } = await getSupabase().rpc('osint_control_activate_device', {
    p_token_hash: hashSecret(input.activationToken),
    p_device_secret_hash: hashSecret(deviceSecret),
    p_install_id: input.installId,
    p_label: cleanText(input.label, 120),
    p_contact: cleanText(input.contact, 160),
    p_platform: cleanText(input.platform, 120),
    p_app_version: cleanText(input.appVersion, 40),
    p_ip_hash: hashOptional(input.ip),
    p_user_agent_hash: hashOptional(input.userAgent),
  });
  if (error) throwPublicError(error);
  const row = (Array.isArray(data) ? data[0] : data) as PolicyRpcRow | undefined;
  if (!row?.device_id) throw new Error('Activation returned no device.');
  return { policy: toApiPolicy(row), deviceSecret };
}

export async function checkInDevice(input: {
  deviceId: string;
  deviceSecret: string;
  installId: string;
  label: string;
  platform: string;
  appVersion: string;
  ip: string | null;
  userAgent: string | null;
}): Promise<ControlApiPolicy> {
  const { data, error } = await getSupabase().rpc('osint_control_check_in', {
    p_device_id: input.deviceId,
    p_device_secret_hash: hashSecret(input.deviceSecret),
    p_install_id: input.installId,
    p_label: cleanText(input.label, 120),
    p_platform: cleanText(input.platform, 120),
    p_app_version: cleanText(input.appVersion, 40),
    p_ip_hash: hashOptional(input.ip),
    p_user_agent_hash: hashOptional(input.userAgent),
  });
  if (error) throwPublicError(error);
  const row = (Array.isArray(data) ? data[0] : data) as PolicyRpcRow | undefined;
  if (!row?.device_id) throw new Error('Check-in returned no device.');
  return toApiPolicy(row);
}

function throwPublicError(error: { code?: string; message?: string }): never {
  if (missingTable(error)) throw new OsintControlNotConfigured();
  const message = String(error.message || '');
  if (/activation_token_invalid|activation_token_disabled|activation_token_expired|activation_token_exhausted|device_credentials_invalid/.test(message)) {
    throw new OsintControlPublicError('OSINT control credentials were not accepted.', message);
  }
  throw new Error(message || 'OSINT control request failed.');
}
