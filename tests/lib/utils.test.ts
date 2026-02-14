import { describe, expect, it } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn', () => {
  it('merges class names and removes conflicts', () => {
    expect(cn('px-2', 'px-4', 'text-sm', 'text-lg')).toBe('px-4 text-lg');
  });

  it('handles conditional values', () => {
    expect(cn('base', false && 'hidden', true && 'visible')).toBe('base visible');
  });
});
