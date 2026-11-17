import { Columns3, Grid2X2, Rows3 } from 'lucide-react';
import type {
  GridGuideSettings,
  GuideAlignmentOption,
  GuideTypeOption,
  LayoutGuidesState,
  LinearGuideSettings,
  MaxSizePreset,
} from '@/types/layout-guides';

export const GUIDE_TYPES: GuideTypeOption[] = [
  { label: 'Columns', value: 'columns', icon: Columns3 },
  { label: 'Rows', value: 'rows', icon: Rows3 },
  { label: 'Grid', value: 'grid', icon: Grid2X2 },
];

export const COLUMN_ALIGNMENTS: GuideAlignmentOption[] = [
  { label: 'Stretch', value: 'stretch' },
  { label: 'Center', value: 'center' },
  { label: 'Left', value: 'start' },
  { label: 'Right', value: 'end' },
];

export const ROW_ALIGNMENTS: GuideAlignmentOption[] = [
  { label: 'Stretch', value: 'stretch' },
  { label: 'Center', value: 'center' },
  { label: 'Top', value: 'start' },
  { label: 'Bottom', value: 'end' },
];

export const MAX_WIDTH_PRESETS: MaxSizePreset[] = [
  { label: 'Auto (100% viewport)', sublabel: 'Full', value: null },
  { label: '768 px', sublabel: 'md', value: 768 },
  { label: '1024 px', sublabel: 'lg', value: 1024 },
  { label: '1140 px', sublabel: 'Bootstrap lg', value: 1140 },
  { label: '1200 px', sublabel: 'Standard', value: 1200 },
  { label: '1280 px', sublabel: 'Tailwind xl', value: 1280 },
  { label: '1320 px', sublabel: 'Bootstrap xxl', value: 1320 },
  { label: '1440 px', sublabel: 'Desktop Figma', value: 1440 },
  { label: '1536 px', sublabel: 'Tailwind 2xl', value: 1536 },
];

export const DEFAULT_COLUMNS_SETTINGS: LinearGuideSettings = {
  count: 12,
  color: '#FF0000',
  opacity: 10,
  alignment: 'stretch',
  itemSize: null,
  maxSize: null,
  margin: 24,
  gutter: 16,
  offset: 0,
  followScroll: false,
};

export const DEFAULT_ROWS_SETTINGS: LinearGuideSettings = {
  count: 5,
  color: '#FF0000',
  opacity: 10,
  alignment: 'stretch',
  itemSize: null,
  maxSize: null,
  margin: 0,
  gutter: 20,
  offset: 0,
  followScroll: true,
};

export const DEFAULT_GRID_SETTINGS: GridGuideSettings = {
  size: 8,
  color: '#FF0000',
  opacity: 20,
  offsetX: 0,
  offsetY: 0,
  followScroll: true,
};

export const LAYOUT_GUIDES_STORAGE_KEY = 'frameit:layout-guides:site-custom';

export const DEFAULT_LAYOUT_GUIDES_STATE: LayoutGuidesState = {
  enabled: true,
  type: 'columns',
  columns: DEFAULT_COLUMNS_SETTINGS,
  rows: DEFAULT_ROWS_SETTINGS,
  grid: DEFAULT_GRID_SETTINGS,
};
