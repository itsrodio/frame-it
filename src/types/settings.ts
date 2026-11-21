import type { Theme } from '@/lib/theme-provider';
import type {
  GridGuideSettings,
  GuideType,
  LinearGuideSettings,
} from '@/types/layout-guides';

export type SupportedLocale =
  | 'en'
  | 'es'
  | 'zh_CN'
  | 'pt_BR'
  | 'de'
  | 'fr'
  | 'ru'
  | 'ja'
  | 'ko';

export type ExtensionLanguage = 'auto' | SupportedLocale;

export type HotkeyAction =
  | 'toggleGuides'
  | 'toggleInspect'
  | 'autoDetect'
  | 'pickContainer'
  | 'switchColumns'
  | 'switchRows'
  | 'switchGrid'
  | 'toggleDesignOverlay'
  | 'toggleDesignOverlayLock';

export interface HotkeyBinding {
  code: string;
  shift: boolean;
  ctrlOrMeta: boolean;
  alt: boolean;
}

export interface ExtensionHotkeys {
  enabled: boolean;
  toggleGuides: HotkeyBinding;
  toggleInspect: HotkeyBinding;
  autoDetect: HotkeyBinding;
  pickContainer: HotkeyBinding;
  switchColumns: HotkeyBinding;
  switchRows: HotkeyBinding;
  switchGrid: HotkeyBinding;
  toggleDesignOverlay: HotkeyBinding;
  toggleDesignOverlayLock: HotkeyBinding;
}

export interface ExtensionBehaviorSettings {
  autoDetectOnLaunch: boolean;
  guidesEnabledByDefault: boolean;
  defaultGuideType: GuideType;
  rememberSiteSettings: boolean;
  holdToClose: boolean;
  designOverlayLockedByDefault: boolean;
}

export type InspectCodeFormat = 'css' | 'tailwind' | 'jsx';
export type InspectColorFormat = 'hex' | 'rgb' | 'oklch';
export type InspectUnitFormat = 'px' | 'rem' | 'both';
export type InspectCardPlacement = 'floating' | 'pinned';

export interface ExtensionInspectSettings {
  codeFormat: InspectCodeFormat;
  colorFormat: InspectColorFormat;
  unitFormat: InspectUnitFormat;
  cardPlacement: InspectCardPlacement;
  showPadding: boolean;
  showMargin: boolean;
  showGap: boolean;
}

export interface ExtensionDefaultGuides {
  columns: LinearGuideSettings;
  rows: LinearGuideSettings;
  grid: GridGuideSettings;
}

export interface ExtensionSettings {
  language: ExtensionLanguage;
  theme: Theme;
  behavior: ExtensionBehaviorSettings;
  inspect: ExtensionInspectSettings;
  hotkeys: ExtensionHotkeys;
  defaultGuides: ExtensionDefaultGuides;
}
