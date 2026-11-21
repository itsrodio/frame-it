import { describe, expect, it } from 'vitest';
import { cn } from '@/lib/utils';

describe('utils', () => {
  it('merges class names via cn', () => {
    expect(cn('px-2', false && 'hidden', 'py-1', 'px-4')).toBe('py-1 px-4');
  });
});
