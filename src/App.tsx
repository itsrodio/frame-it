import { CSPProvider } from '@base-ui/react/csp-provider';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DesignOverlayLayer } from '@/components/overlay/design-overlay/design-overlay-layer';
import { Dock } from '@/components/overlay/dock/dock';
import { InspectMeasureOverlay } from '@/components/overlay/inspect/inspect-measure-overlay';
import { ContainerPickerOverlay } from '@/components/overlay/layout-guides/container-picker-overlay';
import { LayoutGuidesOverlay } from '@/components/overlay/layout-guides/layout-guides-overlay';
import {
  OnboardingTour,
  TOUR_STEPS,
} from '@/components/overlay/tour/onboarding-tour';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useDesignOverlay } from '@/hooks/use-design-overlay';
import { useDesignOverlayInteraction } from '@/hooks/use-design-overlay-interaction';
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

export type ActiveOverlayTool =
  | 'none'
  | 'inspect'
  | 'pick-container'
  | 'pick-design-target';

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
  // Keep ref in sync so the external settings subscription avoids stale closures.
  const hasCustomSiteSettingsRef = useRef(hasCustomSiteSettings);
  hasCustomSiteSettingsRef.current = hasCustomSiteSettings;

  const [activeTool, setActiveTool] = useState<ActiveOverlayTool>('none');
  const [isTourOpen, setIsTourOpen] = useState(
    () => !getCachedSettings().hasCompletedTour,
  );
  const [tourStepIndex, setTourStepIndex] = useState(0);
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
      if (nextSettings.hasCompletedTour) {
        setIsTourOpen(false);
      }
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

  const { settings, persistSettings } = useExtensionSettings({
    onExternalChange: handleExternalSettingsChange,
  });

  const handleStartTour = useCallback(() => {
    setActiveTool('none');
    setTourStepIndex(0);
    setIsTourOpen(true);
  }, []);

  const handleCloseTour = useCallback(() => {
    setIsTourOpen(false);
    persistSettings((prev) =>
      prev.hasCompletedTour ? prev : { ...prev, hasCompletedTour: true },
    );
  }, [persistSettings]);

  const resetActiveTool = useCallback(() => {
    setActiveTool('none');
  }, []);

  const designOverlay = useDesignOverlay({
    lockedByDefault: settings.behavior.designOverlayLockedByDefault,
    onUnlock: resetActiveTool,
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

  const needsGuidesScroll =
    guidesState.enabled && guidesState[guidesState.type].followScroll;
  const needsDesignOverlayScroll =
    designOverlay.state.enabled &&
    Boolean(designOverlay.state.imageUrl) &&
    designOverlay.state.followScroll;
  const scroll = useWindowScroll(needsGuidesScroll || needsDesignOverlayScroll);

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

  useDesignOverlayInteraction({
    portalContainer,
    canNudge:
      designOverlay.state.enabled &&
      Boolean(designOverlay.state.imageUrl) &&
      !designOverlay.state.locked &&
      activeTool === 'none',
    onPasteImage: (file, fileName) => {
      void designOverlay.loadImage(file, fileName).catch(() => {});
    },
    onNudge: designOverlay.nudge,
  });

  useGlobalHotkeys({
    hotkeys: isTourOpen
      ? { ...settings.hotkeys, enabled: false }
      : settings.hotkeys,
    portalContainer,
    onToggleGuides: () =>
      setGuidesState((prev) => ({ ...prev, enabled: !prev.enabled })),
    onToggleInspect: () => toggleTool('inspect'),
    onAutoDetect: handleAutoDetect,
    onTogglePickContainer: () => toggleTool('pick-container'),
    onSwitchGuideType: handleTypeChange,
    onToggleDesignOverlay: designOverlay.toggleShortcut,
    onToggleDesignOverlayLock: designOverlay.toggleLock,
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
  const isPickingDesignTarget = activeTool === 'pick-design-target';

  return (
    <CSPProvider disableStyleElements>
      <ThemeProvider defaultTheme={settings.theme} container={portalContainer}>
        <PortalContext.Provider value={portalContainer}>
          <TooltipProvider>
            <div className="fixed inset-0 pointer-events-none select-none text-foreground">
              <DesignOverlayLayer
                state={designOverlay.state}
                scroll={scroll}
                isInteractiveAllowed={activeTool === 'none'}
                onMove={designOverlay.move}
              />

              <LayoutGuidesOverlay state={guidesState} scroll={scroll} />

              {!isPickingContainer && !isPickingDesignTarget && (
                <InspectMeasureOverlay
                  active={isInspectActive}
                  inspectSettings={inspectSettings}
                  onUpdateInspectSettings={handleUpdateInspectSettings}
                  onSnapToElement={(el) =>
                    applyDetectedContainer(extractContainerInfo(el), true)
                  }
                  onCancel={resetActiveTool}
                />
              )}

              <ContainerPickerOverlay
                active={isPickingContainer || isPickingDesignTarget}
                hintText={
                  isPickingDesignTarget
                    ? i18n.t('designOverlay.picker.snapHint')
                    : undefined
                }
                minWidthThreshold={isPickingDesignTarget ? 24 : 200}
                onSelect={(info) => {
                  setActiveTool('none');
                  if (isPickingDesignTarget) {
                    designOverlay.snapToElement(info);
                  } else {
                    applyDetectedContainer(info, true);
                  }
                }}
                onCancel={resetActiveTool}
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
                hotkeys={settings.hotkeys}
                activeTourStep={
                  isTourOpen ? (TOUR_STEPS[tourStepIndex] ?? null) : null
                }
                onStartTour={handleStartTour}
                designOverlay={{
                  state: designOverlay.state,
                  quotaExceeded: designOverlay.quotaExceeded,
                  isPickingTarget: isPickingDesignTarget,
                  onToggle: designOverlay.toggleEnabled,
                  onPatch: designOverlay.patch,
                  onLoadFile: designOverlay.loadImage,
                  onAutoFit: designOverlay.autoFit,
                  onTogglePickTarget: () => toggleTool('pick-design-target'),
                  onCenterHorizontal: designOverlay.centerHorizontal,
                  onFitToViewportWidth: designOverlay.fitToViewportWidth,
                  onResetPosition: designOverlay.resetPosition,
                  onClear: designOverlay.clear,
                }}
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

              <OnboardingTour
                open={isTourOpen}
                stepIndex={tourStepIndex}
                steps={TOUR_STEPS}
                portalContainer={portalContainer}
                onStepChange={setTourStepIndex}
                onClose={handleCloseTour}
              />
            </div>
          </TooltipProvider>
        </PortalContext.Provider>
      </ThemeProvider>
    </CSPProvider>
  );
}
