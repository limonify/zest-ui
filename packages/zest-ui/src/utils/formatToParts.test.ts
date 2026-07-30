import { formatToParts } from './formatToParts';

/**
 * An engine without `Intl.NumberFormat.prototype.formatToParts` — which is
 * Hermes, and therefore every React Native app.
 *
 * **This shim is the whole point of the file.** Node has the real method, so a
 * test that simply called `formatToParts` would exercise the native path and
 * prove nothing about the fallback — which is exactly how the missing method
 * reached a device in the first place.
 */
function withoutFormatToParts(locale?: string, options?: Intl.NumberFormatOptions) {
  const real = new Intl.NumberFormat(locale, options);

  return {
    format: (value: number) => real.format(value),
    resolvedOptions: () => real.resolvedOptions(),
  } as Intl.NumberFormat;
}

/** What the real implementation produces, as the thing to match. */
function native(locale: string, options: Intl.NumberFormatOptions | undefined, value: number) {
  return new Intl.NumberFormat(locale, options).formatToParts(value);
}

/** The value of the first part of a given type, as `parse.ts` reads them. */
const valueOf = (parts: Intl.NumberFormatPart[], type: string) =>
  parts.find((part) => part.type === type)?.value;

describe('formatToParts', () => {
  it('uses the engine’s own implementation when there is one', () => {
    const formatter = new Intl.NumberFormat('en-US');
    expect(formatToParts(formatter, 11111.1)).toEqual(formatter.formatToParts(11111.1));
  });

  describe('without Intl.NumberFormat.prototype.formatToParts', () => {
    // The four symbols `parse.ts` derives. Everything it does downstream — the
    // group regex, the decimal replacement, stripping currency and unit labels —
    // is built out of these.
    it.each([
      ['en-US', ',', '.'],
      ['de-DE', '.', ','],
      ['tr-TR', '.', ','],
      ['fr-FR', undefined, ','],
      ['en-IN', ',', '.'],
    ])('finds the separators for %s', (locale, group, decimal) => {
      const parts = formatToParts(withoutFormatToParts(locale), 11111.1);
      expect(valueOf(parts, 'decimal')).toBe(decimal);
      if (group !== undefined) {
        expect(valueOf(parts, 'group')).toBe(group);
      } else {
        // fr-FR groups with a narrow no-break space, so assert the shape rather
        // than the codepoint — which differs between ICU versions.
        expect(valueOf(parts, 'group')).toMatch(/\p{Zs}/u);
      }
    });

    it('splits the number into integer and fraction around the decimal', () => {
      const parts = formatToParts(withoutFormatToParts('en-US'), 11111.1);
      expect(parts.filter((p) => p.type === 'integer').map((p) => p.value)).toEqual(['11', '111']);
      expect(valueOf(parts, 'fraction')).toBe('1');
    });

    // Both are turned into regexes and stripped from typed input, so the symbol
    // must not carry the space beside it — " €" would fail to match "11,11€".
    it('separates a currency symbol from the space around it', () => {
      const parts = formatToParts(withoutFormatToParts('de-DE', { style: 'currency', currency: 'EUR' }), 1234.5);
      expect(valueOf(parts, 'currency')).toBe('€');
    });

    it('separates a unit label from the space around it', () => {
      const parts = formatToParts(
        withoutFormatToParts('en-US', { style: 'unit', unit: 'kilometer-per-hour' }),
        60,
      );
      expect(valueOf(parts, 'unit')).toBe('km/h');
    });

    it('marks a percent sign', () => {
      const parts = formatToParts(withoutFormatToParts('en-US', { style: 'percent' }), 0.12);
      expect(valueOf(parts, 'percentSign')).toBe('%');
    });

    it('marks a negative sign', () => {
      const parts = formatToParts(withoutFormatToParts('en-US'), -42);
      expect(valueOf(parts, 'minusSign')).toBe('-');
    });

    // Grouping and fraction digits are both suppressible by the caller's own
    // options, which is why the separators are probed with a plain formatter.
    it('still finds the decimal when the caller asked for no fraction digits', () => {
      const parts = formatToParts(withoutFormatToParts('de-DE', { maximumFractionDigits: 0 }), 11111);
      expect(valueOf(parts, 'group')).toBe('.');
    });

    it('still finds the separators when the caller turned grouping off', () => {
      const parts = formatToParts(withoutFormatToParts('en-US', { useGrouping: false }), 11111.1);
      expect(valueOf(parts, 'decimal')).toBe('.');
    });

    it('handles a non-ASCII numbering system', () => {
      const parts = formatToParts(withoutFormatToParts('ar-EG'), 11111.1);
      expect(valueOf(parts, 'decimal')).toBe(valueOf(native('ar-EG', undefined, 11111.1), 'decimal'));
      expect(valueOf(parts, 'group')).toBe(valueOf(native('ar-EG', undefined, 11111.1), 'group'));
    });
  });
});
