import type { LucideIcon } from 'lucide-react';

export type GuideType = 'columns' | 'rows' | 'grid';
export type GuideAlignment = 'stretch' | 'start' | 'center' | 'end';

export interface BaseGuideSettings {
	color: string;
	opacity: number; // 0–100
}

export interface LinearGuideSettings extends BaseGuideSettings {
	count: number;
	alignment: GuideAlignment;
	itemSize: number | null; // Width для columns, Height для rows (null = Auto при stretch)
	maxSize: number | null; // Max Width для контейнера columns, Max Height для rows (null = 100% / Auto)
	margin: number; // Внутренний padding контейнера сетки (работает во всех режимах, включая center)
	gutter: number;
	offset: number; // Смещение сетки по X (для columns) или Y (для rows), может быть отрицательным
	followScroll: boolean; // Следовать за скроллом страницы (особенно полезно для rows)
}

export interface GridGuideSettings extends BaseGuideSettings {
	size: number;
	offsetX: number;
	offsetY: number;
	followScroll: boolean;
}

export interface LayoutGuidesState {
	enabled: boolean;
	type: GuideType;
	columns: LinearGuideSettings;
	rows: LinearGuideSettings;
	grid: GridGuideSettings;
}

export interface GuideTypeOption {
	label: string;
	value: GuideType;
	icon: LucideIcon;
}

export interface GuideAlignmentOption {
	label: string;
	value: GuideAlignment;
}

export interface MaxSizePreset {
	label: string;
	sublabel: string;
	value: number | null;
}

export interface DetectedContainerInfo {
	element: HTMLElement;
	tagName: string;
	label: string;
	rect: DOMRect;
	maxWidth: number | null;
	paddingInline: number;
	columnCount: number | null;
	columnGap: number | null;
	alignment: GuideAlignment;
	offset: number;
}

export interface LayoutGuidesToolProps {
	state: LayoutGuidesState;
	isInspectActive: boolean;
	isPickingContainer: boolean;
	trackedElementLabel: string | null;
	hasCustomSiteSettings: boolean;
	onToggle: (enabled: boolean) => void;
	onToggleInspect: (active: boolean) => void;
	onTypeChange: (type: GuideType) => void;
	onColumnsChange: (patch: Partial<LinearGuideSettings>) => void;
	onRowsChange: (patch: Partial<LinearGuideSettings>) => void;
	onGridChange: (patch: Partial<GridGuideSettings>) => void;
	onAutoDetect: () => void;
	onTogglePickContainer: () => void;
	onClearTrackedElement: () => void;
	onReset: () => void;
}
