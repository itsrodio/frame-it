import { Globe, Monitor, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LANGUAGE_OPTIONS } from '@/lib/locale-manager';
import type { Theme } from '@/lib/theme-provider';
import type { ExtensionLanguage } from '@/types/settings';

export interface GeneralSettingsSectionProps {
  language: ExtensionLanguage;
  theme: Theme;
  onLanguageChange: (language: ExtensionLanguage) => void;
  onThemeChange: (theme: Theme) => void;
}

export function GeneralSettingsSection({
  language,
  theme,
  onLanguageChange,
  onThemeChange,
}: GeneralSettingsSectionProps) {
  const languageItems = LANGUAGE_OPTIONS.map((opt) => ({
    value: opt.value,
    label:
      opt.value === 'auto'
        ? i18n.t('options.general.languageAuto')
        : `${opt.nativeLabel} (${opt.value})`,
  }));

  const themeOptions: Array<{
    value: Theme;
    label: string;
    icon: typeof Monitor;
  }> = [
    {
      value: 'system',
      label: i18n.t('options.general.themeSystem'),
      icon: Monitor,
    },
    {
      value: 'light',
      label: i18n.t('options.general.themeLight'),
      icon: Sun,
    },
    {
      value: 'dark',
      label: i18n.t('options.general.themeDark'),
      icon: Moon,
    },
  ];

  return (
    <section className="rounded-xl border bg-card p-6 shadow-xs">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Globe className="size-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">
            {i18n.t('options.general.title')}
          </h2>
          <p className="text-xs text-muted-foreground">
            {i18n.t('options.general.description')}
          </p>
        </div>
      </div>

      <div className="divide-y">
        <div className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-medium">
              {i18n.t('options.general.language')}
            </div>
            <div className="text-xs text-muted-foreground">
              {i18n.t('options.general.languageDescription')}
            </div>
          </div>
          <div className="w-full sm:w-56">
            <Select
              items={languageItems}
              value={language}
              onValueChange={(val) =>
                onLanguageChange(val as ExtensionLanguage)
              }
            >
              <SelectTrigger
                id="options-language-select"
                className="h-8 w-full text-xs"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {languageItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-3 py-4 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-medium">
              {i18n.t('options.general.theme')}
            </div>
            <div className="text-xs text-muted-foreground">
              {i18n.t('options.general.themeDescription')}
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1">
            {themeOptions.map((item) => {
              const Icon = item.icon;
              const isSelected = theme === item.value;
              return (
                <Button
                  key={item.value}
                  variant={isSelected ? 'default' : 'ghost'}
                  size="xs"
                  data-testid={`theme-${item.value}`}
                  onClick={() => onThemeChange(item.value)}
                  className="h-7 px-2.5 text-xs"
                >
                  <Icon className="size-3.5" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
