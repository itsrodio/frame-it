import { afterEach, describe, expect, it } from 'vitest';
import {
  blendColors,
  buildInspectedCssSnippet,
  calculateContrastRatio,
  cleanFontFamily,
  evaluateWcagContrast,
  extractInspectedStyles,
  formatBoxShorthand,
  parseCssColor,
  resolveEffectiveBackgroundColor,
  rgbaToHex,
  rgbaToRgbString,
} from '@/lib/inspect-styles';

describe('inspect-styles & WCAG 2.1 contrast', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('parses CSS color formats (hex, rgb, rgba, modern space/slash) and ignores transparent', () => {
    expect(parseCssColor('transparent')).toBeNull();
    expect(parseCssColor('rgba(0, 0, 0, 0)')).toBeNull();

    const hex = parseCssColor('#112233');
    expect(hex).toEqual({ r: 17, g: 34, b: 51, a: 1 });
    if (hex) {
      expect(rgbaToHex(hex)).toBe('#112233');
      expect(rgbaToRgbString(hex)).toBe('rgb(17, 34, 51)');
    }

    const modern = parseCssColor('rgb(255 0 128 / 50%)');
    expect(modern).toEqual({ r: 255, g: 0, b: 128, a: 0.5 });
    if (modern) {
      expect(rgbaToHex(modern)).toBe('#FF008080');
      expect(rgbaToRgbString(modern)).toBe('rgba(255, 0, 128, 0.5)');
    }

    // Tailwind v4 oklch(...) color format (neutral-300 -> #D4D4D4)
    const oklchText = parseCssColor('oklch(0.87 0 0)');
    expect(oklchText).toEqual({ r: 212, g: 212, b: 212, a: 1 });
    if (oklchText) {
      expect(rgbaToHex(oklchText)).toBe('#D4D4D4');
      expect(rgbaToRgbString(oklchText)).toBe('rgb(212, 212, 212)');
    }

    // Short 3-char & 4-char hex, 8-char hex, oklab, color(srgb), and angle units
    expect(parseCssColor('#f0a')).toEqual({ r: 255, g: 0, b: 170, a: 1 });
    expect(parseCssColor('#f0a0')).toBeNull();
    expect(parseCssColor('#11223380')?.r).toBe(17);
    expect(parseCssColor('oklch(87% 50% 0.5turn / 80%)')?.a).toBe(0.8);
    expect(parseCssColor('oklch(0.5 none 1.5rad)')?.a).toBe(1);
    expect(parseCssColor('oklch(0.5 0.1 200grad)')?.a).toBe(1);
    expect(parseCssColor('oklab(0.6 0.1 -0.1 / 50%)')?.a).toBe(0.5);
    expect(parseCssColor('color(srgb 1 0.5 0 / 0.25)')).toEqual({
      r: 255,
      g: 128,
      b: 0,
      a: 0.25,
    });
    expect(parseCssColor('hsl(120 100% 50%)')).toEqual({
      r: 0,
      g: 255,
      b: 0,
      a: 1,
    });
    expect(parseCssColor('hsla(240, 100%, 50%, 0.5)')).toEqual({
      r: 0,
      g: 0,
      b: 255,
      a: 0.5,
    });
    expect(parseCssColor('rgb(100% 50% 0%)')).toEqual({
      r: 255,
      g: 128,
      b: 0,
      a: 1,
    });
  });

  it('calculates WCAG 2.1 contrast ratios and levels (AAA, AA, Fail)', () => {
    const black = { r: 0, g: 0, b: 0, a: 1 };
    const white = { r: 255, g: 255, b: 255, a: 1 };
    expect(Math.round(calculateContrastRatio(black, white))).toBe(21);
    expect(evaluateWcagContrast(black, white)).toEqual({
      ratio: 21,
      formattedRatio: '21.0:1',
      level: 'AAA',
      label: '21.0:1 AAA',
    });

    // Mid-gray #767676 on #FFFFFF is ~4.54:1 -> AA
    const grayAA = parseCssColor('#767676') ?? black;
    const contrastAA = evaluateWcagContrast(grayAA, white);
    expect(contrastAA.level).toBe('AA');
    expect(contrastAA.ratio).toBeGreaterThanOrEqual(4.5);

    // Light gray #949494 on #FFFFFF is ~3.03:1 -> Fail
    const lightGray = parseCssColor('#949494') ?? black;
    const contrastFail = evaluateWcagContrast(lightGray, white);
    expect(contrastFail.level).toBe('Fail');
    expect(contrastFail.label).toContain('Fail');
  });

  it('walks up the DOM tree to resolve effective background color when element background is transparent', () => {
    const section = document.createElement('section');
    section.style.backgroundColor = 'rgb(15, 23, 42)'; // #0F172A
    const card = document.createElement('div');
    card.style.backgroundColor = 'transparent';
    const text = document.createElement('p');
    text.style.backgroundColor = 'transparent';
    text.style.color = 'rgb(248, 250, 252)'; // #F8FAFC
    text.style.fontFamily = '"Inter", system-ui, sans-serif';
    text.style.fontSize = '18px';
    text.style.lineHeight = '28px';
    text.style.fontWeight = '600';
    text.style.display = 'flex';
    text.style.gap = '12px';
    text.style.padding = '8px 16px';
    text.style.borderRadius = '6px';

    card.appendChild(text);
    section.appendChild(card);
    document.body.appendChild(section);

    const resolvedBg = resolveEffectiveBackgroundColor(text);
    expect(resolvedBg.isInherited).toBe(true);
    expect(resolvedBg.color.hex).toBe('#0F172A');
    expect(resolvedBg.color.rgb).toBe('rgb(15, 23, 42)');

    const styles = extractInspectedStyles(text, {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      width: 240,
      height: 48,
      right: 240,
      bottom: 48,
      toJSON: () => ({}),
    });

    expect(styles.typography.fontFamily).toBe('Inter');
    expect(styles.typography.fontSize).toBe('18px');
    expect(styles.typography.lineHeight).toBe('28px');
    expect(styles.typography.fontWeight).toBe('600');
    expect(styles.colors.text.hex).toBe('#F8FAFC');
    expect(styles.colors.background.hex).toBe('#0F172A');
    expect(styles.colors.contrast.level).toBe('AAA');
    expect(styles.layout.display).toBe('flex');
    expect(styles.layout.gap).toBe('12px');
    expect(styles.layout.padding).toBe('8px 16px');
    expect(styles.layout.borderRadius).toBe('6px');

    const snippet = buildInspectedCssSnippet(styles);
    expect(snippet).toContain('font-family: Inter;');
    expect(snippet).toContain('color: #F8FAFC;');
    expect(snippet).toContain('background-color: #0F172A;');
    expect(snippet).toContain('gap: 12px;');
  });

  it('blends semi-transparent colours and formats CSS box shorthands', () => {
    const blended = blendColors(
      { r: 0, g: 0, b: 0, a: 0.5 },
      { r: 255, g: 255, b: 255, a: 1 },
    );
    expect(blended).toEqual({ r: 128, g: 128, b: 128, a: 1 });

    expect(formatBoxShorthand('16px', '16px', '16px', '16px')).toBe('16px');
    expect(formatBoxShorthand('12px', '24px', '12px', '24px')).toBe(
      '12px 24px',
    );
    expect(formatBoxShorthand('8px', '16px', '24px', '16px')).toBe(
      '8px 16px 24px',
    );
    expect(formatBoxShorthand('4px', '8px', '12px', '16px')).toBe(
      '4px 8px 12px 16px',
    );
    expect(
      cleanFontFamily('ui-sans-serif, system-ui, "Geist Sans", sans-serif'),
    ).toBe('Geist Sans');
    expect(cleanFontFamily('ui-sans-serif, system-ui, sans-serif')).toBe(
      'ui-sans-serif',
    );
  });

  it('resolves gradient text (background-clip: text + color: transparent) and gradient container backgrounds', () => {
    const heroSection = document.createElement('section');
    heroSection.style.backgroundColor = 'rgb(10, 10, 10)';
    heroSection.style.backgroundImage =
      'linear-gradient(180deg, rgba(120, 20, 20, 0.5), transparent)';

    const heading = document.createElement('h1');
    heading.style.color = 'transparent';
    heading.style.backgroundImage =
      'linear-gradient(90deg, rgb(255, 255, 255), rgba(255, 255, 255, 0.5))';
    heading.style.backgroundClip = 'text';

    heroSection.appendChild(heading);
    document.body.appendChild(heroSection);

    const styles = extractInspectedStyles(heading, {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      width: 312,
      height: 96,
      right: 312,
      bottom: 96,
      toJSON: () => ({}),
    });

    // Background should blend the section's semi-transparent red gradient over #0A0A0A (not #000000)
    expect(styles.colors.background.hex).toBe('#260D0D');
    expect(styles.colors.background.gradient).toContain('linear-gradient');

    // Gradient text should resolve to the blended white/silver gradient color (not #000000!)
    expect(styles.colors.text.hex).toBe('#C9C3C3');
    expect(styles.colors.text.gradient).toContain('linear-gradient');
    expect(styles.colors.contrast.level).toBe('AAA');
    expect(styles.colors.contrast.ratio).toBeGreaterThan(7);
  });

  it('does not leak ancestor gradient into swatch when element has its own background color, and normalizes infinity border-radius', () => {
    const page = document.createElement('div');
    page.style.backgroundColor = 'rgb(0, 0, 0)';
    page.style.backgroundImage =
      'linear-gradient(180deg, rgb(0, 0, 0), rgb(17, 17, 17))';

    const badge = document.createElement('p');
    badge.style.backgroundColor = 'rgba(16, 185, 129, 0.25)';
    badge.style.color = 'rgb(123, 241, 168)';
    badge.style.borderRadius = '33554432px';

    page.appendChild(badge);
    document.body.appendChild(page);

    const styles = extractInspectedStyles(badge, {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      width: 61,
      height: 30,
      right: 61,
      bottom: 30,
      toJSON: () => ({}),
    });

    expect(styles.colors.isInheritedBackground).toBe(false);
    expect(styles.colors.background.gradient).toBeUndefined();
    expect(styles.colors.background.hex).not.toBe('#000000');
    expect(styles.layout.borderRadius).toBe('9999px');
  });
});
