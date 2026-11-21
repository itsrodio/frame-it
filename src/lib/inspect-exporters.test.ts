import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildCodeSnippet,
  buildFigmaSvg,
  buildJsxSnippet,
  buildTailwindClasses,
  formatColorByPreference,
  formatDimensionWithUnit,
} from '@/lib/inspect-exporters';
import { preloadImagesForFigma } from '@/lib/inspect-figma-svg';
import { extractInspectedStyles, formatColor } from '@/lib/inspect-styles';

function mockRect(
  left: number,
  top: number,
  width: number,
  height: number,
): DOMRect {
  return {
    x: left,
    y: top,
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON: () => ({}),
  };
}

describe('inspect-exporters', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('formats colors by preference (HEX, RGB, OKLCH) and dimensions by unit (px, rem, both)', () => {
    const color = formatColor({ r: 212, g: 212, b: 212, a: 1 });
    expect(formatColorByPreference(color, 'hex')).toBe('#D4D4D4');
    expect(formatColorByPreference(color, 'rgb')).toBe('rgb(212, 212, 212)');
    expect(formatColorByPreference(color, 'oklch')).toContain('oklch(');

    expect(formatDimensionWithUnit('16px', 'px')).toBe('16px');
    expect(formatDimensionWithUnit('16px', 'rem')).toBe('1rem');
    expect(formatDimensionWithUnit('16px', 'both')).toBe('16px (1rem)');
    expect(formatDimensionWithUnit('12px 24px', 'rem')).toBe('0.75rem 1.5rem');
    expect(formatDimensionWithUnit('0px', 'both')).toBe('0px');
  });

  it('generates Tailwind classes, React JSX snippet, and Figma SVG frame from DOM element', () => {
    const card = document.createElement('div');
    card.id = 'promo';
    card.textContent = 'Upgrade now';
    card.style.display = 'flex';
    card.style.gap = '12px';
    card.style.padding = '16px 24px';
    card.style.margin = '8px';
    card.style.borderRadius = '8px';
    card.style.fontFamily = 'Inter, sans-serif';
    card.style.fontSize = '20px';
    card.style.lineHeight = '28px';
    card.style.fontWeight = '600';
    card.style.color = 'rgb(255, 255, 255)';
    card.style.backgroundColor = 'rgb(15, 23, 42)';

    const badge = document.createElement('span');
    badge.style.backgroundColor = 'rgb(56, 189, 248)';
    badge.style.borderRadius = '4px';
    card.appendChild(badge);
    document.body.appendChild(card);

    vi.spyOn(badge, 'getBoundingClientRect').mockReturnValue(
      mockRect(16, 16, 40, 20),
    );

    const rect = mockRect(0, 0, 320, 120);
    const styles = extractInspectedStyles(card, rect);

    const tw = buildTailwindClasses(styles);
    expect(tw).toContain('flex');
    expect(tw).toContain('gap-3');
    expect(tw).toContain('py-4');
    expect(tw).toContain('px-6');
    expect(tw).toContain('m-2');
    expect(tw).toContain('rounded-lg');
    expect(tw).toContain('text-[20px]/[28px]');
    expect(tw).toContain('font-semibold');
    expect(tw).toContain('text-[#ffffff]');
    expect(tw).toContain('bg-[#0f172a]');

    expect(buildCodeSnippet(card, styles, 'tailwind')).toBe(tw);
    expect(buildCodeSnippet(card, styles, 'css')).toContain('display: flex;');

    const jsx = buildJsxSnippet(card, styles);
    expect(jsx).toContain('<div className="');
    expect(jsx).toContain('Upgrade now');
    expect(buildCodeSnippet(card, styles, 'jsx')).toBe(jsx);

    const svg = buildFigmaSvg(card, styles, rect);
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('width="320" height="120"');
    expect(svg).toContain('fill="#0F172A"');
    expect(svg).toContain('Upgrade now');
  });

  it('serializes direct <svg> and <img> elements cleanly', () => {
    const svgEl = document.createElement('svg') as unknown as HTMLElement;
    document.body.appendChild(svgEl);
    const rect = mockRect(0, 0, 24, 24);
    const svgStyles = extractInspectedStyles(svgEl, rect);
    const exportedSvg = buildFigmaSvg(svgEl, svgStyles, rect);
    expect(exportedSvg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(exportedSvg).toContain('width="24"');

    const imgEl = document.createElement('img');
    imgEl.setAttribute('src', '/logo.png');
    imgEl.setAttribute('alt', 'Logo');
    document.body.appendChild(imgEl);
    const imgStyles = extractInspectedStyles(imgEl, mockRect(0, 0, 100, 40));
    const imgJsx = buildJsxSnippet(imgEl, imgStyles);
    expect(imgJsx).toContain('<img className=');
    expect(imgJsx).toContain('src="/logo.png"');
  });

  it('recursively serializes complex multi-element cards (badges, headings, paragraphs, gradients, nested SVGs) into separate SVG layers for Figma', () => {
    const skillCard = document.createElement('div');
    skillCard.style.backgroundColor = 'rgb(20, 10, 18)';
    skillCard.style.borderRadius = '12px';
    skillCard.style.borderTopWidth = '1px';
    skillCard.style.borderTopColor = 'rgba(255, 255, 255, 0.12)';

    const iconSvg = document.createElement('svg');
    iconSvg.setAttribute('viewBox', '0 0 24 24');
    iconSvg.innerHTML = '<path fill="currentColor" d="M0 0h24v24H0z"/>';

    const expertBadge = document.createElement('span');
    expertBadge.textContent = 'Expert';
    expertBadge.style.backgroundColor = 'rgba(16, 185, 129, 0.15)';
    expertBadge.style.borderTopWidth = '1px';
    expertBadge.style.borderTopColor = 'rgb(16, 185, 129)';
    expertBadge.style.borderRadius = '9999px';
    expertBadge.style.color = 'rgb(110, 231, 183)';

    const title = document.createElement('h3');
    title.textContent = 'CSS';
    title.style.fontWeight = '700';

    const progressFill = document.createElement('div');
    progressFill.style.backgroundImage =
      'linear-gradient(90deg, rgb(168, 85, 247), rgb(217, 70, 239))';
    progressFill.style.borderRadius = '9999px';

    // Screen-reader-only element (.sr-only) must be ignored in Figma SVG export
    const srOnlyHeading = document.createElement('h2');
    srOnlyHeading.className = 'sr-only';
    srOnlyHeading.textContent = 'Folders and files';

    skillCard.append(iconSvg, expertBadge, title, progressFill, srOnlyHeading);
    document.body.appendChild(skillCard);

    vi.spyOn(iconSvg, 'getBoundingClientRect').mockReturnValue(
      mockRect(16, 16, 40, 40),
    );
    vi.spyOn(expertBadge, 'getBoundingClientRect').mockReturnValue(
      mockRect(280, 16, 68, 28),
    );
    vi.spyOn(title, 'getBoundingClientRect').mockReturnValue(
      mockRect(16, 80, 100, 28),
    );
    vi.spyOn(progressFill, 'getBoundingClientRect').mockReturnValue(
      mockRect(16, 200, 320, 8),
    );

    const cardRect = mockRect(0, 0, 364, 234);
    const styles = extractInspectedStyles(skillCard, cardRect);
    const svg = buildFigmaSvg(skillCard, styles, cardRect);

    // Must not concatenate child texts into a single "ExpertCSS" string or include .sr-only text
    expect(svg).not.toContain('ExpertCSS');
    expect(svg).not.toContain('Folders and files');
    expect(svg).toContain('>Expert</text>');
    expect(svg).toContain('>CSS</text>');
    // Must include linearGradient definition for the progress bar
    expect(svg).toContain('<linearGradient id="frameit-grad-1"');
    expect(svg).toContain('fill="url(#frameit-grad-1)"');
    // Must clamp 9999px pill border-radius to half of height (14 for 28px badge, 4 for 8px bar)
    expect(svg).toContain('rx="14"');
    expect(svg).toContain('rx="4"');
  });

  it('exports gradient text, asymmetric borders, and preloaded PNG data URL images for Figma SVG', async () => {
    const wrapper = document.createElement('div');
    wrapper.style.borderTopWidth = '2px';
    wrapper.style.borderTopColor = 'rgb(59, 130, 246)';
    wrapper.style.borderBottomWidth = '1px';
    wrapper.style.borderBottomColor = 'rgb(203, 213, 225)';

    const gradHeading = document.createElement('h2');
    gradHeading.textContent = 'Hero Title';
    gradHeading.style.backgroundImage =
      'linear-gradient(90deg, rgb(56, 189, 248), rgb(168, 85, 247))';
    gradHeading.style.backgroundClip = 'text';
    gradHeading.style.color = 'transparent';

    const avatar = document.createElement('img');
    avatar.setAttribute('src', 'data:image/png;base64,iVBORw0KGgo=');
    avatar.style.objectFit = 'contain';

    wrapper.append(gradHeading, avatar);
    document.body.appendChild(wrapper);

    vi.spyOn(gradHeading, 'getBoundingClientRect').mockReturnValue(
      mockRect(12, 12, 200, 32),
    );
    vi.spyOn(avatar, 'getBoundingClientRect').mockReturnValue(
      mockRect(12, 56, 48, 48),
    );

    const preloaded = await preloadImagesForFigma(wrapper);
    expect(preloaded.get(avatar)).toBe('data:image/png;base64,iVBORw0KGgo=');

    const rect = mockRect(0, 0, 300, 140);
    const styles = extractInspectedStyles(wrapper, rect);
    const svg = buildFigmaSvg(wrapper, styles, rect, preloaded);

    expect(svg).toContain('<line x1="0" y1="0" x2="300" y2="0"');
    expect(svg).toContain('<line x1="0" y1="140" x2="300" y2="140"');
    expect(svg).toContain('fill="url(#frameit-grad-1)"');
    expect(svg).toContain('preserveAspectRatio="xMidYMid meet"');
    expect(svg).toContain('data:image/png;base64,iVBORw0KGgo=');
  });

  it('covers 4-value box shorthands, 2-value gap, arbitrary radius, normal lineHeight, and empty JSX children', () => {
    expect(formatDimensionWithUnit('auto', 'rem')).toBe('auto');

    const el = document.createElement('section');
    el.style.display = 'grid';
    el.style.rowGap = '12px';
    el.style.columnGap = '24px';
    el.style.padding = '4px 8px 12px 16px';
    el.style.margin = '0px 13px';
    el.style.borderRadius = '10px 20px';
    el.style.fontSize = '14px';
    el.style.lineHeight = 'normal';
    el.style.fontWeight = '700';
    el.style.color = 'rgb(17, 24, 39)';
    document.body.appendChild(el);

    const styles = extractInspectedStyles(el, mockRect(0, 0, 400, 200));
    const tw = buildTailwindClasses(styles);
    expect(tw).toContain('grid');
    expect(tw).toContain('gap-y-3');
    expect(tw).toContain('gap-x-6');
    expect(tw).toContain('pt-1 pr-2 pb-3 pl-4');
    expect(tw).toContain('mx-[13px]');
    expect(tw).toContain('rounded-[10px_20px]');
    expect(tw).toContain('text-[14px]');
    expect(tw).toContain('font-bold');

    const jsx = buildJsxSnippet(el, styles);
    expect(jsx).toContain('{/* children */}');
  });
});
