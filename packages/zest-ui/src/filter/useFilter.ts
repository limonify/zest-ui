'use client';
import * as React from 'react';

export interface UseFilterParameters extends Intl.CollatorOptions {
  /**
   * The locale to compare in, as a BCP 47 language tag. Defaults to the
   * runtime's.
   */
  locale?: string | undefined;
}

export interface UseFilterReturnValue {
  /**
   * Whether `string` starts with `substring`.
   */
  startsWith: (string: string, substring: string) => boolean;
  /**
   * Whether `string` ends with `substring`.
   */
  endsWith: (string: string, substring: string) => boolean;
  /**
   * Whether `string` contains `substring` anywhere.
   */
  contains: (string: string, substring: string) => boolean;
}

/**
 * Locale-aware string matching for filtering a list.
 *
 * `Intl.Collator` is what makes this better than `toLowerCase().includes()`: at
 * the default `'base'` sensitivity, "resume" matches "Résumé" and "PENO" matches
 * "Jalapeño" — which a lowercase comparison never will. Pass
 * `sensitivity: 'case'` (or any other `Intl.CollatorOptions`) to tighten it.
 *
 * All three compare a **fixed-width** window, so a query only matches a run of
 * the same length. Characters that fold to a different number of characters are
 * therefore not matched across that boundary: "straße" (6) does not find
 * "STRASSE" (7), even though the collator considers the two equal. Scanning
 * every width instead would make every keystroke quadratic.
 *
 * ```tsx
 * const { contains } = useFilter({ sensitivity: 'base' });
 * const matches = items.filter((item) => contains(item.label, query));
 * ```
 *
 * This is the default filter behind `Combobox.Root` and `Autocomplete.Root`;
 * use it directly when you filter the items yourself.
 */
export function useFilter(options?: UseFilterParameters): UseFilterReturnValue {
  const { locale, ...collatorOptions } = options ?? {};

  // `usage: 'search'` is what makes a collator answer "are these equal for
  // matching purposes" rather than "how do these sort".
  const collator = React.useMemo(
    () =>
      new Intl.Collator(locale, { usage: 'search', sensitivity: 'base', ...collatorOptions }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, JSON.stringify(collatorOptions)],
  );

  return React.useMemo(
    () => ({
      startsWith(string: string, substring: string) {
        if (substring.length === 0) {
          return true;
        }

        return collator.compare(string.slice(0, substring.length), substring) === 0;
      },
      endsWith(string: string, substring: string) {
        if (substring.length === 0) {
          return true;
        }

        return collator.compare(string.slice(-substring.length), substring) === 0;
      },
      contains(string: string, substring: string) {
        if (substring.length === 0) {
          return true;
        }

        // A collator compares whole strings, so a scan is the only way to ask
        // about a substring.
        for (let index = 0; index <= string.length - substring.length; index += 1) {
          if (collator.compare(string.slice(index, index + substring.length), substring) === 0) {
            return true;
          }
        }

        return false;
      },
    }),
    [collator],
  );
}
