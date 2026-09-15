'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  createInviteAction,
  saveReleasePolicyAction,
  setDeviceStatusAction,
} from '@/app/dashboard/(app)/osint-control/actions';
import { initialInviteState, initialPlainState } from '@/lib/osint-control/action-state';
import type { ControlDevice, ControlPanelData, DeviceStatus, ServiceStatus } from '@/lib/osint-control/store';
import { Button } from '@/components/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Notice } from '@/components/ui/Notice';
import { Surface } from '@/components/ui/Surface';
import { cn } from '@/lib/utils';

export function ControlConsole({ data }: { data: ControlPanelData }) {
  const [inviteState, inviteAction] = useActionState(createInviteAction, initialInviteState);
  const [policyState, policyAction] = useActionState(saveReleasePolicyAction, initialPlainState);
  const [statusState, statusAction] = useActionState(setDeviceStatusAction, initialPlainState);
  const [copied, setCopied] = useState(false);

  async function copyToken() {
    if (!inviteState.token) return;
    await navigator.clipboard.writeText(inviteState.token);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8 flex flex-col gap-5 border-b border-border-sub pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.24em] text-gold">OSINT Control</p>
          <h1 className="font-display text-4xl font-light leading-tight text-ivory">Machine access and releases.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-silver">
            Issue reviewer installs, watch check-ins, and suspend or revoke devices. This stores only control metadata, not case records.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[360px]">
          <Metric label="Active" value={data.devices.filter((d) => d.status === 'active').length} />
          <Metric label="Suspended" value={data.devices.filter((d) => d.status === 'suspended').length} />
          <Metric label="Revoked" value={data.devices.filter((d) => d.status === 'revoked').length} />
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <section className="space-y-6">
          <Surface tone="accent" pad="lg">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-light text-ivory">Devices</h2>
                <p className="mt-1 text-sm leading-relaxed text-silver">
                  Revocation takes effect the next time the install checks in. Already downloaded local files are outside technical recall.
                </p>
              </div>
              <StatusPill status={data.policy.serviceStatus} />
            </div>
            <Notice message={statusState.message} tone={statusState.ok ? 'saved' : 'problem'} className="mb-4" />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-border-sub text-[10px] uppercase tracking-[0.18em] text-muted">
                  <tr>
                    <th className="pb-3 font-medium">Device</th>
                    <th className="pb-3 font-medium">Version</th>
                    <th className="pb-3 font-medium">Last seen</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-sub">
                  {data.devices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-silver">No activated devices yet.</td>
                    </tr>
                  ) : (
                    data.devices.map((device) => (
                      <DeviceRow key={device.id} device={device} action={statusAction} />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Surface>

          <Surface tone="default" pad="lg">
            <h2 className="font-display text-2xl font-light text-ivory">Recent control events</h2>
            <div className="mt-5 space-y-3">
              {data.events.length === 0 ? (
                <p className="text-sm text-silver">No events recorded yet.</p>
              ) : (
                data.events.map((event) => (
                  <div key={event.id} className="grid gap-2 rounded-sm border border-border-sub bg-black-2 p-4 sm:grid-cols-[190px_1fr]">
                    <time className="text-[11px] uppercase tracking-[0.14em] text-muted">{formatDate(event.createdAt)}</time>
                    <div>
                      <p className="text-sm font-medium text-ivory">{labelEvent(event.eventType)}</p>
                      <p className="mt-1 text-sm leading-relaxed text-silver">
                        {event.reason || event.actor || event.deviceId || 'Recorded by the control plane.'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Surface>
        </section>

        <aside className="space-y-6">
          <Surface tone="wash" pad="lg" interactive>
            <h2 className="font-display text-2xl font-light text-ivory">Create reviewer invite</h2>
            <form action={inviteAction} className="mt-5 space-y-4">
              <Field id="invite-label" label="Device label">
                <Input name="label" placeholder="Reviewer laptop" maxLength={120} required />
              </Field>
              <Field id="invite-contact" label="Contact handle" hint="Discord or WhatsApp label. No case details here.">
                <Input name="contact" placeholder="Discord: helper-name" maxLength={160} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="max-activations" label="Uses">
                  <Input name="maxActivations" type="number" min={1} max={25} defaultValue={1} />
                </Field>
                <Field id="expires-days" label="Expires in days">
                  <Input name="expiresDays" type="number" min={1} max={90} defaultValue={14} />
                </Field>
              </div>
              <SubmitButton>Create invite</SubmitButton>
            </form>
            <Notice message={inviteState.message} tone={inviteState.ok ? 'saved' : 'problem'} className="mt-4" />
            {inviteState.token && (
              <div className="mt-4 rounded-sm border border-border-gold bg-black-2 p-4">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-gold">Token shown once</p>
                <code className="mt-3 block break-all rounded-sm bg-black px-3 py-2 text-sm text-gold-lt">{inviteState.token}</code>
                <Button fx={false} variant="ghost" size="sm" className="mt-3" onClick={copyToken}>
                  {copied ? 'Copied' : 'Copy token'}
                </Button>
              </div>
            )}
          </Surface>

          <Surface tone="accent" pad="lg" interactive>
            <h2 className="font-display text-2xl font-light text-ivory">Release policy</h2>
            <form action={policyAction} className="mt-5 space-y-4">
              <Field id="service-status" label="Service status">
                <select
                  name="serviceStatus"
                  defaultValue={data.policy.serviceStatus}
                  className="min-h-11 w-full rounded-sm border border-border-sub bg-black-2 px-3 py-3 text-base text-ivory [color-scheme:dark] focus:border-gold/60"
                >
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="disabled">Disabled</option>
                </select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="latest-version" label="Latest version">
                  <Input name="latestVersion" defaultValue={data.policy.latestVersion} placeholder="0.3.1" maxLength={40} />
                </Field>
                <Field id="minimum-version" label="Minimum version">
                  <Input name="minimumVersion" defaultValue={data.policy.minimumVersion} placeholder="0.3.0" maxLength={40} />
                </Field>
              </div>
              <Field id="download-url" label="Download URL">
                <Input name="downloadUrl" defaultValue={data.policy.downloadUrl} placeholder="https://christfields2717.com/..." maxLength={500} />
              </Field>
              <Field id="sha256" label="SHA-256">
                <Input name="sha256" defaultValue={data.policy.sha256} placeholder="Optional release checksum" maxLength={80} />
              </Field>
              <Field id="message" label="Operator message">
                <Textarea name="message" defaultValue={data.policy.message} rows={4} maxLength={500} />
              </Field>
              <SubmitButton>Save policy</SubmitButton>
            </form>
            <Notice message={policyState.message} tone={policyState.ok ? 'saved' : 'problem'} className="mt-4" />
            {data.policy.updatedAt && (
              <p className="mt-4 text-xs leading-relaxed text-muted">
                Last saved {formatDate(data.policy.updatedAt)} by {data.policy.updatedBy || 'an admin'}.
              </p>
            )}
          </Surface>

          <Surface tone="recessed" pad="md">
            <h2 className="font-display text-xl font-light text-ivory">Invite history</h2>
            <div className="mt-4 space-y-3">
              {data.invites.slice(0, 6).map((invite) => (
                <div key={invite.id} className="rounded-sm border border-border-sub bg-black-3 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium text-ivory">{invite.label}</p>
                    <span className="text-xs text-muted">{invite.activationCount}/{invite.maxActivations}</span>
                  </div>
                  <p className="mt-1 text-xs text-silver">{invite.contact || 'No contact'} · {invite.status}</p>
                </div>
              ))}
              {data.invites.length === 0 && <p className="text-sm text-silver">No invites yet.</p>}
            </div>
          </Surface>
        </aside>
      </div>
    </div>
  );
}

function DeviceRow({ device, action }: { device: ControlDevice; action: (payload: FormData) => void }) {
  return (
    <tr className="align-top">
      <td className="py-4 pr-4">
        <p className="font-medium text-ivory">{device.label}</p>
        <p className="mt-1 text-xs text-silver">{device.contact || 'No contact'} · {device.platform || 'Unknown platform'}</p>
        <p className="mt-1 max-w-[220px] truncate font-mono text-[11px] text-muted" title={device.installId}>{device.installId}</p>
      </td>
      <td className="py-4 pr-4 text-silver">{device.appVersion || 'Unknown'}</td>
      <td className="py-4 pr-4 text-silver">{device.lastSeenAt ? formatDate(device.lastSeenAt) : 'Never'}</td>
      <td className="py-4 pr-4"><StatusPill status={device.status} /></td>
      <td className="py-4">
        <div className="flex flex-wrap gap-2">
          {(['active', 'suspended', 'revoked'] as DeviceStatus[])
            .filter((status) => status !== device.status)
            .map((status) => (
              <form key={status} action={action} className="contents">
                <input type="hidden" name="deviceId" value={device.id} />
                <input type="hidden" name="status" value={status} />
                <input type="hidden" name="reason" value={`Admin marked device ${status}.`} />
                <SmallSubmit tone={status === 'revoked' ? 'danger' : status === 'suspended' ? 'quiet' : 'active'}>
                  {status === 'active' ? 'Reactivate' : status}
                </SmallSubmit>
              </form>
            ))}
        </div>
        {device.revokeReason && <p className="mt-2 max-w-[240px] text-xs leading-relaxed text-danger-lt">{device.revokeReason}</p>}
      </td>
    </tr>
  );
}

function SubmitButton({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return (
    <Button fx={false} type="submit" pending={pending} pendingLabel="Saving..." className="w-full">
      {children}
    </Button>
  );
}

function SmallSubmit({ children, tone }: { children: string; tone: 'active' | 'quiet' | 'danger' }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        'inline-flex min-h-11 items-center rounded-sm border px-3 py-2 text-xs font-medium uppercase tracking-[0.08em] transition-colors disabled:cursor-wait disabled:opacity-50',
        tone === 'active' && 'border-emerald/50 bg-emerald/20 text-emerald-bright hover:bg-emerald/30',
        tone === 'quiet' && 'border-border-sub bg-black-2 text-silver hover:border-border-gold hover:text-ivory',
        tone === 'danger' && 'border-danger/50 bg-danger-dk/30 text-danger-lt hover:bg-danger-dk/60',
      )}
    >
      {pending ? 'Saving...' : children}
    </button>
  );
}

function StatusPill({ status }: { status: DeviceStatus | ServiceStatus }) {
  return (
    <span
      className={cn(
        'inline-flex min-h-7 items-center rounded-sm border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em]',
        status === 'active' && 'border-emerald/40 bg-emerald/15 text-emerald-bright',
        status === 'maintenance' && 'border-warn/50 bg-warn/15 text-gold-lt',
        status === 'disabled' && 'border-danger/50 bg-danger-dk/30 text-danger-lt',
        status === 'suspended' && 'border-warn/50 bg-warn/15 text-gold-lt',
        status === 'revoked' && 'border-danger/50 bg-danger-dk/30 text-danger-lt',
      )}
    >
      {status}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-sm border border-border-sub bg-black-3 px-3 py-3">
      <p className="font-display text-2xl leading-none text-ivory">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted">{label}</p>
    </div>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function labelEvent(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
