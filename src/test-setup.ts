import {
  generateChromeMessages,
  parseMessagesObject,
} from '@wxt-dev/i18n/build';
import { beforeEach } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import de from '@/locales/de.json';
import en from '@/locales/en.json';
import es from '@/locales/es.json';
import fr from '@/locales/fr.json';
import ja from '@/locales/ja.json';
import ko from '@/locales/ko.json';
import pt_BR from '@/locales/pt_BR.json';
import ru from '@/locales/ru.json';
import zh_CN from '@/locales/zh_CN.json';

export const LOCALE_RAW_MAPS = {
  en,
  es,
  zh_CN,
  pt_BR,
  de,
  fr,
  ru,
  ja,
  ko,
} as const;

export type SupportedLocaleCode = keyof typeof LOCALE_RAW_MAPS;

const compiledLocales: Record<
  SupportedLocaleCode,
  Record<string, { message: string }>
> = {
  en: generateChromeMessages(parseMessagesObject(en)),
  es: generateChromeMessages(parseMessagesObject(es)),
  zh_CN: generateChromeMessages(parseMessagesObject(zh_CN)),
  pt_BR: generateChromeMessages(parseMessagesObject(pt_BR)),
  de: generateChromeMessages(parseMessagesObject(de)),
  fr: generateChromeMessages(parseMessagesObject(fr)),
  ru: generateChromeMessages(parseMessagesObject(ru)),
  ja: generateChromeMessages(parseMessagesObject(ja)),
  ko: generateChromeMessages(parseMessagesObject(ko)),
};

let currentLocale: SupportedLocaleCode = 'en';

export function setTestLocale(locale: SupportedLocaleCode): void {
  currentLocale = locale;
}

export function getTestLocale(): SupportedLocaleCode {
  return currentLocale;
}

function installI18nMock(): void {
  fakeBrowser.i18n.getUILanguage = () => currentLocale.replace('_', '-');
  fakeBrowser.i18n.getMessage = (
    messageName: string,
    substitutions?: string | (string | number)[],
  ) => {
    const messages = compiledLocales[currentLocale] ?? compiledLocales.en;
    const entry = messages[messageName] ?? compiledLocales.en[messageName];
    if (!entry) return '';

    const subs =
      substitutions === undefined
        ? []
        : Array.isArray(substitutions)
          ? substitutions.map(String)
          : [String(substitutions)];

    return entry.message.replace(/\$([1-9]|\$)/g, (_, token: string) => {
      if (token === '$') return '$';
      const idx = Number(token) - 1;
      return subs[idx] ?? '';
    });
  };
}

installI18nMock();

beforeEach(async () => {
  fakeBrowser.reset();
  currentLocale = 'en';
  installI18nMock();
  const { DEFAULT_EXTENSION_SETTINGS, setCachedSettings } = await import(
    '@/lib/settings-storage'
  );
  setCachedSettings(DEFAULT_EXTENSION_SETTINGS);
});
