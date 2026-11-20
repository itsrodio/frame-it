import { CSPProvider } from '@base-ui/react/csp-provider';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ContainerPickerOverlay } from '@/components/overlay/container-picker-overlay';
import { Dock } from '@/components/overlay/dock';
import { InspectMeasureOverlay } from '@/components/overlay/inspect-measure-overlay';
import { LayoutGuidesOverlay } from '@/components/overlay/layout-guides-overlay';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  autoDetectPageContainer,
  containerInfoToColumnsPatch,
  extractContainerInfo,
} from '@/lib/container-detector';
import { isEditableTarget } from '@/lib/dom-utils';
import {
  clearSiteCustomState,
  getInitialGuidesSetup,
  runAutoDetectOrDefaults,
  saveSiteCustomState,
} from '@/lib/guides-storage';
import { matchesHotkey } from '@/lib/hotkeys';
import { PortalContext } from '@/lib/portal-context';
import {
  getCachedSettings,
  loadExtensionSettings,
  subscribeExtensionSettings,
} from '@/lib/settings-storage';
import { ThemeProvider } from '@/lib/theme-provider';
import type {
  DetectedContainerInfo,
  GridGuideSettings,
  GuideType,
  LayoutGuidesState,
  LinearGuideSettings,
} from '@/types/layout-guides';
import type { ExtensionSettings } from '@/types/settings';

interface AppProps {
  portalContainer: HTMLElement;
  onClose: () => void;
}

export function App({ portalContainer, onClose }: AppProps) {
  const [settings, setSettings] =
    useState<ExtensionSettings>(getCachedSettings);
  const [initialSetup] = useState(() => getInitialGuidesSetup(settings));
  const [guidesState, setGuidesState] = useState<LayoutGuidesState>(
    initialSetup.state,
  );
  const [hasCustomSiteSettings, setHasCustomSiteSettings] = useState<boolean>(
    initialSetup.hasCustomSiteSettings,
  );
  const [isInspectActive, setIsInspectActive] = useState(false);
  const [isPickingContainer, setIsPickingContainer] = useState(false);
  const [trackedElement, setTrackedElement] = useState<HTMLElement | null>(
    initialSetup.trackedElement,
  );
  const [trackedElementLabel, setTrackedElementLabel] = useState<string | null>(
    initialSetup.trackedElementLabel,
  );
  const [scroll, setScroll] = useState({ x: 0, y: 0 });
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Подгружаем глобальные настройки расширения из browser.storage.local и подписываемся на изменения
  useEffect(() => {
    let active = true;

    const applySettings = (nextSettings: ExtensionSettings) => {
      if (!active) return;
      if (
        JSON.stringify(settingsRef.current) === JSON.stringify(nextSettings)
      ) {
        return;
      }
      settingsRef.current = nextSettings;
      setSettings(nextSettings);
      setHasCustomSiteSettings((currentHasCustom) => {
        if (!currentHasCustom || !nextSettings.behavior.rememberSiteSettings) {
          const setup = getInitialGuidesSetup(nextSettings);
          setGuidesState(setup.state);
          setTrackedElement(setup.trackedElement);
          setTrackedElementLabel(setup.trackedElementLabel);
          return setup.hasCustomSiteSettings;
        }
        return currentHasCustom;
      });
    };

    void loadExtensionSettings().then(applySettings);
    const unsubscribe = subscribeExtensionSettings(applySettings);

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Сохраняем настройки в localStorage ТОЛЬКО если пользователь сам что-то изменил на этом сайте и включено rememberSiteSettings
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

  // Отслеживание скролла страницы с батчингом через requestAnimationFrame
  useEffect(() => {
    if (!needsScroll) return;

    let rafId: number | null = null;

    const updateScroll = () => {
      rafId = null;
      const nextX = window.scrollX;
      const nextY = window.scrollY;
      setScroll((prev) =>
        prev.x === nextX && prev.y === nextY ? prev : { x: nextX, y: nextY },
      );
    };

    const handleScroll = () => {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(updateScroll);
      }
    };

    updateScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [needsScroll]);

  // Привязка к выбранному DOM-контейнеру при ресайзе окна или самого элемента
  const syncWithTrackedElement = useCallback((el: HTMLElement) => {
    if (!document.body.contains(el)) {
      setTrackedElement(null);
      setTrackedElementLabel(null);
      return;
    }
    const info = extractContainerInfo(el);
    setTrackedElementLabel(info.label);
    setGuidesState((prev) => ({
      ...prev,
      columns: {
        ...prev.columns,
        ...containerInfoToColumnsPatch(info, prev.columns),
      },
    }));
  }, []);

  useEffect(() => {
    if (!trackedElement) return;

    let rafId: number | null = null;
    const handleResize = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        syncWithTrackedElement(trackedElement);
      });
    };

    const observer = new ResizeObserver(handleResize);
    observer.observe(trackedElement);
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [trackedElement, syncWithTrackedElement]);

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

  // Глобальные горячие клавиши (настраиваемые через ExtensionSettings)
  useEffect(() => {
    if (!settings.hotkeys.enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const shadowActive =
        portalContainer.getRootNode() instanceof ShadowRoot
          ? (portalContainer.getRootNode() as ShadowRoot).activeElement
          : null;
      if (isEditableTarget(e.target) || isEditableTarget(shadowActive)) {
        return;
      }

      const { hotkeys } = settings;

      // Shift + G (или кастомный хоткей) или Ctrl + ; (как в Figma) — вкл/выкл направляющие
      if (
        matchesHotkey(e, hotkeys.toggleGuides) ||
        ((e.ctrlKey || e.metaKey) &&
          !e.shiftKey &&
          !e.altKey &&
          e.code === 'Semicolon')
      ) {
        e.preventDefault();
        setGuidesState((prev) => ({ ...prev, enabled: !prev.enabled }));
        return;
      }

      // Режим Inspect & Measure
      if (matchesHotkey(e, hotkeys.toggleInspect)) {
        e.preventDefault();
        setIsPickingContainer(false);
        setIsInspectActive((prev) => !prev);
        return;
      }

      // Автоопределение контейнера
      if (matchesHotkey(e, hotkeys.autoDetect)) {
        e.preventDefault();
        handleAutoDetect();
        return;
      }

      // Выбор контейнера кликом (Pick Container)
      if (matchesHotkey(e, hotkeys.pickContainer)) {
        e.preventDefault();
        setIsInspectActive(false);
        setIsPickingContainer((prev) => !prev);
        return;
      }

      // Быстрое переключение типа сетки (Columns / Rows / Grid)
      if (matchesHotkey(e, hotkeys.switchColumns)) {
        e.preventDefault();
        handleTypeChange('columns');
      } else if (matchesHotkey(e, hotkeys.switchRows)) {
        e.preventDefault();
        handleTypeChange('rows');
      } else if (matchesHotkey(e, hotkeys.switchGrid)) {
        e.preventDefault();
        handleTypeChange('grid');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAutoDetect, handleTypeChange, portalContainer, settings]);

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

  const handleClearTrackedElement = useCallback(() => {
    setTrackedElement(null);
    setTrackedElementLabel(null);
  }, []);

  /**
   * Полный сброс кастомных настроек сайта:
   * очищает сохраненное в localStorage для этого сайта и заново запускает автодетект
   * (или выставляет дефолтные настройки расширения).
   */
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

  return (
    <CSPProvider disableStyleElements>
      <ThemeProvider defaultTheme={settings.theme} container={portalContainer}>
        <PortalContext.Provider value={portalContainer}>
          <TooltipProvider>
            <div className="fixed inset-0 pointer-events-none select-none text-foreground">
              {/* СЛОЙ 1: Сетка (строго один активный тип: Columns, Rows или Grid) */}
              <LayoutGuidesOverlay state={guidesState} scroll={scroll} />

              {/* СЛОЙ 2: Измерение отступов по Alt или в режиме Inspect (как в Figma) */}
              {!isPickingContainer && (
                <InspectMeasureOverlay
                  active={isInspectActive}
                  onSnapToElement={(el) =>
                    applyDetectedContainer(extractContainerInfo(el), true)
                  }
                  onCancel={() => setIsInspectActive(false)}
                />
              )}

              {/* СЛОЙ 3: Интерактивный выбор контейнера для сетки */}
              <ContainerPickerOverlay
                active={isPickingContainer}
                onSelect={(info) => {
                  setIsPickingContainer(false);
                  applyDetectedContainer(info, true);
                }}
                onCancel={() => setIsPickingContainer(false)}
              />

              {/* СЛОЙ 4: Единый Dock */}
              <Dock
                state={guidesState}
                isInspectActive={isInspectActive}
                isPickingContainer={isPickingContainer}
                trackedElementLabel={trackedElementLabel}
                hasCustomSiteSettings={hasCustomSiteSettings}
                holdToClose={settings.behavior.holdToClose}
                onToggle={handleToggle}
                onToggleInspect={(active) => {
                  setIsPickingContainer(false);
                  setIsInspectActive(active);
                }}
                onTypeChange={handleTypeChange}
                onColumnsChange={handleColumnsChange}
                onRowsChange={handleRowsChange}
                onGridChange={handleGridChange}
                onAutoDetect={handleAutoDetect}
                onTogglePickContainer={() => {
                  setIsInspectActive(false);
                  setIsPickingContainer((prev) => !prev);
                }}
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
