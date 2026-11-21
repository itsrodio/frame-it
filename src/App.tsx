import { CSPProvider } from '@base-ui/react/csp-provider';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Dock } from '@/components/overlay/dock/dock';
import { InspectMeasureOverlay } from '@/components/overlay/inspect/inspect-measure-overlay';
import { ContainerPickerOverlay } from '@/components/overlay/layout-guides/container-picker-overlay';
import { LayoutGuidesOverlay } from '@/components/overlay/layout-guides/layout-guides-overlay';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useExtensionSettings } from '@/hooks/use-extension-settings';
import { useGlobalHotkeys } from '@/hooks/use-global-hotkeys';
import { useTrackedElement } from '@/hooks/use-tracked-element';
import { useWindowScroll } from '@/hooks/use-window-scroll';
import {
  autoDetectPageContainer,
  containerInfoToColumnsPatch,
  extractContainerInfo,
} from '@/lib/container-detector';
import {
  clearSiteCustomState,
  getInitialGuidesSetup,
  runAutoDetectOrDefaults,
  saveSiteCustomState,
} from '@/lib/guides-storage';
import { PortalContext } from '@/lib/portal-context';
import { getCachedSettings } from '@/lib/settings-storage';
import { ThemeProvider } from '@/lib/theme-provider';
import type {
  DetectedContainerInfo,
  GridGuideSettings,
  GuideType,
  LayoutGuidesState,
  LinearGuideSettings,
} from '@/types/layout-guides';
import type { ExtensionSettings } from '@/types/settings';

export type ActiveOverlayTool = 'none' | 'inspect' | 'pick-container';

interface AppProps {
  portalContainer: HTMLElement;
  onClose: () => void;
}

export function App({ portalContainer, onClose }: AppProps) {
  const [initialSetup] = useState(() =>
    getInitialGuidesSetup(getCachedSettings()),
  );
  const [guidesState, setGuidesState] = useState<LayoutGuidesState>(
    initialSetup.state,
  );
  const [hasCustomSiteSettings, setHasCustomSiteSettings] = useState<boolean>(
    initialSetup.hasCustomSiteSettings,
  );
  const hasCustomSiteSettingsRef = useRef(hasCustomSiteSettings);
  hasCustomSiteSettingsRef.current = hasCustomSiteSettings;
  const [activeTool, setActiveTool] = useState<ActiveOverlayTool>('none');
  const [inspectSettings, setInspectSettings] = useState(
    () => getCachedSettings().inspect,
  );
  const [trackedElement, setTrackedElement] = useState<HTMLElement | null>(
    initialSetup.trackedElement,
  );
  const [trackedElementLabel, setTrackedElementLabel] = useState<string | null>(
    initialSetup.trackedElementLabel,
  );

  const handleExternalSettingsChange = useCallback(
    (nextSettings: ExtensionSettings) => {
      setInspectSettings(nextSettings.inspect);
      if (
        !hasCustomSiteSettingsRef.current ||
        !nextSettings.behavior.rememberSiteSettings
      ) {
        const setup = getInitialGuidesSetup(nextSettings);
        setGuidesState(setup.state);
        setTrackedElement(setup.trackedElement);
        setTrackedElementLabel(setup.trackedElementLabel);
        hasCustomSiteSettingsRef.current = setup.hasCustomSiteSettings;
        setHasCustomSiteSettings(setup.hasCustomSiteSettings);
      }
    },
    [],
  );

  const { settings } = useExtensionSettings({
    onExternalChange: handleExternalSettingsChange,
  });

  useEffect(() => {
    if (!hasCustomSiteSettings || !settings.behavior.rememberSiteSettings) {
      return;
    }
    saveSiteCustomState(guidesState);
  }, [
    guidesState,
    hasCustomSiteSettings,
    settings.behavior.rememberSiteSettings,
  ]);

  const needsScroll =
    guidesState.enabled && guidesState[guidesState.type].followScroll;
  const scroll = useWindowScroll(needsScroll);

  const handleClearTrackedElement = useCallback(() => {
    setTrackedElement(null);
    setTrackedElementLabel(null);
  }, []);

  const handleTrackedElementSync = useCallback(
    (info: DetectedContainerInfo) => {
      setTrackedElementLabel(info.label);
      setGuidesState((prev) => ({
        ...prev,
        columns: {
          ...prev.columns,
          ...containerInfoToColumnsPatch(info, prev.columns),
        },
      }));
    },
    [],
  );

  useTrackedElement({
    trackedElement,
    onSync: handleTrackedElementSync,
    onDisconnected: handleClearTrackedElement,
  });

  const applyDetectedContainer = useCallback(
    (info: DetectedContainerInfo, markAsCustom: boolean) => {
      setTrackedElement(info.element);
      setTrackedElementLabel(info.label);
      setHasCustomSiteSettings(markAsCustom);
      if (!markAsCustom) {
        clearSiteCustomState();
      }
      setGuidesState((prev) => ({
        ...prev,
        enabled: true,
        type: 'columns',
        columns: {
          ...prev.columns,
          ...containerInfoToColumnsPatch(info, prev.columns),
        },
      }));
    },
    [],
  );

  const handleAutoDetect = useCallback(() => {
    const detected = autoDetectPageContainer();
    if (detected) {
      applyDetectedContainer(detected, false);
    }
  }, [applyDetectedContainer]);

  const handleToggle = useCallback((enabled: boolean) => {
    setGuidesState((prev) => ({ ...prev, enabled }));
  }, []);

  const handleTypeChange = useCallback((type: GuideType) => {
    setHasCustomSiteSettings(true);
    setGuidesState((prev) => ({
      ...prev,
      type,
      enabled: true,
    }));
  }, []);

  const toggleTool = useCallback((tool: ActiveOverlayTool) => {
    setActiveTool((prev) => (prev === tool ? 'none' : tool));
  }, []);

  useGlobalHotkeys({
    hotkeys: settings.hotkeys,
    portalContainer,
    onToggleGuides: () =>
      setGuidesState((prev) => ({ ...prev, enabled: !prev.enabled })),
    onToggleInspect: () => toggleTool('inspect'),
    onAutoDetect: handleAutoDetect,
    onTogglePickContainer: () => toggleTool('pick-container'),
    onSwitchGuideType: handleTypeChange,
  });

  const handleColumnsChange = useCallback(
    (patch: Partial<LinearGuideSettings>) => {
      setHasCustomSiteSettings(true);
      if (
        'maxSize' in patch ||
        'margin' in patch ||
        'offset' in patch ||
        'alignment' in patch
      ) {
        setTrackedElement(null);
        setTrackedElementLabel(null);
      }
      setGuidesState((prev) => ({
        ...prev,
        columns: { ...prev.columns, ...patch },
      }));
    },
    [],
  );

  const handleRowsChange = useCallback(
    (patch: Partial<LinearGuideSettings>) => {
      setHasCustomSiteSettings(true);
      setGuidesState((prev) => ({
        ...prev,
        rows: { ...prev.rows, ...patch },
      }));
    },
    [],
  );

  const handleGridChange = useCallback((patch: Partial<GridGuideSettings>) => {
    setHasCustomSiteSettings(true);
    setGuidesState((prev) => ({
      ...prev,
      grid: { ...prev.grid, ...patch },
    }));
  }, []);

  const handleReset = useCallback(() => {
    clearSiteCustomState();
    setHasCustomSiteSettings(false);
    const fresh = runAutoDetectOrDefaults(settings);
    setTrackedElement(fresh.trackedElement);
    setTrackedElementLabel(fresh.trackedElementLabel);
    setGuidesState((prev) => ({
      ...fresh.state,
      type: prev.type,
    }));
  }, [settings]);

  const handleUpdateInspectSettings = useCallback(
    (patch: Partial<typeof inspectSettings>) => {
      setInspectSettings((prev) => ({ ...prev, ...patch }));
    },
    [],
  );

  const handleResetInspectSettings = useCallback(() => {
    setInspectSettings(settings.inspect);
  }, [settings.inspect]);

  const isInspectActive = activeTool === 'inspect';
  const isPickingContainer = activeTool === 'pick-container';

  return (
    <CSPProvider disableStyleElements>
      <ThemeProvider defaultTheme={settings.theme} container={portalContainer}>
        <PortalContext.Provider value={portalContainer}>
          <TooltipProvider>
            <div className="fixed inset-0 pointer-events-none select-none text-foreground">
              <LayoutGuidesOverlay state={guidesState} scroll={scroll} />

              {!isPickingContainer && (
                <InspectMeasureOverlay
                  active={isInspectActive}
                  inspectSettings={inspectSettings}
                  onUpdateInspectSettings={handleUpdateInspectSettings}
                  onSnapToElement={(el) =>
                    applyDetectedContainer(extractContainerInfo(el), true)
                  }
                  onCancel={() => setActiveTool('none')}
                />
              )}

              <ContainerPickerOverlay
                active={isPickingContainer}
                onSelect={(info) => {
                  setActiveTool('none');
                  applyDetectedContainer(info, true);
                }}
                onCancel={() => setActiveTool('none')}
              />

              <Dock
                state={guidesState}
                isInspectActive={isInspectActive}
                inspectSettings={inspectSettings}
                defaultInspectSettings={settings.inspect}
                isPickingContainer={isPickingContainer}
                trackedElementLabel={trackedElementLabel}
                hasCustomSiteSettings={hasCustomSiteSettings}
                holdToClose={settings.behavior.holdToClose}
                onToggle={handleToggle}
                onToggleInspect={(active) =>
                  setActiveTool(active ? 'inspect' : 'none')
                }
                onUpdateInspectSettings={handleUpdateInspectSettings}
                onResetInspectSettings={handleResetInspectSettings}
                onTypeChange={handleTypeChange}
                onColumnsChange={handleColumnsChange}
                onRowsChange={handleRowsChange}
                onGridChange={handleGridChange}
                onAutoDetect={handleAutoDetect}
                onTogglePickContainer={() => toggleTool('pick-container')}
                onClearTrackedElement={handleClearTrackedElement}
                onReset={handleReset}
                onClose={onClose}
              />
            </div>
          </TooltipProvider>
        </PortalContext.Provider>
      </ThemeProvider>
    </CSPProvider>
  );
}
