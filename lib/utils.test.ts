import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('Christ Fields type tokens', () => {
  it('preserves type size and foreground while resolving a size override', () => {
    expect(cn('font-display text-display-md text-ivory', 'text-display-lg')).toBe('font-display text-ivory text-display-lg');
    expect(cn('text-meta text-gold')).toBe('text-meta text-gold');
    expect(cn('text-meta text-gold', 'text-sm')).toBe('text-gold text-sm');
  });
});
