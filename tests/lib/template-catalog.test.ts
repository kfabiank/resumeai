import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TEMPLATE_ID,
  getTemplateById,
  isTemplateId,
  TEMPLATE_CATALOG,
} from '@/lib/template-catalog';

describe('template catalog', () => {
  it('contains unique template ids', () => {
    const ids = TEMPLATE_CATALOG.map((t) => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('has a valid default template id', () => {
    expect(isTemplateId(DEFAULT_TEMPLATE_ID)).toBe(true);
    expect(getTemplateById(DEFAULT_TEMPLATE_ID)).toBeTruthy();
  });

  it('returns false for unknown ids', () => {
    expect(isTemplateId('does-not-exist')).toBe(false);
    expect(getTemplateById('does-not-exist')).toBeUndefined();
  });

  it('marks premium and free templates correctly', () => {
    const hasFree = TEMPLATE_CATALOG.some((t) => !t.isPremium);
    const hasPremium = TEMPLATE_CATALOG.some((t) => t.isPremium);
    expect(hasFree).toBe(true);
    expect(hasPremium).toBe(true);
  });
});
