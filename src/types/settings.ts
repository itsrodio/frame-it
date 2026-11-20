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
  | 'switchGrid';

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
}

export interface ExtensionBehaviorSettings {
  autoDetectOnLaunch: boolean;
  guidesEnabledByDefault: boolean;
  defaultGuideType: GuideType;
  rememberSiteSettings: boolean;
  holdToClose: boolean;
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
  hotkeys: ExtensionHotkeys;
  defaultGuides: ExtensionDefaultGuides;
}
