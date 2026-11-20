import de from '@/locales/de.json';
import en from '@/locales/en.json';
import es from '@/locales/es.json';
import fr from '@/locales/fr.json';
import ja from '@/locales/ja.json';
import ko from '@/locales/ko.json';
import pt_BR from '@/locales/pt_BR.json';
import ru from '@/locales/ru.json';
import zh_CN from '@/locales/zh_CN.json';
import type { ExtensionLanguage, SupportedLocale } from '@/types/settings';

export const RAW_LOCALES: Record<SupportedLocale, typeof en> = {
  en,
  es,
  zh_CN,
  pt_BR,
  de,
  fr,
  ru,
  ja,
  ko,
};

export const LANGUAGE_OPTIONS: Array<{
  value: ExtensionLanguage;
  nativeLabel: string;
}> = [
  { value: 'auto', nativeLabel: 'Auto' },
  { value: 'en', nativeLabel: 'English' },
  { value: 'es', nativeLabel: 'Español' },
  { value: 'zh_CN', nativeLabel: '简体中文' },
  { value: 'pt_BR', nativeLabel: 'Português (Brasil)' },
  { value: 'de', nativeLabel: 'Deutsch' },
  { value: 'fr', nativeLabel: 'Français' },
  { value: 'ru', nativeLabel: 'Русский' },
  { value: 'ja', nativeLabel: '日本語' },
  { value: 'ko', nativeLabel: '한국어' },
];

function flattenLocaleObject(
  obj: Record<string, unknown>,
  prefix = '',
  out: Record<string, string> = {},
): Record<string, string> {
  for (const [key, value] of Object.entries(obj)) {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      out[nextKey] = value;
    } else if (typeof value === 'object' && value !== null) {
      flattenLocaleObject(value as Record<string, unknown>, nextKey, out);
    }
  }
  return out;
}

const FLATTENED_LOCALES: Record<SupportedLocale, Record<string, string>> = {
  en: flattenLocaleObject(en),
  es: flattenLocaleObject(es),
  zh_CN: flattenLocaleObject(zh_CN),
  pt_BR: flattenLocaleObject(pt_BR),
  de: flattenLocaleObject(de),
  fr: flattenLocaleObject(fr),
  ru: flattenLocaleObject(ru),
  ja: flattenLocaleObject(ja),
  ko: flattenLocaleObject(ko),
};

const originalT = i18n.t.bind(i18n);
let currentLanguageOverride: ExtensionLanguage = 'auto';

function formatMessageWithSubs(template: string, args: unknown[]): string {
  let subs: unknown[] = [];
  for (const arg of args) {
    if (Array.isArray(arg)) {
      subs = arg;
    } else if (typeof arg === 'number') {
      subs = [String(arg)];
    }
  }

  if (subs.length === 0) return template;

  return template.replace(/\$([1-9]|\$)/g, (_, token: string) => {
    if (token === '$') return '$';
    const index = Number(token) - 1;
    return subs[index] !== undefined ? String(subs[index]) : '';
  });
}

// Patch i18n.t so all existing type-safe i18n.t(...) calls automatically respect the user's language setting
const patchedT = ((key: string, ...args: unknown[]) => {
  if (currentLanguageOverride !== 'auto') {
    const dict =
      FLATTENED_LOCALES[currentLanguageOverride] ?? FLATTENED_LOCALES.en;
    const template = dict[key] ?? FLATTENED_LOCALES.en[key];
    if (template !== undefined) {
      return formatMessageWithSubs(template, args);
    }
  }
  try {
    return (originalT as (k: string, ...a: unknown[]) => string)(key, ...args);
  } catch {
    const fallback = FLATTENED_LOCALES.en[key];
    return fallback !== undefined ? formatMessageWithSubs(fallback, args) : '';
  }
}) as typeof i18n.t;

i18n.t = patchedT;

export function setLanguageOverride(language: ExtensionLanguage): void {
  currentLanguageOverride = language;
}

export function getLanguageOverride(): ExtensionLanguage {
  return currentLanguageOverride;
}
