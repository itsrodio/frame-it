import { CSPProvider } from '@base-ui/react/csp-provider';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DesignOverlayLayer } from '@/components/overlay/design-overlay/design-overlay-layer';
import { Dock } from '@/components/overlay/dock/dock';
import { InspectMeasureOverlay } from '@/components/overlay/inspect/inspect-measure-overlay';
import { ContainerPickerOverlay } from '@/components/overlay/layout-guides/container-picker-overlay';
import { LayoutGuidesOverlay } from '@/components/overlay/layout-guides/layout-guides-overlay';
import { TooltipProvider } from '@/components/ui/tooltip';
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
  calculateCenteredX,
  calculateFitWidthScale,
  computeSmartDesignPlacement,
  computeSnapToElementPlacement,
  readDesignImageFile,
} from '@/lib/design-overlay-image';
import {
  buildDefaultDesignOverlayState,
  clearSiteDesignOverlay,
  loadSiteDesignOverlay,
  saveSiteDesignOverlay,
} from '@/lib/design-overlay-storage';
import {
  clearSiteCustomState,
  getInitialGuidesSetup,
  runAutoDetectOrDefaults,
  saveSiteCustomState,
} from '@/lib/guides-storage';
import { PortalContext } from '@/lib/portal-context';
import { getCachedSettings } from '@/lib/settings-storage';
import { ThemeProvider } from '@/lib/theme-provider';
import type { DesignOverlayState } from '@/types/design-overlay';
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
  const [designOverlayState, setDesignOverlayState] =
    useState<DesignOverlayState>(() =>
      buildDefaultDesignOverlayState(
        getCachedSettings().behavior.designOverlayLockedByDefault,
      ),
    );
  const [designOverlayLoaded, setDesignOverlayLoaded] = useState(false);
  const [designOverlayQuotaExceeded, setDesignOverlayQuotaExceeded] =
    useState(false);
  const designOverlayTouchedRef = useRef(false);

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
    let cancelled = false;
    loadSiteDesignOverlay(
      getCachedSettings().behavior.designOverlayLockedByDefault,
    ).then((loaded) => {
      if (cancelled) return;
      if (!designOverlayTouchedRef.current) {
        setDesignOverlayState(loaded);
      }
      setDesignOverlayLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!designOverlayLoaded) return;
    void saveSiteDesignOverlay(designOverlayState).then((res) => {
      setDesignOverlayQuotaExceeded(res.quotaExceeded);
    });
  }, [designOverlayLoaded, designOverlayState]);

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
    designOverlayState.enabled &&
    Boolean(designOverlayState.imageUrl) &&
    designOverlayState.followScroll;
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

  const handleLoadDesignImage = useCallback(
    async (file: File | Blob, fileName?: string) => {
      const loaded = await readDesignImageFile(file, fileName);
      designOverlayTouchedRef.current = true;
      const defaultLocked = settings.behavior.designOverlayLockedByDefault;
      if (!defaultLocked) {
        setActiveTool('none');
      }
      const detectedContainer = autoDetectPageContainer();
      setDesignOverlayState((prev) => {
        const hadImage = Boolean(prev.imageUrl);
        const smart = computeSmartDesignPlacement({
          naturalWidth: loaded.naturalWidth,
          naturalHeight: loaded.naturalHeight,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          scrollX: window.scrollX,
          scrollY: window.scrollY,
          followScroll: prev.followScroll,
          containerRect: detectedContainer?.rect ?? null,
        });
        return {
          ...prev,
          enabled: true,
          imageUrl: loaded.imageUrl,
          fileName: loaded.fileName,
          naturalWidth: loaded.naturalWidth,
          naturalHeight: loaded.naturalHeight,
          x: hadImage ? prev.x : smart.x,
          y: hadImage ? prev.y : smart.y,
          scale: hadImage ? prev.scale : smart.scale,
          locked: hadImage ? prev.locked : defaultLocked,
        };
      });
    },
    [settings.behavior.designOverlayLockedByDefault],
  );

  const handlePatchDesignOverlay = useCallback(
    (patch: Partial<DesignOverlayState>) => {
      designOverlayTouchedRef.current = true;
      if (patch.locked === false) {
        setActiveTool('none');
      }
      setDesignOverlayState((prev) => ({ ...prev, ...patch }));
    },
    [],
  );

  const handleToggleDesignOverlay = useCallback((enabled: boolean) => {
    designOverlayTouchedRef.current = true;
    setDesignOverlayState((prev) => ({ ...prev, enabled }));
  }, []);

  const handleToggleDesignOverlayShortcut = useCallback(() => {
    designOverlayTouchedRef.current = true;
    setDesignOverlayState((prev) =>
      prev.imageUrl ? { ...prev, enabled: !prev.enabled } : prev,
    );
  }, []);

  const handleToggleDesignOverlayLock = useCallback(() => {
    designOverlayTouchedRef.current = true;
    setDesignOverlayState((prev) => {
      if (!prev.imageUrl) return prev;
      const nextLocked = !prev.locked;
      if (!nextLocked) {
        setActiveTool('none');
      }
      return { ...prev, locked: nextLocked };
    });
  }, []);

  const handleMoveDesignOverlay = useCallback((x: number, y: number) => {
    designOverlayTouchedRef.current = true;
    setDesignOverlayState((prev) => ({ ...prev, x, y }));
  }, []);

  const handleNudgeDesignOverlay = useCallback((dx: number, dy: number) => {
    designOverlayTouchedRef.current = true;
    setDesignOverlayState((prev) => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy,
    }));
  }, []);

  const handleCenterDesignOverlay = useCallback(() => {
    designOverlayTouchedRef.current = true;
    setDesignOverlayState((prev) => ({
      ...prev,
      x: calculateCenteredX(prev.naturalWidth, prev.scale, window.innerWidth),
    }));
  }, []);

  const handleFitDesignOverlayWidth = useCallback(() => {
    designOverlayTouchedRef.current = true;
    setDesignOverlayState((prev) => ({
      ...prev,
      scale: calculateFitWidthScale(prev.naturalWidth, window.innerWidth),
      x: 0,
    }));
  }, []);

  const handleAutoFitDesignOverlay = useCallback(() => {
    designOverlayTouchedRef.current = true;
    const detectedContainer = autoDetectPageContainer();
    setDesignOverlayState((prev) => {
      if (!prev.imageUrl) return prev;
      const smart = computeSmartDesignPlacement({
        naturalWidth: prev.naturalWidth,
        naturalHeight: prev.naturalHeight,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        followScroll: prev.followScroll,
        containerRect: detectedContainer?.rect ?? null,
      });
      return {
        ...prev,
        x: smart.x,
        y: smart.y,
        scale: smart.scale,
      };
    });
  }, []);

  const handleSnapDesignOverlayToElement = useCallback(
    (info: DetectedContainerInfo) => {
      designOverlayTouchedRef.current = true;
      setDesignOverlayState((prev) => {
        const snapped = computeSnapToElementPlacement({
          naturalWidth: prev.naturalWidth,
          rect: info.rect,
          scrollX: window.scrollX,
          scrollY: window.scrollY,
          followScroll: prev.followScroll,
        });
        return {
          ...prev,
          enabled: true,
          x: snapped.x,
          y: snapped.y,
          scale: snapped.scale,
        };
      });
    },
    [],
  );

  const handleResetDesignOverlayPosition = useCallback(() => {
    designOverlayTouchedRef.current = true;
    setDesignOverlayState((prev) => ({ ...prev, x: 0, y: 0 }));
  }, []);

  const handleClearDesignOverlay = useCallback(() => {
    designOverlayTouchedRef.current = true;
    setDesignOverlayQuotaExceeded(false);
    setDesignOverlayState(
      buildDefaultDesignOverlayState(
        settings.behavior.designOverlayLockedByDefault,
      ),
    );
    void clearSiteDesignOverlay();
  }, [settings.behavior.designOverlayLockedByDefault]);

  useDesignOverlayInteraction({
    portalContainer,
    canNudge:
      designOverlayState.enabled &&
      Boolean(designOverlayState.imageUrl) &&
      !designOverlayState.locked &&
      activeTool === 'none',
    onPasteImage: (file, fileName) => {
      void handleLoadDesignImage(file, fileName).catch(() => {});
    },
    onNudge: handleNudgeDesignOverlay,
  });

  useGlobalHotkeys({
    hotkeys: settings.hotkeys,
    portalContainer,
    onToggleGuides: () =>
      setGuidesState((prev) => ({ ...prev, enabled: !prev.enabled })),
    onToggleInspect: () => toggleTool('inspect'),
    onAutoDetect: handleAutoDetect,
    onTogglePickContainer: () => toggleTool('pick-container'),
    onSwitchGuideType: handleTypeChange,
    onToggleDesignOverlay: handleToggleDesignOverlayShortcut,
    onToggleDesignOverlayLock: handleToggleDesignOverlayLock,
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
                state={designOverlayState}
                scroll={scroll}
                isInteractiveAllowed={activeTool === 'none'}
                onMove={handleMoveDesignOverlay}
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
                  onCancel={() => setActiveTool('none')}
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
                    handleSnapDesignOverlayToElement(info);
                  } else {
                    applyDetectedContainer(info, true);
                  }
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
                designOverlay={{
                  state: designOverlayState,
                  quotaExceeded: designOverlayQuotaExceeded,
                  isPickingTarget: isPickingDesignTarget,
                  onToggle: handleToggleDesignOverlay,
                  onPatch: handlePatchDesignOverlay,
                  onLoadFile: handleLoadDesignImage,
                  onAutoFit: handleAutoFitDesignOverlay,
                  onTogglePickTarget: () => toggleTool('pick-design-target'),
                  onCenterHorizontal: handleCenterDesignOverlay,
                  onFitToViewportWidth: handleFitDesignOverlayWidth,
                  onResetPosition: handleResetDesignOverlayPosition,
                  onClear: handleClearDesignOverlay,
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
            </div>
          </TooltipProvider>
        </PortalContext.Provider>
      </ThemeProvider>
    </CSPProvider>
  );
}
