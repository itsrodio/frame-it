import { CSPProvider } from '@base-ui/react/csp-provider';
import { useCallback, useEffect, useState } from 'react';
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
import { PortalContext } from '@/lib/portal-context';
import { ThemeProvider } from '@/lib/theme-provider';
import type {
	DetectedContainerInfo,
	GridGuideSettings,
	GuideType,
	LayoutGuidesState,
	LinearGuideSettings,
} from '@/types/layout-guides';

interface AppProps {
	portalContainer: HTMLElement;
	onClose: () => void;
}

export function App({ portalContainer, onClose }: AppProps) {
	const [initialSetup] = useState(getInitialGuidesSetup);
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

	// Сохраняем настройки в localStorage ТОЛЬКО если пользователь сам что-то изменил на этом сайте
	useEffect(() => {
		if (!hasCustomSiteSettings) return;
		saveSiteCustomState(guidesState);
	}, [guidesState, hasCustomSiteSettings]);

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

	// Глобальные горячие клавиши (Shift+G, Shift+I, Shift+A, Shift+C, Shift+1/2/3)
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const shadowActive =
				portalContainer.getRootNode() instanceof ShadowRoot
					? (portalContainer.getRootNode() as ShadowRoot).activeElement
					: null;
			if (isEditableTarget(e.target) || isEditableTarget(shadowActive)) {
				return;
			}

			// Shift + G (как в Figma) или Ctrl + ; — вкл/выкл направляющие
			if (
				(e.shiftKey && !e.ctrlKey && !e.metaKey && e.code === 'KeyG') ||
				((e.ctrlKey || e.metaKey) && e.code === 'Semicolon')
			) {
				e.preventDefault();
				setGuidesState((prev) => ({ ...prev, enabled: !prev.enabled }));
				return;
			}

			// Shift + I — режим Inspect & Measure
			if (e.shiftKey && !e.ctrlKey && !e.metaKey && e.code === 'KeyI') {
				e.preventDefault();
				setIsPickingContainer(false);
				setIsInspectActive((prev) => !prev);
				return;
			}

			// Shift + A — автоопределение контейнера
			if (e.shiftKey && !e.ctrlKey && !e.metaKey && e.code === 'KeyA') {
				e.preventDefault();
				handleAutoDetect();
				return;
			}

			// Shift + C — выбор контейнера кликом (Pick Container)
			if (e.shiftKey && !e.ctrlKey && !e.metaKey && e.code === 'KeyC') {
				e.preventDefault();
				setIsInspectActive(false);
				setIsPickingContainer((prev) => !prev);
				return;
			}

			// Shift + 1 / 2 / 3 — быстрое переключение типа сетки (Columns / Rows / Grid)
			if (e.shiftKey && !e.ctrlKey && !e.metaKey) {
				if (e.code === 'Digit1') {
					e.preventDefault();
					handleTypeChange('columns');
				} else if (e.code === 'Digit2') {
					e.preventDefault();
					handleTypeChange('rows');
				} else if (e.code === 'Digit3') {
					e.preventDefault();
					handleTypeChange('grid');
				}
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [handleAutoDetect, handleTypeChange, portalContainer]);

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
	 * (или выставляет дефолтные настройки, если контейнер не найден).
	 */
	const handleReset = useCallback(() => {
		clearSiteCustomState();
		setHasCustomSiteSettings(false);
		const fresh = runAutoDetectOrDefaults();
		setTrackedElement(fresh.trackedElement);
		setTrackedElementLabel(fresh.trackedElementLabel);
		setGuidesState((prev) => ({
			...fresh.state,
			type: prev.type,
		}));
	}, []);

	return (
		<CSPProvider disableStyleElements>
			<ThemeProvider defaultTheme="system" container={portalContainer}>
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
