import { CSPProvider } from '@base-ui/react/csp-provider';
import { Sparkles, X } from 'lucide-react';
import { useEffect, useLayoutEffect, useState } from 'react';
import { AboutFeedbackSection } from '@/components/options/about-feedback-section';
import { BehaviorSettingsSection } from '@/components/options/behavior-settings-section';
import { DefaultGuidesSection } from '@/components/options/default-guides-section';
import { GeneralSettingsSection } from '@/components/options/general-settings-section';
import { HotkeysSettingsSection } from '@/components/options/hotkeys-settings-section';
import { InspectSettingsSection } from '@/components/options/inspect-settings-section';
import { OptionsHeader } from '@/components/options/options-header';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useExtensionSettings } from '@/hooks/use-extension-settings';
import { setLanguageOverride } from '@/lib/locale-manager';
import { PortalContext } from '@/lib/portal-context';
import { ThemeProvider } from '@/lib/theme-provider';

export function OptionsApp() {
  const { settings, persistSettings, resetAllSettings } =
    useExtensionSettings();
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(
    () =>
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('welcome') === '1',
  );

  useLayoutEffect(() => {
    setLanguageOverride(settings.language);
  }, [settings.language]);

  const pageTitle = i18n.t('options.title');

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  useEffect(() => {
    const resolvedLang =
      settings.language === 'auto'
        ? (typeof navigator !== 'undefined' && navigator.language) || 'en'
        : settings.language.replace('_', '-');
    document.documentElement.lang = resolvedLang;
  }, [settings.language]);

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

                {showWelcomeBanner && (
                  <div
                    role="status"
                    data-testid="welcome-banner"
                    className="mt-6 flex items-start justify-between gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Sparkles className="size-3.5" aria-hidden="true" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold">
                          {i18n.t('options.welcome.title')}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {i18n.t('options.welcome.description')}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid="welcome-banner-dismiss"
                      className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
                      aria-label={i18n.t('guides.header.closeAriaLabel')}
                      onClick={() => setShowWelcomeBanner(false)}
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                )}

                <main className="mt-8 space-y-8">
                  <GeneralSettingsSection
                    language={settings.language}
                    theme={settings.theme}
                    hasCompletedTour={settings.hasCompletedTour}
                    onLanguageChange={(language) =>
                      persistSettings((prev) => ({ ...prev, language }))
                    }
                    onThemeChange={(theme) =>
                      persistSettings((prev) => ({ ...prev, theme }))
                    }
                    onResetTour={() =>
                      persistSettings((prev) => ({
                        ...prev,
                        hasCompletedTour: false,
                      }))
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

                  <AboutFeedbackSection />
                </main>
              </div>
            </div>
          </TooltipProvider>
        </PortalContext.Provider>
      </ThemeProvider>
    </CSPProvider>
  );
}
