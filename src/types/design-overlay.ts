export type DesignOverlayBlendMode = 'normal' | 'difference';

export interface DesignOverlayState {
  enabled: boolean;
  imageUrl: string | null;
  fileName: string | null;
  naturalWidth: number;
  naturalHeight: number;
  x: number;
  y: number;
  scale: number;
  opacity: number; // 0-100
  blendMode: DesignOverlayBlendMode;
  locked: boolean; // true => pointer-events: none (click-through)
  followScroll: boolean;
}

export interface DesignOverlayToolProps {
  state: DesignOverlayState;
  quotaExceeded: boolean;
  isPickingTarget: boolean;
  onToggle: (enabled: boolean) => void;
  onPatch: (patch: Partial<DesignOverlayState>) => void;
  onLoadFile: (file: File | Blob, fileName?: string) => Promise<void>;
  onAutoFit: () => void;
  onTogglePickTarget: () => void;
  onCenterHorizontal: () => void;
  onFitToViewportWidth: () => void;
  onResetPosition: () => void;
  onClear: () => void;
}
