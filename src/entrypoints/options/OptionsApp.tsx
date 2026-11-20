import { CSPProvider } from '@base-ui/react/csp-provider';
import {
  Check,
  Columns3,
  Globe,
  Grid2X2,
  Keyboard,
  Monitor,
  Moon,
  RotateCcw,
  Rows3,
  SlidersHorizontal,
  Sun,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import appIcon from '@/assets/icon.png';
import { getGuideTypes } from '@/components/overlay/layout-guides/constants';
import { GridGuideFields } from '@/components/overlay/layout-guides/grid-guide-fields';
import { LinearGuideFields } from '@/components/overlay/layout-guides/linear-guide-fields';
import { LayoutGuidesOverlay } from '@/components/overlay/layout-guides-overlay';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { TooltipProvider } from '@/components/ui/tooltip';
import { normalizeHexColor } from '@/lib/guide-utils';
import {
  DEFAULT_HOTKEYS,
  eventToHotkeyBinding,
  formatHotkey,
  HOTKEY_ACTIONS,
  isHotkeyEqual,
} from '@/lib/hotkeys';
import { LANGUAGE_OPTIONS, setLanguageOverride } from '@/lib/locale-manager';
import { PortalContext } from '@/lib/portal-context';
import {
  DEFAULT_EXTENSION_SETTINGS,
  getCachedSettings,
  loadExtensionSettings,
  resetExtensionSettings,
  saveExtensionSettings,
  subscribeExtensionSettings,
} from '@/lib/settings-storage';
import { type Theme, ThemeProvider } from '@/lib/theme-provider';
import type {
  BaseGuideSettings,
  GridGuideSettings,
  GuideType,
  LinearGuideSettings,
} from '@/types/layout-guides';
import type {
  ExtensionBehaviorSettings,
  ExtensionLanguage,
  ExtensionSettings,
  HotkeyAction,
} from '@/types/settings';

const HOTKEY_LABEL_KEYS = {
  toggleGuides: 'options.hotkeys.toggleGuides',
  toggleInspect: 'options.hotkeys.toggleInspect',
  autoDetect: 'options.hotkeys.autoDetect',
  pickContainer: 'options.hotkeys.pickContainer',
  switchColumns: 'options.hotkeys.switchColumns',
  switchRows: 'options.hotkeys.switchRows',
  switchGrid: 'options.hotkeys.switchGrid',
} as const;

export function OptionsApp() {
  const [settings, setSettings] =
    useState<ExtensionSettings>(getCachedSettings);
  const [activeDefaultTab, setActiveDefaultTab] =
    useState<GuideType>('columns');
  const [recordingAction, setRecordingAction] = useState<HotkeyAction | null>(
    null,
  );

  // Sync language override before rendering translated texts
  setLanguageOverride(settings.language);
  const pageTitle = i18n.t('options.title');

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  useEffect(() => {
    let active = true;

    const syncIfChanged = (incoming: ExtensionSettings) => {
      if (!active) return;
      setSettings((prev) =>
        JSON.stringify(prev) === JSON.stringify(incoming) ? prev : incoming,
      );
    };

    void loadExtensionSettings().then(syncIfChanged);
    const unsubscribe = subscribeExtensionSettings(syncIfChanged);

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const persistSettings = useCallback(
    (
      nextOrUpdater:
        | ExtensionSettings
        | ((prev: ExtensionSettings) => ExtensionSettings),
    ) => {
      setSettings((prev) => {
        const next =
          typeof nextOrUpdater === 'function'
            ? nextOrUpdater(prev)
            : nextOrUpdater;
        setLanguageOverride(next.language);
        void saveExtensionSettings(next);
        return next;
      });
    },
    [],
  );

  // Capture key combination when recording a shortcut
  useEffect(() => {
    if (!recordingAction) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        setRecordingAction(null);
        return;
      }

      const binding = eventToHotkeyBinding(e);
      if (!binding) return;

      persistSettings((prev) => ({
        ...prev,
        hotkeys: {
          ...prev.hotkeys,
          [recordingAction]: binding,
        },
      }));
      setRecordingAction(null);
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [persistSettings, recordingAction]);

  const updateBehavior = (patch: Partial<ExtensionBehaviorSettings>) => {
    persistSettings((prev) => ({
      ...prev,
      behavior: {
        ...prev.behavior,
        ...patch,
      },
    }));
  };

  const updateDefaultColumns = (patch: Partial<LinearGuideSettings>) => {
    persistSettings((prev) => ({
      ...prev,
      defaultGuides: {
        ...prev.defaultGuides,
        columns: {
          ...prev.defaultGuides.columns,
          ...patch,
        },
      },
    }));
  };

  const updateDefaultRows = (patch: Partial<LinearGuideSettings>) => {
    persistSettings((prev) => ({
      ...prev,
      defaultGuides: {
        ...prev.defaultGuides,
        rows: {
          ...prev.defaultGuides.rows,
          ...patch,
        },
      },
    }));
  };

  const updateDefaultGrid = (patch: Partial<GridGuideSettings>) => {
    persistSettings((prev) => ({
      ...prev,
      defaultGuides: {
        ...prev.defaultGuides,
        grid: {
          ...prev.defaultGuides.grid,
          ...patch,
        },
      },
    }));
  };

  const activeDefaultSettings = settings.defaultGuides[activeDefaultTab];
  const { cleanHex, validCssHex } = normalizeHexColor(
    activeDefaultSettings.color,
  );

  const updateActiveDefaultBase = (patch: Partial<BaseGuideSettings>) => {
    if (activeDefaultTab === 'columns') updateDefaultColumns(patch);
    else if (activeDefaultTab === 'rows') updateDefaultRows(patch);
    else updateDefaultGrid(patch);
  };

  const handleHexChange = (raw: string) => {
    const sanitized = raw.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
    updateActiveDefaultBase({ color: `#${sanitized}` });
  };

  const handleOpacityChange = (raw: string) => {
    const num = Number(raw);
    if (Number.isNaN(num)) return;
    updateActiveDefaultBase({ opacity: Math.max(0, Math.min(100, num)) });
  };

  const languageItems = LANGUAGE_OPTIONS.map((opt) => ({
    value: opt.value,
    label:
      opt.value === 'auto'
        ? i18n.t('options.general.languageAuto')
        : `${opt.nativeLabel} (${opt.value})`,
  }));

  const guideTypeItems = getGuideTypes();

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

  const handleResetAll = () => {
    setRecordingAction(null);
    void resetExtensionSettings().then((defaults) => {
      setLanguageOverride(defaults.language);
      setSettings(defaults);
    });
  };

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
                {/* Top Header */}
                <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs select-none">
                        <img
                          src={appIcon}
                          alt={i18n.t('options.title')}
                          className="size-full object-cover"
                        />
                      </div>
                      <h1 className="text-xl font-semibold tracking-tight">
                        {i18n.t('options.title')}
                      </h1>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        <Check className="size-3" />
                        {i18n.t('options.savedBadge')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {i18n.t('options.subtitle')}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetAll}
                    data-testid="reset-all-settings"
                  >
                    <RotateCcw className="size-3.5" />
                    {i18n.t('options.resetAll')}
                  </Button>
                </header>

                <main className="mt-8 space-y-8">
                  {/* SECTION 1: General & Appearance */}
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
                      {/* Language Selector */}
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
                            value={settings.language}
                            onValueChange={(val) =>
                              persistSettings({
                                ...settings,
                                language: val as ExtensionLanguage,
                              })
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
                                  <SelectItem
                                    key={item.value}
                                    value={item.value}
                                  >
                                    {item.label}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Theme Selector */}
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
                            const isSelected = settings.theme === item.value;
                            return (
                              <Button
                                key={item.value}
                                variant={isSelected ? 'default' : 'ghost'}
                                size="xs"
                                data-testid={`theme-${item.value}`}
                                onClick={() =>
                                  persistSettings({
                                    ...settings,
                                    theme: item.value,
                                  })
                                }
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

                  {/* SECTION 2: Launch & Behavior */}
                  <section className="rounded-xl border bg-card p-6 shadow-xs">
                    <div className="mb-5 flex items-start gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <SlidersHorizontal className="size-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-semibold">
                          {i18n.t('options.behavior.title')}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          {i18n.t('options.behavior.description')}
                        </p>
                      </div>
                    </div>

                    <div className="divide-y">
                      {/* Auto-detect container on launch */}
                      <div className="flex items-center justify-between gap-4 py-3.5 first:pt-0">
                        <div className="space-y-0.5">
                          <div className="text-xs font-medium">
                            {i18n.t('options.behavior.autoDetectOnLaunch')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {i18n.t(
                              'options.behavior.autoDetectOnLaunchDescription',
                            )}
                          </div>
                        </div>
                        <Toggle
                          size="sm"
                          variant="outline"
                          data-testid="toggle-auto-detect-on-launch"
                          pressed={settings.behavior.autoDetectOnLaunch}
                          onPressedChange={(autoDetectOnLaunch) =>
                            updateBehavior({ autoDetectOnLaunch })
                          }
                          className="h-7 min-w-22 text-xs"
                        >
                          {settings.behavior.autoDetectOnLaunch
                            ? i18n.t('options.behavior.enabled')
                            : i18n.t('options.behavior.disabled')}
                        </Toggle>
                      </div>

                      {/* Show guides on launch */}
                      <div className="flex items-center justify-between gap-4 py-3.5">
                        <div className="space-y-0.5">
                          <div className="text-xs font-medium">
                            {i18n.t('options.behavior.guidesEnabledByDefault')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {i18n.t(
                              'options.behavior.guidesEnabledByDefaultDescription',
                            )}
                          </div>
                        </div>
                        <Toggle
                          size="sm"
                          variant="outline"
                          data-testid="toggle-guides-enabled-by-default"
                          pressed={settings.behavior.guidesEnabledByDefault}
                          onPressedChange={(guidesEnabledByDefault) =>
                            updateBehavior({ guidesEnabledByDefault })
                          }
                          className="h-7 min-w-22 text-xs"
                        >
                          {settings.behavior.guidesEnabledByDefault
                            ? i18n.t('options.behavior.enabled')
                            : i18n.t('options.behavior.disabled')}
                        </Toggle>
                      </div>

                      {/* Default guide type */}
                      <div className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-0.5">
                          <div className="text-xs font-medium">
                            {i18n.t('options.behavior.defaultGuideType')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {i18n.t(
                              'options.behavior.defaultGuideTypeDescription',
                            )}
                          </div>
                        </div>
                        <div className="w-full sm:w-44">
                          <Select
                            items={guideTypeItems}
                            value={settings.behavior.defaultGuideType}
                            onValueChange={(val) =>
                              updateBehavior({
                                defaultGuideType: val as GuideType,
                              })
                            }
                          >
                            <SelectTrigger
                              id="options-default-guide-type"
                              className="h-8 w-full text-xs"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {guideTypeItems.map((item) => (
                                  <SelectItem
                                    key={item.value}
                                    value={item.value}
                                  >
                                    {item.label}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Remember per-site settings */}
                      <div className="flex items-center justify-between gap-4 py-3.5">
                        <div className="space-y-0.5">
                          <div className="text-xs font-medium">
                            {i18n.t('options.behavior.rememberSiteSettings')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {i18n.t(
                              'options.behavior.rememberSiteSettingsDescription',
                            )}
                          </div>
                        </div>
                        <Toggle
                          size="sm"
                          variant="outline"
                          data-testid="toggle-remember-site-settings"
                          pressed={settings.behavior.rememberSiteSettings}
                          onPressedChange={(rememberSiteSettings) =>
                            updateBehavior({ rememberSiteSettings })
                          }
                          className="h-7 min-w-22 text-xs"
                        >
                          {settings.behavior.rememberSiteSettings
                            ? i18n.t('options.behavior.enabled')
                            : i18n.t('options.behavior.disabled')}
                        </Toggle>
                      </div>

                      {/* Hold to close */}
                      <div className="flex items-center justify-between gap-4 py-3.5 last:pb-0">
                        <div className="space-y-0.5">
                          <div className="text-xs font-medium">
                            {i18n.t('options.behavior.holdToClose')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {i18n.t('options.behavior.holdToCloseDescription')}
                          </div>
                        </div>
                        <Toggle
                          size="sm"
                          variant="outline"
                          data-testid="toggle-hold-to-close"
                          pressed={settings.behavior.holdToClose}
                          onPressedChange={(holdToClose) =>
                            updateBehavior({ holdToClose })
                          }
                          className="h-7 min-w-22 text-xs"
                        >
                          {settings.behavior.holdToClose
                            ? i18n.t('options.behavior.enabled')
                            : i18n.t('options.behavior.disabled')}
                        </Toggle>
                      </div>
                    </div>
                  </section>

                  {/* SECTION 3: Keyboard Shortcuts */}
                  <section className="rounded-xl border bg-card p-6 shadow-xs">
                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <Keyboard className="size-4" />
                        </div>
                        <div>
                          <h2 className="text-sm font-semibold">
                            {i18n.t('options.hotkeys.title')}
                          </h2>
                          <p className="text-xs text-muted-foreground">
                            {i18n.t('options.hotkeys.description')}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="xs"
                        data-testid="reset-hotkeys"
                        onClick={() => {
                          setRecordingAction(null);
                          persistSettings({
                            ...settings,
                            hotkeys: DEFAULT_HOTKEYS,
                          });
                        }}
                      >
                        <RotateCcw className="size-3" />
                        {i18n.t('options.hotkeys.resetHotkeys')}
                      </Button>
                    </div>

                    <div className="divide-y">
                      {/* Master enable hotkeys toggle */}
                      <div className="flex items-center justify-between gap-4 pb-4">
                        <div className="space-y-0.5">
                          <div className="text-xs font-medium">
                            {i18n.t('options.hotkeys.enableHotkeys')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {i18n.t('options.hotkeys.enableHotkeysDescription')}
                          </div>
                        </div>
                        <Toggle
                          size="sm"
                          variant="outline"
                          data-testid="toggle-hotkeys-enabled"
                          pressed={settings.hotkeys.enabled}
                          onPressedChange={(enabled) =>
                            persistSettings({
                              ...settings,
                              hotkeys: {
                                ...settings.hotkeys,
                                enabled,
                              },
                            })
                          }
                          className="h-7 min-w-22 text-xs"
                        >
                          {settings.hotkeys.enabled
                            ? i18n.t('options.behavior.enabled')
                            : i18n.t('options.behavior.disabled')}
                        </Toggle>
                      </div>

                      {HOTKEY_ACTIONS.map((action) => {
                        const binding = settings.hotkeys[action];
                        const defaultBinding = DEFAULT_HOTKEYS[action];
                        const isRecording = recordingAction === action;
                        const isModified = !isHotkeyEqual(
                          binding,
                          defaultBinding,
                        );

                        return (
                          <div
                            key={action}
                            className="flex items-center justify-between gap-4 py-3 last:pb-0"
                          >
                            <span className="text-xs font-medium">
                              {i18n.t(HOTKEY_LABEL_KEYS[action])}
                            </span>

                            <div className="flex items-center gap-1.5">
                              {isModified && (
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  data-testid={`reset-hotkey-${action}`}
                                  onClick={() =>
                                    persistSettings({
                                      ...settings,
                                      hotkeys: {
                                        ...settings.hotkeys,
                                        [action]: defaultBinding,
                                      },
                                    })
                                  }
                                  aria-label={i18n.t(
                                    'options.hotkeys.resetHotkeys',
                                  )}
                                >
                                  <RotateCcw className="size-3 text-muted-foreground" />
                                </Button>
                              )}

                              <Button
                                variant={isRecording ? 'default' : 'outline'}
                                size="sm"
                                disabled={!settings.hotkeys.enabled}
                                data-testid={`hotkey-record-${action}`}
                                onClick={() =>
                                  setRecordingAction(
                                    isRecording ? null : action,
                                  )
                                }
                                className="h-7 min-w-28 font-mono text-xs"
                              >
                                {isRecording
                                  ? i18n.t('options.hotkeys.pressKeys')
                                  : formatHotkey(binding)}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* SECTION 4: Default Layout Guides */}
                  <section className="rounded-xl border bg-card p-6 shadow-xs">
                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <Columns3 className="size-4" />
                        </div>
                        <div>
                          <h2 className="text-sm font-semibold">
                            {i18n.t('options.defaults.title')}
                          </h2>
                          <p className="text-xs text-muted-foreground">
                            {i18n.t('options.defaults.description')}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="xs"
                        data-testid="reset-default-guides"
                        onClick={() =>
                          persistSettings({
                            ...settings,
                            defaultGuides:
                              DEFAULT_EXTENSION_SETTINGS.defaultGuides,
                          })
                        }
                      >
                        <RotateCcw className="size-3" />
                        {i18n.t('options.defaults.resetDefaults')}
                      </Button>
                    </div>

                    {/* Mode Switcher Tabs (Columns | Rows | Grid) */}
                    <div className="mb-5 flex items-center gap-1 rounded-lg border bg-muted/40 p-1 w-fit">
                      {(
                        [
                          {
                            value: 'columns',
                            label: i18n.t('guides.types.columns'),
                            icon: Columns3,
                          },
                          {
                            value: 'rows',
                            label: i18n.t('guides.types.rows'),
                            icon: Rows3,
                          },
                          {
                            value: 'grid',
                            label: i18n.t('guides.types.grid'),
                            icon: Grid2X2,
                          },
                        ] as const
                      ).map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeDefaultTab === tab.value;
                        return (
                          <Button
                            key={tab.value}
                            variant={isActive ? 'default' : 'ghost'}
                            size="xs"
                            data-testid={`default-tab-${tab.value}`}
                            onClick={() => setActiveDefaultTab(tab.value)}
                            className="h-7 px-3 text-xs"
                          >
                            <Icon className="size-3.5" />
                            {tab.label}
                          </Button>
                        );
                      })}
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Left column: Guide fields */}
                      <div className="rounded-lg border bg-background p-4">
                        <FieldGroup className="gap-2.5">
                          {activeDefaultTab === 'grid' ? (
                            <GridGuideFields
                              settings={settings.defaultGuides.grid}
                              onChange={updateDefaultGrid}
                              cleanHex={cleanHex}
                              validCssHex={validCssHex}
                              opacity={settings.defaultGuides.grid.opacity}
                              onHexChange={handleHexChange}
                              onOpacityChange={handleOpacityChange}
                            />
                          ) : (
                            <LinearGuideFields
                              mode={activeDefaultTab}
                              settings={
                                settings.defaultGuides[activeDefaultTab]
                              }
                              onChange={
                                activeDefaultTab === 'columns'
                                  ? updateDefaultColumns
                                  : updateDefaultRows
                              }
                              cleanHex={cleanHex}
                              validCssHex={validCssHex}
                              opacity={
                                settings.defaultGuides[activeDefaultTab].opacity
                              }
                              onHexChange={handleHexChange}
                              onOpacityChange={handleOpacityChange}
                            />
                          )}
                        </FieldGroup>
                      </div>

                      {/* Right column: Live Interactive Preview */}
                      <div className="flex flex-col rounded-lg border bg-muted/20 p-3">
                        <div className="mb-2 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                          <span>{i18n.t('options.defaults.preview')}</span>
                          <span className="font-mono">
                            {activeDefaultTab === 'grid'
                              ? `${settings.defaultGuides.grid.size}px`
                              : `${settings.defaultGuides[activeDefaultTab].count} × ${settings.defaultGuides[activeDefaultTab].gutter}px`}
                          </span>
                        </div>
                        <div className="relative min-h-56 flex-1 overflow-hidden rounded-md border bg-background shadow-2xs">
                          <LayoutGuidesOverlay
                            state={{
                              enabled: true,
                              type: activeDefaultTab,
                              columns: settings.defaultGuides.columns,
                              rows: settings.defaultGuides.rows,
                              grid: settings.defaultGuides.grid,
                            }}
                            scroll={{ x: 0, y: 0 }}
                          />
                        </div>
                      </div>
                    </div>
                  </section>
                </main>
              </div>
            </div>
          </TooltipProvider>
        </PortalContext.Provider>
      </ThemeProvider>
    </CSPProvider>
  );
}
