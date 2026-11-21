export interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface FormattedColor {
  rgba: RgbaColor;
  hex: string;
  rgb: string;
}

export type WcagContrastLevel = 'AAA' | 'AA' | 'Fail';

export interface ContrastInfo {
  ratio: number;
  formattedRatio: string;
  level: WcagContrastLevel;
  label: string;
}

export interface InspectedTypography {
  fontFamily: string;
  fontStack: string;
  fontSize: string;
  lineHeight: string;
  fontWeight: string;
}

export interface InspectedLayout {
  display: string;
  gap: string | null;
  padding: string;
  margin: string;
  borderRadius: string;
}

export interface InspectedColors {
  text: FormattedColor;
  background: FormattedColor;
  isInheritedBackground: boolean;
  contrast: ContrastInfo;
}

export interface InspectedElementStyles {
  width: number;
  height: number;
  typography: InspectedTypography;
  colors: InspectedColors;
  layout: InspectedLayout;
}

const DEFAULT_WHITE: RgbaColor = { r: 255, g: 255, b: 255, a: 1 };
const DEFAULT_BLACK: RgbaColor = { r: 0, g: 0, b: 0, a: 1 };

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function clampAlpha(a: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(a) ? a : 1));
}

function linearToSrgbByte(c: number): number {
  const clamped = Math.max(0, Math.min(1, c));
  const encoded =
    clamped <= 0.0031308
      ? 12.92 * clamped
      : 1.055 * clamped ** (1 / 2.4) - 0.055;
  return clampByte(encoded * 255);
}

function oklabToRgba(
  L: number,
  a: number,
  b: number,
  alpha: number,
): RgbaColor {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const rLin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  return {
    r: linearToSrgbByte(rLin),
    g: linearToSrgbByte(gLin),
    b: linearToSrgbByte(bLin),
    a: clampAlpha(alpha),
  };
}

function parseHueAngleDegrees(raw: string): number {
  if (raw === 'none') return 0;
  if (raw.endsWith('turn')) return Number.parseFloat(raw) * 360;
  if (raw.endsWith('rad')) return (Number.parseFloat(raw) * 180) / Math.PI;
  if (raw.endsWith('grad')) return Number.parseFloat(raw) * 0.9;
  return Number.parseFloat(raw);
}

function parseAlphaToken(raw: string | undefined): number {
  if (raw === undefined || raw === 'none') return 1;
  const val = raw.endsWith('%')
    ? Number.parseFloat(raw) / 100
    : Number.parseFloat(raw);
  return Number.isNaN(val) ? 1 : clampAlpha(val);
}

/**
 * Парсит CSS-строку цвета (`rgb(...)`, `rgba(...)`, `oklch(...)`, `oklab(...)`, `#rgb`, `#rrggbb`, `#rrggbbaa`).
 * Возвращает `null` для `transparent` или полностью прозрачного цвета (`a === 0`).
 */
export function parseCssColor(
  raw: string | null | undefined,
): RgbaColor | null {
  if (!raw) return null;
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed || trimmed === 'transparent' || trimmed === 'none') {
    return null;
  }

  if (trimmed.startsWith('#')) {
    const hex = trimmed.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      const c0 = hex.slice(0, 1);
      const c1 = hex.slice(1, 2);
      const c2 = hex.slice(2, 3);
      const c3 = hex.slice(3, 4);
      const r = Number.parseInt(c0 + c0, 16);
      const g = Number.parseInt(c1 + c1, 16);
      const b = Number.parseInt(c2 + c2, 16);
      const a = hex.length === 4 ? Number.parseInt(c3 + c3, 16) / 255 : 1;
      if ([r, g, b, a].some(Number.isNaN) || a === 0) return null;
      return { r, g, b, a: clampAlpha(a) };
    }
    if (hex.length === 6 || hex.length === 8) {
      const r = Number.parseInt(hex.slice(0, 2), 16);
      const g = Number.parseInt(hex.slice(2, 4), 16);
      const b = Number.parseInt(hex.slice(4, 6), 16);
      const a =
        hex.length === 8 ? Number.parseInt(hex.slice(6, 8), 16) / 255 : 1;
      if ([r, g, b, a].some(Number.isNaN) || a === 0) return null;
      return { r, g, b, a: clampAlpha(a) };
    }
    return null;
  }

  // Поддержка современных цветов Tailwind v4: oklch(L C H [/ A]) и oklab(L a b [/ A])
  const okMatch = trimmed.match(/^(oklch|oklab)\((.+)\)$/);
  if (okMatch?.[1] && okMatch[2]) {
    const mode = okMatch[1];
    const parts = okMatch[2]
      .trim()
      .replace('/', ' ')
      .split(/[\s,]+/)
      .filter(Boolean);
    if (parts.length < 3) return null;

    const lRaw = parts[0] ?? '0';
    const L = lRaw.endsWith('%')
      ? Number.parseFloat(lRaw) / 100
      : Number.parseFloat(lRaw);
    if (Number.isNaN(L)) return null;

    const alpha = parseAlphaToken(parts[3]);
    if (alpha === 0) return null;

    if (mode === 'oklch') {
      const cRaw = parts[1] ?? '0';
      const C =
        cRaw === 'none'
          ? 0
          : cRaw.endsWith('%')
            ? (Number.parseFloat(cRaw) / 100) * 0.4
            : Number.parseFloat(cRaw);
      const H = parseHueAngleDegrees(parts[2] ?? '0');
      if (Number.isNaN(C) || Number.isNaN(H)) return null;
      const rad = (H * Math.PI) / 180;
      return oklabToRgba(L, C * Math.cos(rad), C * Math.sin(rad), alpha);
    }

    const aVal = Number.parseFloat(parts[1] ?? '0');
    const bVal = Number.parseFloat(parts[2] ?? '0');
    if (Number.isNaN(aVal) || Number.isNaN(bVal)) return null;
    return oklabToRgba(L, aVal, bVal, alpha);
  }

  // Поддержка color(srgb r g b [/ a])
  const srgbFuncMatch = trimmed.match(/^color\(srgb\s+(.+)\)$/);
  if (srgbFuncMatch?.[1]) {
    const parts = srgbFuncMatch[1]
      .trim()
      .replace('/', ' ')
      .split(/[\s,]+/)
      .filter(Boolean);
    if (parts.length < 3) return null;
    const r = Number.parseFloat(parts[0] ?? '');
    const g = Number.parseFloat(parts[1] ?? '');
    const b = Number.parseFloat(parts[2] ?? '');
    if ([r, g, b].some(Number.isNaN)) return null;
    const a = parseAlphaToken(parts[3]);
    if (a === 0) return null;
    return {
      r: clampByte(r * 255),
      g: clampByte(g * 255),
      b: clampByte(b * 255),
      a,
    };
  }

  const rgbMatch = trimmed.match(/^rgba?\((.+)\)$/);
  if (!rgbMatch?.[1]) return null;

  const inner = rgbMatch[1].trim();
  const parts = inner
    .replace('/', ' ')
    .split(/[\s,]+/)
    .filter(Boolean);

  if (parts.length < 3) return null;

  const r = Number.parseFloat(parts[0] ?? '');
  const g = Number.parseFloat(parts[1] ?? '');
  const b = Number.parseFloat(parts[2] ?? '');
  if ([r, g, b].some(Number.isNaN)) return null;

  const clampedA = parseAlphaToken(parts[3]);
  if (clampedA === 0) return null;

  return {
    r: clampByte(r),
    g: clampByte(g),
    b: clampByte(b),
    a: clampedA,
  };
}

export function rgbaToHex(color: RgbaColor): string {
  const toHex = (n: number) =>
    clampByte(n).toString(16).padStart(2, '0').toUpperCase();
  const base = `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
  if (color.a < 1) {
    return `${base}${toHex(Math.round(color.a * 255))}`;
  }
  return base;
}

export function rgbaToRgbString(color: RgbaColor): string {
  const r = clampByte(color.r);
  const g = clampByte(color.g);
  const b = clampByte(color.b);
  if (color.a < 1) {
    const roundedA = Math.round(color.a * 100) / 100;
    return `rgba(${r}, ${g}, ${b}, ${roundedA})`;
  }
  return `rgb(${r}, ${g}, ${b})`;
}

export function formatColor(rgba: RgbaColor): FormattedColor {
  return {
    rgba,
    hex: rgbaToHex(rgba),
    rgb: rgbaToRgbString(rgba),
  };
}

/**
 * Наложение полупрозрачного цвета `fg` поверх `bg` (alpha compositing).
 */
export function blendColors(fg: RgbaColor, bg: RgbaColor): RgbaColor {
  if (fg.a >= 1) return { ...fg, a: 1 };
  const outA = fg.a + bg.a * (1 - fg.a);
  if (outA <= 0) return DEFAULT_WHITE;

  return {
    r: clampByte((fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / outA),
    g: clampByte((fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / outA),
    b: clampByte((fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / outA),
    a: clampAlpha(outA),
  };
}

/**
 * Определяет эффективный цвет фона элемента, поднимаясь вверх по DOM-дереву,
 * если у самого элемента фон `transparent` или полупрозрачный.
 */
export function resolveEffectiveBackgroundColor(el: HTMLElement): {
  color: FormattedColor;
  isInherited: boolean;
} {
  const layers: RgbaColor[] = [];
  let current: HTMLElement | null = el;
  let ownHasBg = false;

  while (current) {
    const style = window.getComputedStyle(current);
    const parsed = parseCssColor(style.backgroundColor);
    if (parsed) {
      if (current === el) {
        ownHasBg = true;
      }
      layers.push(parsed);
      if (parsed.a >= 1) {
        break;
      }
    }
    current = current.parentElement;
  }

  let composite: RgbaColor = DEFAULT_WHITE;
  for (let i = layers.length - 1; i >= 0; i--) {
    const layer = layers[i];
    if (layer) {
      composite = blendColors(layer, composite);
    }
  }

  return {
    color: formatColor(composite),
    isInherited: !ownHasBg,
  };
}

function channelToLinear(value: number): number {
  const srgb = clampByte(value) / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

export function getRelativeLuminance(color: RgbaColor): number {
  const r = channelToLinear(color.r);
  const g = channelToLinear(color.g);
  const b = channelToLinear(color.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Вычисляет коэффициент контрастности по формуле WCAG 2.1 (от 1 до 21).
 */
export function calculateContrastRatio(fg: RgbaColor, bg: RgbaColor): number {
  const effectiveBg = bg.a < 1 ? blendColors(bg, DEFAULT_WHITE) : bg;
  const effectiveFg = fg.a < 1 ? blendColors(fg, effectiveBg) : fg;

  const lum1 = getRelativeLuminance(effectiveFg);
  const lum2 = getRelativeLuminance(effectiveBg);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
}

export function evaluateWcagContrast(
  fg: RgbaColor,
  bg: RgbaColor,
): ContrastInfo {
  const rawRatio = calculateContrastRatio(fg, bg);
  const rounded = Math.round(rawRatio * 10) / 10;
  const formattedRatio = `${rounded.toFixed(1)}:1`;
  const level: WcagContrastLevel =
    rawRatio >= 7 ? 'AAA' : rawRatio >= 4.5 ? 'AA' : 'Fail';

  return {
    ratio: rounded,
    formattedRatio,
    level,
    label: `${formattedRatio} ${level}`,
  };
}

const GENERIC_OR_EMOJI_FONTS = new Set([
  'ui-sans-serif',
  'ui-serif',
  'ui-monospace',
  'ui-rounded',
  'system-ui',
  '-apple-system',
  'blinkmacsystemfont',
  'sans-serif',
  'serif',
  'monospace',
  'cursive',
  'fantasy',
  'math',
  'emoji',
  'fangsong',
  'apple color emoji',
  'segoe ui emoji',
  'segoe ui symbol',
  'noto color emoji',
]);

/**
 * Извлекает отображаемое имя шрифта из CSS `font-family`.
 * Если в начале стека стоят системные фолбэки (`ui-sans-serif`, `system-ui`),
 * но в стеке есть кастомный шрифт (например, после системных), возвращает кастомный шрифт,
 * иначе возвращает первый шрифт из стека.
 */
export function cleanFontFamily(rawFontFamily: string): string {
  if (!rawFontFamily) return 'sans-serif';
  const fonts = rawFontFamily
    .split(',')
    .map((f) => f.trim().replace(/^['"]+|['"]+$/g, ''))
    .filter(Boolean);

  if (fonts.length === 0) return 'sans-serif';

  const firstNamedFont = fonts.find(
    (f) => !GENERIC_OR_EMOJI_FONTS.has(f.toLowerCase()),
  );

  return firstNamedFont ?? fonts[0] ?? 'sans-serif';
}

export function formatBoxShorthand(
  topRaw: string,
  rightRaw: string,
  bottomRaw: string,
  leftRaw: string,
): string {
  const norm = (val: string) => {
    const n = Math.round(Number.parseFloat(val) || 0);
    return `${n}px`;
  };

  const t = norm(topRaw);
  const r = norm(rightRaw);
  const b = norm(bottomRaw);
  const l = norm(leftRaw);

  if (t === r && r === b && b === l) return t;
  if (t === b && r === l) return `${t} ${r}`;
  if (r === l) return `${t} ${r} ${b}`;
  return `${t} ${r} ${b} ${l}`;
}

function extractGap(style: CSSStyleDeclaration): string | null {
  const rawGap = style.gap?.trim();
  if (
    rawGap &&
    rawGap !== 'normal' &&
    rawGap !== '0px' &&
    rawGap !== '0px 0px'
  ) {
    return rawGap;
  }
  const rowGap = Number.parseFloat(style.rowGap) || 0;
  const colGap = Number.parseFloat(style.columnGap) || 0;
  if (rowGap === 0 && colGap === 0) return null;
  if (rowGap === colGap) return `${Math.round(rowGap)}px`;
  return `${Math.round(rowGap)}px ${Math.round(colGap)}px`;
}

export function extractInspectedStyles(
  el: HTMLElement,
  precomputedRect?: DOMRect,
): InspectedElementStyles {
  const rect = precomputedRect ?? el.getBoundingClientRect();
  const style = window.getComputedStyle(el);

  const bgInfo = resolveEffectiveBackgroundColor(el);
  const rawTextRgba = parseCssColor(style.color) ?? DEFAULT_BLACK;
  const blendedTextRgba =
    rawTextRgba.a < 1
      ? blendColors(rawTextRgba, bgInfo.color.rgba)
      : rawTextRgba;
  const textColor = formatColor(rawTextRgba);
  const contrast = evaluateWcagContrast(blendedTextRgba, bgInfo.color.rgba);

  const fontSizeNum = Number.parseFloat(style.fontSize);
  const fontSize = Number.isFinite(fontSizeNum)
    ? `${Math.round(fontSizeNum * 10) / 10}px`
    : style.fontSize || '16px';

  const lineHeightNum = Number.parseFloat(style.lineHeight);
  const lineHeight = Number.isFinite(lineHeightNum)
    ? `${Math.round(lineHeightNum * 10) / 10}px`
    : style.lineHeight || 'normal';

  const borderRadiusRaw = style.borderRadius?.trim();
  const borderRadius =
    borderRadiusRaw && borderRadiusRaw !== '' ? borderRadiusRaw : '0px';

  return {
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    typography: {
      fontFamily: cleanFontFamily(style.fontFamily),
      fontStack: style.fontFamily || 'sans-serif',
      fontSize,
      lineHeight,
      fontWeight: style.fontWeight || '400',
    },
    colors: {
      text: textColor,
      background: bgInfo.color,
      isInheritedBackground: bgInfo.isInherited,
      contrast,
    },
    layout: {
      display: style.display || 'block',
      gap: extractGap(style),
      padding: formatBoxShorthand(
        style.paddingTop,
        style.paddingRight,
        style.paddingBottom,
        style.paddingLeft,
      ),
      margin: formatBoxShorthand(
        style.marginTop,
        style.marginRight,
        style.marginBottom,
        style.marginLeft,
      ),
      borderRadius,
    },
  };
}

export function buildInspectedCssSnippet(
  styles: InspectedElementStyles,
): string {
  const lines: string[] = [
    `width: ${styles.width}px;`,
    `height: ${styles.height}px;`,
    `display: ${styles.layout.display};`,
  ];

  if (styles.layout.gap) {
    lines.push(`gap: ${styles.layout.gap};`);
  }
  if (styles.layout.padding !== '0px') {
    lines.push(`padding: ${styles.layout.padding};`);
  }
  if (styles.layout.margin !== '0px') {
    lines.push(`margin: ${styles.layout.margin};`);
  }
  if (styles.layout.borderRadius !== '0px') {
    lines.push(`border-radius: ${styles.layout.borderRadius};`);
  }

  lines.push(
    `font-family: ${styles.typography.fontFamily};`,
    `font-size: ${styles.typography.fontSize};`,
    `line-height: ${styles.typography.lineHeight};`,
    `font-weight: ${styles.typography.fontWeight};`,
    `color: ${styles.colors.text.hex};`,
    `background-color: ${styles.colors.background.hex};`,
  );

  return lines.join('\n');
}
