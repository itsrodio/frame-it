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
	margin: number;
	gutter: number;
}

export interface GridGuideSettings extends BaseGuideSettings {
	size: number;
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

export interface LayoutGuidesToolProps {
	state: LayoutGuidesState;
	onToggle: (enabled: boolean) => void;
	onTypeChange: (type: GuideType) => void;
	onColumnsChange: (patch: Partial<LinearGuideSettings>) => void;
	onRowsChange: (patch: Partial<LinearGuideSettings>) => void;
	onGridChange: (patch: Partial<GridGuideSettings>) => void;
}
