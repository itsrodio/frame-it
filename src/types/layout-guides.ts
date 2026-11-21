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
  itemSize: number | null; // Width for columns, height for rows (null = Auto when stretched)
  maxSize: number | null; // Max width for columns container, max height for rows (null = 100% / Auto)
  margin: number; // Inner padding of the guide container (applies to all alignment modes)
  gutter: number;
  offset: number; // Grid offset along X (columns) or Y (rows); may be negative
  followScroll: boolean; // Scroll with the page instead of staying fixed to the viewport
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
