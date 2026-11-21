import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildFigmaSvg, preloadImagesForFigma } from '@/lib/inspect-figma-svg';
import { extractInspectedStyles } from '@/lib/inspect-styles';

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

describe('inspect-figma-svg', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('skips visually hidden elements, script/style tags, and zero-sized children', () => {
    const root = document.createElement('div');
    root.style.backgroundColor = 'rgb(255, 255, 255)';

    const hiddenDisplay = document.createElement('span');
    hiddenDisplay.style.display = 'none';
    hiddenDisplay.textContent = 'HiddenDisplay';

    const hiddenOpacity = document.createElement('span');
    hiddenOpacity.style.opacity = '0';
    hiddenOpacity.textContent = 'HiddenOpacity';

    const hiddenClip = document.createElement('span');
    hiddenClip.style.clip = 'rect(0px, 0px, 0px, 0px)';
    hiddenClip.textContent = 'HiddenClip';

    const hiddenClipPath = document.createElement('span');
    hiddenClipPath.style.clipPath = 'inset(50%)';
    hiddenClipPath.textContent = 'HiddenClipPath';

    const tinyOverflow = document.createElement('span');
    tinyOverflow.style.overflow = 'hidden';
    tinyOverflow.textContent = 'TinyOverflow';

    const scriptEl = document.createElement('script');
    scriptEl.textContent = 'console.log("skip")';

    const zeroBox = document.createElement('div');
    zeroBox.textContent = 'ZeroBox';

    const visibleText = document.createElement('p');
    visibleText.textContent = 'Visible Copy';
    visibleText.style.fontFamily = 'ui-monospace, Menlo, monospace';
    visibleText.style.color = 'rgba(15, 23, 42, 0.8)';

    root.append(
      hiddenDisplay,
      hiddenOpacity,
      hiddenClip,
      hiddenClipPath,
      tinyOverflow,
      scriptEl,
      zeroBox,
      visibleText,
    );
    document.body.appendChild(root);

    vi.spyOn(tinyOverflow, 'getBoundingClientRect').mockReturnValue(
      mockRect(0, 0, 1, 1),
    );
    vi.spyOn(zeroBox, 'getBoundingClientRect').mockReturnValue(
      mockRect(0, 0, 0, 0),
    );
    vi.spyOn(visibleText, 'getBoundingClientRect').mockReturnValue(
      mockRect(12, 16, 200, 24),
    );

    const rect = mockRect(0, 0, 300, 120);
    const styles = extractInspectedStyles(root, rect);
    const svg = buildFigmaSvg(root, styles, rect);

    expect(svg).not.toContain('HiddenDisplay');
    expect(svg).not.toContain('HiddenOpacity');
    expect(svg).not.toContain('HiddenClip');
    expect(svg).not.toContain('HiddenClipPath');
    expect(svg).not.toContain('TinyOverflow');
    expect(svg).not.toContain('console.log');
    expect(svg).not.toContain('ZeroBox');
    expect(svg).toContain('Visible Copy');
    expect(svg).toContain('font-family="Roboto Mono"');
    expect(svg).toContain('fill-opacity="0.8"');
  });

  it('handles Range clientRects single-line truncation, multi-line wrapping, and inline tspan merging', () => {
    const container = document.createElement('div');
    container.style.overflow = 'hidden';
    container.style.fontFamily = 'ui-sans-serif, system-ui, sans-serif';
    container.style.fontSize = '14px';
    container.style.lineHeight = '20px';

    const lineRow = document.createElement('div');
    const partA = document.createElement('span');
    partA.textContent = 'Hello ';
    const partB = document.createElement('em');
    partB.style.fontStyle = 'italic';
    partB.style.color = 'rgb(239, 68, 68)';
    partB.textContent = 'world';

    const clippedSpan = document.createElement('span');
    clippedSpan.style.overflow = 'hidden';
    clippedSpan.style.textOverflow = 'ellipsis';
    clippedSpan.textContent = 'Very long overflowing title that gets truncated';

    const multiLine = document.createElement('p');
    multiLine.textContent = 'First second third fourth';

    lineRow.append(partA, partB);
    container.append(lineRow, clippedSpan, multiLine);
    document.body.appendChild(container);

    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue(
      mockRect(0, 0, 200, 180),
    );
    vi.spyOn(lineRow, 'getBoundingClientRect').mockReturnValue(
      mockRect(10, 10, 180, 20),
    );
    vi.spyOn(partA, 'getBoundingClientRect').mockReturnValue(
      mockRect(10, 10, 36, 20),
    );
    vi.spyOn(partB, 'getBoundingClientRect').mockReturnValue(
      mockRect(47, 10, 40, 20),
    );
    vi.spyOn(clippedSpan, 'getBoundingClientRect').mockReturnValue(
      mockRect(10, 40, 100, 20),
    );
    vi.spyOn(multiLine, 'getBoundingClientRect').mockReturnValue(
      mockRect(10, 70, 180, 48),
    );

    const textNodeA = partA.firstChild as Text;
    const textNodeB = partB.firstChild as Text;
    const textNodeClip = clippedSpan.firstChild as Text;
    const textNodeMulti = multiLine.firstChild as Text;

    vi.spyOn(document, 'createRange').mockImplementation(() => {
      let targetNode: Node | null = null;
      let startOffset = 0;
      return {
        selectNodeContents(node: Node) {
          targetNode = node;
        },
        setStart(_node: Node, offset: number) {
          startOffset = offset;
        },
        setEnd() {},
        getClientRects() {
          if (targetNode === textNodeA) {
            return [mockRect(10, 10, 36, 20)] as unknown as DOMRectList;
          }
          if (targetNode === textNodeB) {
            return [mockRect(47, 11, 40, 20)] as unknown as DOMRectList;
          }
          if (targetNode === textNodeClip) {
            return [mockRect(10, 40, 320, 20)] as unknown as DOMRectList;
          }
          if (targetNode === textNodeMulti) {
            return [
              mockRect(10, 70, 120, 20),
              mockRect(10, 92, 120, 20),
            ] as unknown as DOMRectList;
          }
          return [] as unknown as DOMRectList;
        },
        getBoundingClientRect() {
          // Put first 2 words on y=70, remaining words on y=92
          if (startOffset < 12) {
            return mockRect(10 + startOffset * 5, 70, 30, 20);
          }
          return mockRect(10 + (startOffset - 12) * 5, 92, 35, 20);
        },
      } as unknown as Range;
    });

    const rect = mockRect(0, 0, 200, 180);
    const styles = extractInspectedStyles(container, rect);
    const svg = buildFigmaSvg(container, styles, rect);

    expect(svg).toContain('font-family="Inter"');
    expect(svg).toContain('<tspan>Hello </tspan>');
    expect(svg).toContain('font-style="italic"');
    expect(svg).toContain('…');
    expect(svg).toContain('>First second</text>');
    expect(svg).toContain('>third fourth</text>');
  });

  it('wraps fallback multi-line text when Range has no clientRects and traverses Shadow DOM', () => {
    vi.spyOn(document, 'createRange').mockImplementation(
      () =>
        ({
          selectNodeContents() {},
          getClientRects: () => [] as unknown as DOMRectList,
        }) as unknown as Range,
    );

    const card = document.createElement('div');
    const para = document.createElement('p');
    para.style.fontSize = '16px';
    para.style.lineHeight = '20px';
    para.textContent = 'Alpha Beta Gamma Delta Epsilon Zeta';

    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });
    const shadowText = document.createElement('span');
    shadowText.textContent = 'ShadowTime';
    shadow.appendChild(shadowText);

    card.append(para, host);
    document.body.appendChild(card);

    vi.spyOn(para, 'getBoundingClientRect').mockReturnValue(
      mockRect(10, 10, 90, 80),
    );
    vi.spyOn(host, 'getBoundingClientRect').mockReturnValue(
      mockRect(10, 100, 100, 24),
    );
    vi.spyOn(shadowText, 'getBoundingClientRect').mockReturnValue(
      mockRect(10, 100, 80, 20),
    );

    const rect = mockRect(0, 0, 200, 160);
    const styles = extractInspectedStyles(card, rect);
    const svg = buildFigmaSvg(card, styles, rect);

    expect(svg).toContain('Alpha');
    expect(svg).toContain('Zeta');
    expect(svg).toContain('ShadowTime');
  });

  it('preloads images via canvas drawImage (object-fit cover) and fetch + ImageBitmap / FileReader fallback', async () => {
    const drawImage = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage,
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
      'data:image/png;base64,CONVERTED',
    );

    // 1. Direct root HTMLImageElement with natural dimensions -> drawn directly onto canvas
    const directImg = document.createElement('img');
    Object.defineProperty(directImg, 'naturalWidth', {
      value: 400,
      configurable: true,
    });
    Object.defineProperty(directImg, 'naturalHeight', {
      value: 200,
      configurable: true,
    });
    directImg.style.objectFit = 'cover';
    document.body.appendChild(directImg);
    vi.spyOn(directImg, 'getBoundingClientRect').mockReturnValue(
      mockRect(0, 0, 100, 100),
    );

    const directMap = await preloadImagesForFigma(directImg);
    expect(directMap.get(directImg)).toBe('data:image/png;base64,CONVERTED');
    expect(drawImage).toHaveBeenCalled();

    // 2. Child <img> whose canvas draw throws/returns null initially, falling back to fetch + blobToPngDataUrl
    const box = document.createElement('div');
    const fetchedImg = document.createElement('img');
    fetchedImg.setAttribute('src', 'https://cdn.example.com/photo.webp');
    fetchedImg.style.objectFit = 'cover';
    const badFetchImg = document.createElement('img');
    badFetchImg.setAttribute('src', 'https://cdn.example.com/missing.png');
    box.append(fetchedImg, badFetchImg);
    document.body.appendChild(box);

    vi.spyOn(fetchedImg, 'getBoundingClientRect').mockReturnValue(
      mockRect(0, 0, 200, 100),
    );
    vi.spyOn(badFetchImg, 'getBoundingClientRect').mockReturnValue(
      mockRect(0, 0, 100, 100),
    );

    // Make direct imageElementToCanvasDataUrl return null (by temporarily mocking getContext null on first call per img)
    let callIdx = 0;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () => {
        callIdx += 1;
        // Calls 1 & 2 are direct imageElementToCanvasDataUrl for the two imgs; call 3 is from blobToPngDataUrl
        if (callIdx <= 2) return null;
        return { drawImage } as unknown as CanvasRenderingContext2D;
      },
    );

    Object.defineProperty(window, 'createImageBitmap', {
      value: vi.fn().mockResolvedValue({
        width: 100,
        height: 300,
        close: vi.fn(),
      }),
      configurable: true,
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['webp'], { type: 'image/webp' }),
      })
      .mockResolvedValueOnce({
        ok: false,
      });
    vi.stubGlobal('fetch', fetchMock);

    const preloaded = await preloadImagesForFigma(box);
    expect(preloaded.get(fetchedImg)).toBe('data:image/png;base64,CONVERTED');
    expect(preloaded.get(badFetchImg)).toBeUndefined();
    vi.unstubAllGlobals();
  });
});
