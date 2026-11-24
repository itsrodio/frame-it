import { Compass, Globe, Monitor, Moon, Sun } from 'lucide-react';
import { OptionsSectionCard } from '@/components/options/options-section-card';
import { SegmentedControl } from '@/components/overlay/shared/segmented-control';
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
  hasCompletedTour?: boolean;
  onLanguageChange: (language: ExtensionLanguage) => void;
  onThemeChange: (theme: Theme) => void;
  onResetTour?: () => void;
}

export function GeneralSettingsSection({
  language,
  theme,
  hasCompletedTour = false,
  onLanguageChange,
  onThemeChange,
  onResetTour,
}: GeneralSettingsSectionProps) {
  const languageItems = LANGUAGE_OPTIONS.map((opt) => ({
    value: opt.value,
    label:
      opt.value === 'auto'
        ? i18n.t('options.general.languageAuto')
        : `${opt.nativeLabel} (${opt.value})`,
  }));

  const themeItems: Array<{
    value: Theme;
    label: React.ReactNode;
    testId: string;
  }> = [
    {
      value: 'system',
      testId: 'theme-system',
      label: (
        <>
          <Monitor className="size-3.5" />
          <span>{i18n.t('options.general.themeSystem')}</span>
        </>
      ),
    },
    {
      value: 'light',
      testId: 'theme-light',
      label: (
        <>
          <Sun className="size-3.5" />
          <span>{i18n.t('options.general.themeLight')}</span>
        </>
      ),
    },
    {
      value: 'dark',
      testId: 'theme-dark',
      label: (
        <>
          <Moon className="size-3.5" />
          <span>{i18n.t('options.general.themeDark')}</span>
        </>
      ),
    },
  ];

  return (
    <OptionsSectionCard
      icon={Globe}
      title={i18n.t('options.general.title')}
      description={i18n.t('options.general.description')}
    >
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
          <SegmentedControl
            items={themeItems}
            value={theme}
            onValueChange={onThemeChange}
            className="h-8 rounded-lg bg-muted/40 p-1"
            itemClassName="h-full gap-1.5 rounded-md px-2.5 text-xs"
          />
        </div>

        {onResetTour && (
          <div className="flex flex-col gap-3 py-4 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-medium">
                {i18n.t('options.general.onboardingTour')}
              </div>
              <div className="text-xs text-muted-foreground">
                {i18n.t('options.general.onboardingTourDescription')}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasCompletedTour}
              data-testid="reset-onboarding-tour"
              onClick={onResetTour}
              className="w-fit gap-1.5 text-xs"
            >
              <Compass className="size-3.5" aria-hidden="true" />
              <span>
                {hasCompletedTour
                  ? i18n.t('options.general.resetTour')
                  : i18n.t('options.general.tourReady')}
              </span>
            </Button>
          </div>
        )}
      </div>
    </OptionsSectionCard>
  );
}
