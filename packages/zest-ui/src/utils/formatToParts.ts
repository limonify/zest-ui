// `Intl.NumberFormat.prototype.formatToParts`, with a fallback for engines that
// do not have it.
//
// **Hermes does not implement it.** `Intl.NumberFormat` is there and `format()`
// works, but `formatToParts` is undefined — so a React Native app blurring a
// NumberField died with "undefined is not a function" from `parse.ts`, while
// every test passed, because Jest runs on Node where the method exists. That is
// the shape of the bug: an API that is present everywhere it is tested and
// missing on the only platform that ships.
//
// The fallback derives the parts from `format()` alone. It reproduces what
// `parse.ts` actually reads — the grouping separator, the decimal separator, and
// the currency or unit label — and it is deliberately NOT a complete
// `formatToParts`: it does not attempt `exponentSeparator`, `compact` notation
// suffixes, or the `literal` placement of a real implementation. Where the engine
// has the real method, that is what runs.

/**
 * Digits in every numbering system `Intl.NumberFormat` emits here — ASCII,
 * Arabic-Indic, Persian, fullwidth and Han. Kept in step with `parse.ts`'s own
 * numeral handling.
 */
const DIGIT_RE = /[0-9٠-٩۰-۹０-９零〇一二三四五六七八九]/;

const SPACE_RE = /\p{Zs}/u;
const SIGN_RE = /[-−－‒–—﹣+＋﹢]/;
const PERCENT_RE = /[%٪％﹪‰؉]/;

/**
 * A value with both a grouping position and a fractional digit, so one format
 * call surfaces both separators. The same sample `parse.ts` uses.
 */
const SAMPLE = 11111.1;

interface Run {
  digits: boolean;
  value: string;
}

/** Consecutive runs of digits and non-digits, in order. */
function toRuns(text: string): Run[] {
  const runs: Run[] = [];

  for (const char of text) {
    const digits = DIGIT_RE.test(char);
    const last = runs[runs.length - 1];

    if (last && last.digits === digits) {
      last.value += char;
    } else {
      runs.push({ digits, value: char });
    }
  }

  return runs;
}

const separatorCache = new Map<string, { group?: string; decimal?: string }>();

/**
 * The locale's grouping and decimal separators, read off a plain `format()`.
 *
 * Probed with the caller's own locale and numbering system but NOT its options:
 * a caller asking for `maximumFractionDigits: 0` or `useGrouping: false` would
 * otherwise suppress the very symbol being looked for. `parse.ts` resolves the
 * decimal separately for exactly that reason.
 */
function separatorsOf(formatter: Intl.NumberFormat): { group?: string; decimal?: string } {
  const { locale, numberingSystem } = formatter.resolvedOptions();
  const key = `${locale}|${numberingSystem}`;
  const cached = separatorCache.get(key);

  if (cached) {
    return cached;
  }

  const text = new Intl.NumberFormat(locale, {
    numberingSystem,
    useGrouping: true,
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(SAMPLE);

  const runs = toRuns(text);
  // Only separators BETWEEN two digit runs count; a leading currency symbol or a
  // trailing unit is not one.
  const between = runs
    .filter((run, index) => !run.digits && runs[index - 1]?.digits && runs[index + 1]?.digits)
    .map((run) => run.value);

  // Grouping first, decimal last. A locale that declines to group five digits
  // yields one separator, and it is the decimal.
  const result =
    between.length > 1
      ? { group: between[0], decimal: between[between.length - 1] }
      : { group: undefined, decimal: between[0] };

  separatorCache.set(key, result);

  return result;
}

/**
 * Splits a leading or trailing run into the symbol and the space around it.
 *
 * `parse.ts` turns the currency and unit values into regexes and strips them from
 * typed input, so " €" would be a regex that fails against "11,11€". A real
 * `formatToParts` emits the space as its own `literal`, and so does this.
 */
function symbolParts(
  text: string,
  symbolType: Intl.NumberFormatPartTypes,
): Intl.NumberFormatPart[] {
  const parts: Intl.NumberFormatPart[] = [];
  let buffer = '';
  let bufferType: Intl.NumberFormatPartTypes | undefined;

  const flush = () => {
    if (buffer && bufferType) {
      parts.push({ type: bufferType, value: buffer });
    }
    buffer = '';
    bufferType = undefined;
  };

  for (const char of text) {
    const type: Intl.NumberFormatPartTypes = SPACE_RE.test(char)
      ? 'literal'
      : SIGN_RE.test(char)
        ? char === '+' || char === '＋' || char === '﹢'
          ? 'plusSign'
          : 'minusSign'
        : PERCENT_RE.test(char)
          ? 'percentSign'
          : symbolType;

    if (type !== bufferType) {
      flush();
      bufferType = type;
    }

    buffer += char;
  }

  flush();

  return parts;
}

/** The parts of `formatter.format(value)`, derived from the string. */
function deriveParts(formatter: Intl.NumberFormat, value: number): Intl.NumberFormatPart[] {
  const text = formatter.format(value);
  const { group, decimal } = separatorsOf(formatter);
  const { style } = formatter.resolvedOptions();

  const symbolType: Intl.NumberFormatPartTypes =
    style === 'currency' ? 'currency' : style === 'unit' ? 'unit' : 'literal';

  const runs = toRuns(text);
  const decimalIndex = runs.findIndex(
    (run, index) =>
      !run.digits &&
      decimal !== undefined &&
      run.value === decimal &&
      Boolean(runs[index - 1]?.digits) &&
      Boolean(runs[index + 1]?.digits),
  );

  const parts: Intl.NumberFormatPart[] = [];

  runs.forEach((run, index) => {
    if (run.digits) {
      parts.push({
        type: decimalIndex !== -1 && index > decimalIndex ? 'fraction' : 'integer',
        value: run.value,
      });
      return;
    }

    const between = Boolean(runs[index - 1]?.digits) && Boolean(runs[index + 1]?.digits);

    if (between && group !== undefined && run.value === group) {
      parts.push({ type: 'group', value: run.value });
      return;
    }

    if (index === decimalIndex) {
      parts.push({ type: 'decimal', value: run.value });
      return;
    }

    parts.push(...symbolParts(run.value, between ? 'literal' : symbolType));
  });

  return parts;
}

/**
 * `formatter.formatToParts(value)` where the engine has it, a derivation where it
 * does not.
 */
export function formatToParts(
  formatter: Intl.NumberFormat,
  value: number,
): Intl.NumberFormatPart[] {
  if (typeof formatter.formatToParts === 'function') {
    return formatter.formatToParts(value);
  }

  return deriveParts(formatter, value);
}
