import { Columns3, Grid2X2, Rows3 } from 'lucide-react';
import type {
	GridGuideSettings,
	GuideAlignmentOption,
	GuideTypeOption,
	LayoutGuidesState,
	LinearGuideSettings,
} from '@/types/layout-guides';

export const GUIDE_TYPES: GuideTypeOption[] = [
	{ label: 'Columns', value: 'columns', icon: Columns3 },
	{ label: 'Rows', value: 'rows', icon: Rows3 },
	{ label: 'Grid', value: 'grid', icon: Grid2X2 },
];

export const COLUMN_ALIGNMENTS: GuideAlignmentOption[] = [
	{ label: 'Stretch', value: 'stretch' },
	{ label: 'Left', value: 'start' },
	{ label: 'Right', value: 'end' },
	{ label: 'Center', value: 'center' },
];

export const ROW_ALIGNMENTS: GuideAlignmentOption[] = [
	{ label: 'Stretch', value: 'stretch' },
	{ label: 'Top', value: 'start' },
	{ label: 'Bottom', value: 'end' },
	{ label: 'Center', value: 'center' },
];

export const DEFAULT_COLUMNS_SETTINGS: LinearGuideSettings = {
	count: 12,
	color: '#FF0000',
	opacity: 10,
	alignment: 'stretch',
	itemSize: null,
	margin: 40,
	gutter: 10,
};

export const DEFAULT_ROWS_SETTINGS: LinearGuideSettings = {
	count: 5,
	color: '#FF0000',
	opacity: 10,
	alignment: 'stretch',
	itemSize: null,
	margin: 0,
	gutter: 20,
};

export const DEFAULT_GRID_SETTINGS: GridGuideSettings = {
	size: 10,
	color: '#FF0000',
	opacity: 10,
};

export const DEFAULT_LAYOUT_GUIDES_STATE: LayoutGuidesState = {
	enabled: true,
	type: 'columns',
	columns: DEFAULT_COLUMNS_SETTINGS,
	rows: DEFAULT_ROWS_SETTINGS,
	grid: DEFAULT_GRID_SETTINGS,
};
