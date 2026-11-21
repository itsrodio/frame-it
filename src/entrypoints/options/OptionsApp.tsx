import { CSPProvider } from '@base-ui/react/csp-provider';
import { useEffect } from 'react';
import { BehaviorSettingsSection } from '@/components/options/behavior-settings-section';
import { DefaultGuidesSection } from '@/components/options/default-guides-section';
import { GeneralSettingsSection } from '@/components/options/general-settings-section';
import { HotkeysSettingsSection } from '@/components/options/hotkeys-settings-section';
import { InspectSettingsSection } from '@/components/options/inspect-settings-section';
import { OptionsHeader } from '@/components/options/options-header';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useExtensionSettings } from '@/hooks/use-extension-settings';
import { setLanguageOverride } from '@/lib/locale-manager';
import { PortalContext } from '@/lib/portal-context';
import { ThemeProvider } from '@/lib/theme-provider';

export function OptionsApp() {
  const { settings, persistSettings, resetAllSettings } =
    useExtensionSettings();

  setLanguageOverride(settings.language);
  const pageTitle = i18n.t('options.title');

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  return (
    <CSPProvider disableStyleElements>
      <ThemeProvider
        defaultTheme={settings.theme}
        container={document.documentElement}
      >
        <PortalContext.Provider value={document.body}>
          <TooltipProvider>
            <div className="min-h-screen bg-background text-foreground">
              <div className="mx-auto max-w-4xl px-6 py-10">
                <OptionsHeader onResetAll={() => void resetAllSettings()} />

                <main className="mt-8 space-y-8">
                  <GeneralSettingsSection
                    language={settings.language}
                    theme={settings.theme}
                    onLanguageChange={(language) =>
                      persistSettings((prev) => ({ ...prev, language }))
                    }
                    onThemeChange={(theme) =>
                      persistSettings((prev) => ({ ...prev, theme }))
                    }
                  />

                  <BehaviorSettingsSection
                    behavior={settings.behavior}
                    onChange={(patch) =>
                      persistSettings((prev) => ({
                        ...prev,
                        behavior: { ...prev.behavior, ...patch },
                      }))
                    }
                  />

                  <InspectSettingsSection
                    inspect={settings.inspect}
                    onChange={(patch) =>
                      persistSettings((prev) => ({
                        ...prev,
                        inspect: { ...prev.inspect, ...patch },
                      }))
                    }
                  />

                  <HotkeysSettingsSection
                    hotkeys={settings.hotkeys}
                    onChange={(hotkeys) =>
                      persistSettings((prev) => ({ ...prev, hotkeys }))
                    }
                  />

                  <DefaultGuidesSection
                    defaultGuides={settings.defaultGuides}
                    onChange={(updater) =>
                      persistSettings((prev) => ({
                        ...prev,
                        defaultGuides: updater(prev.defaultGuides),
                      }))
                    }
                  />
                </main>
              </div>
            </div>
          </TooltipProvider>
        </PortalContext.Provider>
      </ThemeProvider>
    </CSPProvider>
  );
}
