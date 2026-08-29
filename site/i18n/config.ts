/** English is source. Hindi is machine-generated. No fr/de/es. */
export const locales = ['en', 'hi'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === 'string' &&
    (locales as readonly string[]).includes(value)
  );
}
