import { describe, expect, it } from 'vitest';
import {
  compareVersions,
  createActivationToken,
  createDeviceSecret,
  hashSecret,
  isActivationToken,
  isDeviceSecret,
  isInstallId,
  isVersionBelow,
} from './security';

describe('OSINT control security helpers', () => {
  it('generates recognizable one-time tokens and device secrets', () => {
    const token = createActivationToken();
    const secret = createDeviceSecret();
    expect(isActivationToken(token)).toBe(true);
    expect(isDeviceSecret(secret)).toBe(true);
    expect(isActivationToken(secret)).toBe(false);
  });

  it('hashes secrets deterministically without storing the raw value', () => {
    const a = hashSecret('cfosint_example', 'pepper-a');
    const b = hashSecret('cfosint_example', 'pepper-a');
    const c = hashSecret('cfosint_example', 'pepper-b');
    expect(a).toBe(b);
    expect(a).not.toContain('cfosint_example');
    expect(a).not.toBe(c);
  });

  it('validates install identifiers without accepting arbitrary text', () => {
    expect(isInstallId('fe148f1d-8cb6-4cf6-875d-34d8791fa70e')).toBe(true);
    expect(isInstallId('../case_data')).toBe(false);
    expect(isInstallId('short')).toBe(false);
  });

  it('compares simple semantic versions for minimum-version checks', () => {
    expect(compareVersions('0.3.0', '0.3.0')).toBe(0);
    expect(isVersionBelow('0.3.0', '0.4.0')).toBe(true);
    expect(isVersionBelow('0.5.0', '0.4.0')).toBe(false);
    expect(isVersionBelow('dev-build', '0.4.0')).toBe(false);
  });
});
