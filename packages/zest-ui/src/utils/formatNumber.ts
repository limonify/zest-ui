function stringifyLocale(locale?: Intl.LocalesArgument): string {
  if (Array.isArray(locale)) {
    return locale.map((value) => stringifyLocale(value)).join(',');
  }

  if (locale == null) {
    return '';
  }

  return String(locale);
}

// Constructing an Intl.NumberFormat is expensive, and a number field re-formats
// on every keystroke.
const cache = new Map<string, Intl.NumberFormat>();

export function getFormatter(locale?: Intl.LocalesArgument, options?: Intl.NumberFormatOptions) {
  const key = JSON.stringify({ locale: stringifyLocale(locale), options });
  const cached = cache.get(key);

  if (cached) {
    return cached;
  }

  const formatter = new Intl.NumberFormat(locale as string | string[] | undefined, options);
  cache.set(key, formatter);

  return formatter;
}

export function formatNumber(
  value: number | null,
  locale?: Intl.LocalesArgument,
  options?: Intl.NumberFormatOptions,
) {
  if (value == null) {
    return '';
  }

  return getFormatter(locale, options).format(value);
}
