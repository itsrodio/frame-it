import { CSPProvider } from '@base-ui/react/csp-provider';
import { useEffect, useState } from 'react';
import { Dock } from '@/components/overlay/dock';
import {
	DEFAULT_COLUMNS_SETTINGS,
	DEFAULT_GRID_SETTINGS,
	DEFAULT_LAYOUT_GUIDES_STATE,
	DEFAULT_ROWS_SETTINGS,
	LAYOUT_GUIDES_STORAGE_KEY,
} from '@/components/overlay/layout-guides/constants';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PortalContext } from '@/lib/portal-context';
import { ThemeProvider } from '@/lib/theme-provider';
import type {
	GridGuideSettings,
	GuideType,
	LayoutGuidesState,
	LinearGuideSettings,
} from '@/types/layout-guides';

function loadLayoutGuidesState(): LayoutGuidesState {
	try {
		const raw = window.localStorage.getItem(LAYOUT_GUIDES_STORAGE_KEY);
		if (!raw) return DEFAULT_LAYOUT_GUIDES_STATE;
		const parsed = JSON.parse(raw) as Partial<LayoutGuidesState>;

		return {
			enabled:
				typeof parsed.enabled === 'boolean'
					? parsed.enabled
					: DEFAULT_LAYOUT_GUIDES_STATE.enabled,
			type:
				parsed.type === 'columns' ||
				parsed.type === 'rows' ||
				parsed.type === 'grid'
					? parsed.type
					: DEFAULT_LAYOUT_GUIDES_STATE.type,
			columns: {
				...DEFAULT_COLUMNS_SETTINGS,
				...parsed.columns,
			},
			rows: {
				...DEFAULT_ROWS_SETTINGS,
				...parsed.rows,
			},
			grid: {
				...DEFAULT_GRID_SETTINGS,
				...parsed.grid,
			},
		};
	} catch {
		return DEFAULT_LAYOUT_GUIDES_STATE;
	}
}

// Конвертация HEX цвета и прозрачности (0–100) в 8-значный CSS HEX
function formatGuideColor(hex: string, opacity: number): string {
	const clean = hex.replace(/^#/, '');
	const validHex = /^[0-9A-F]{6}$/i.test(clean) ? `#${clean}` : '#FF0000';
	const alpha = Math.round((Math.max(0, Math.min(100, opacity)) / 100) * 255)
		.toString(16)
		.padStart(2, '0');
	return `${validHex}${alpha}`;
}

function LayoutGuidesOverlay({ state }: { state: LayoutGuidesState }) {
	if (!state.enabled) return null;

	if (state.type === 'grid') {
		const { size, color: rawColor, opacity } = state.grid;
		const color = formatGuideColor(rawColor, opacity);

		return (
			<div
				className="w-full h-full"
				style={{
					backgroundSize: `${size}px ${size}px`,
					backgroundImage: `
                        linear-gradient(to right, ${color} 1px, transparent 1px),
                        linear-gradient(to bottom, ${color} 1px, transparent 1px)
                    `,
				}}
			/>
		);
	}

	const isColumns = state.type === 'columns';
	const settings = state[state.type];
	const color = formatGuideColor(settings.color, settings.opacity);
	const isStretch = settings.alignment === 'stretch';
	const isCenter = settings.alignment === 'center';
	const trackSize = isStretch
		? 'minmax(0, 1fr)'
		: `${settings.itemSize ?? 64}px`;

	const justifyOrAlign =
		settings.alignment === 'start'
			? 'start'
			: settings.alignment === 'end'
				? 'end'
				: settings.alignment === 'center'
					? 'center'
					: undefined;

	return (
		<div
			className="w-full h-full grid"
			style={{
				padding: isCenter
					? 0
					: isColumns
						? `0 ${settings.margin}px`
						: `${settings.margin}px 0`,
				gap: `${settings.gutter}px`,
				gridTemplateColumns: isColumns
					? `repeat(${settings.count}, ${trackSize})`
					: '1fr',
				gridTemplateRows: !isColumns
					? `repeat(${settings.count}, ${trackSize})`
					: '1fr',
				justifyContent: isColumns ? justifyOrAlign : undefined,
				alignContent: !isColumns ? justifyOrAlign : undefined,
			}}
		>
			{Array.from(
				{ length: settings.count },
				(_, i) => `${state.type}-guide-${i}`,
			).map((guideId) => (
				<div
					key={guideId}
					className="w-full h-full"
					style={{
						backgroundColor: color,
						borderInline: isColumns ? `1px solid ${color}` : undefined,
						borderBlock: !isColumns ? `1px solid ${color}` : undefined,
					}}
				/>
			))}
		</div>
	);
}

interface AppProps {
	portalContainer: HTMLElement;
	onClose: () => void;
}

export function App({ portalContainer, onClose }: AppProps) {
	const [guidesState, setGuidesState] = useState<LayoutGuidesState>(
		loadLayoutGuidesState,
	);

	useEffect(() => {
		try {
			window.localStorage.setItem(
				LAYOUT_GUIDES_STORAGE_KEY,
				JSON.stringify(guidesState),
			);
		} catch {
			// Ignore storage quota or security errors
		}
	}, [guidesState]);

	const handleToggle = (enabled: boolean) => {
		setGuidesState((prev) => ({ ...prev, enabled }));
	};

	const handleTypeChange = (type: GuideType) => {
		setGuidesState((prev) => ({ ...prev, type, enabled: true }));
	};

	const handleColumnsChange = (patch: Partial<LinearGuideSettings>) => {
		setGuidesState((prev) => ({
			...prev,
			columns: { ...prev.columns, ...patch },
		}));
	};

	const handleRowsChange = (patch: Partial<LinearGuideSettings>) => {
		setGuidesState((prev) => ({
			...prev,
			rows: { ...prev.rows, ...patch },
		}));
	};

	const handleGridChange = (patch: Partial<GridGuideSettings>) => {
		setGuidesState((prev) => ({
			...prev,
			grid: { ...prev.grid, ...patch },
		}));
	};

	const handleReset = () => {
		setGuidesState((prev) => {
			if (prev.type === 'columns') {
				return { ...prev, columns: DEFAULT_COLUMNS_SETTINGS };
			}
			if (prev.type === 'rows') {
				return { ...prev, rows: DEFAULT_ROWS_SETTINGS };
			}
			return { ...prev, grid: DEFAULT_GRID_SETTINGS };
		});
	};

	return (
		<CSPProvider disableStyleElements>
			<ThemeProvider defaultTheme="system" container={portalContainer}>
				<PortalContext.Provider value={portalContainer}>
					<TooltipProvider>
						<div className="fixed inset-0 pointer-events-none select-none text-foreground">
							{/* СЛОЙ 1: Сетка (Columns / Rows / Grid) */}
							<LayoutGuidesOverlay state={guidesState} />

							{/* СЛОЙ 2: Единый Dock */}
							<Dock
								state={guidesState}
								onToggle={handleToggle}
								onTypeChange={handleTypeChange}
								onColumnsChange={handleColumnsChange}
								onRowsChange={handleRowsChange}
								onGridChange={handleGridChange}
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
