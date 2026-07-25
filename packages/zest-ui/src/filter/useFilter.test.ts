import { renderHook } from '@testing-library/react-native';
import { useFilter } from './useFilter';

async function filter(options?: Parameters<typeof useFilter>[0]) {
  const { result } = await renderHook(() => useFilter(options));
  return result.current;
}

describe('useFilter', () => {
  it('matches ignoring case and accents by default', async () => {
    const { contains, startsWith, endsWith } = await filter();

    expect(contains('Résumé', 'resume')).toBe(true);
    expect(contains('Jalapeño Popper', 'PENO')).toBe(true);
    expect(startsWith('Résumé', 'RES')).toBe(true);
    expect(endsWith('Café Noir', 'noir')).toBe(true);
  });

  it('compares a fixed-width window, so a query cannot be longer than what it matches', async () => {
    const { contains } = await filter();

    // Documented limitation: "ß" folds to two characters, so the 6-character
    // query never lines up with the 7-character string.
    expect(contains('STRASSE', 'straße')).toBe(false);
  });

  it('finds a substring anywhere, and reports a miss', async () => {
    const { contains } = await filter();

    expect(contains('Banana bread', 'ana')).toBe(true);
    expect(contains('Banana bread', 'bread')).toBe(true);
    expect(contains('Banana bread', 'cake')).toBe(false);
  });

  it('treats an empty query as a match, so an untouched field filters nothing out', async () => {
    const { contains, startsWith, endsWith } = await filter();

    expect(contains('Anything', '')).toBe(true);
    expect(startsWith('Anything', '')).toBe(true);
    expect(endsWith('Anything', '')).toBe(true);
  });

  it('never matches a query longer than the string', async () => {
    const { contains, startsWith, endsWith } = await filter();

    expect(contains('ab', 'abc')).toBe(false);
    expect(startsWith('ab', 'abc')).toBe(false);
    expect(endsWith('ab', 'abc')).toBe(false);
  });

  it('respects a tighter sensitivity', async () => {
    const { contains } = await filter({ sensitivity: 'case' });

    // Case now counts, so a lowercase query no longer finds the capital R…
    expect(contains('Résumé', 'resume')).toBe(false);
    expect(contains('Résumé', 'résumé')).toBe(false);
    // …but accents still fold at this sensitivity.
    expect(contains('Résumé', 'Resume')).toBe(true);
  });

  it('keeps a stable identity while its options do not change', async () => {
    const { result, rerender } = await renderHook(() => useFilter({ sensitivity: 'base' }));
    const first = result.current;

    await rerender({});

    expect(result.current).toBe(first);
  });
});
