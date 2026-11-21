import { describe, expect, it, vi } from 'vitest';
import {
  calculateDistances,
  calculateFlexGridGaps,
  calculateInspectCardPosition,
  parseMargin,
  parsePadding,
} from '@/lib/inspect-geometry';

function rect(
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

describe('inspect-geometry', () => {
  it('parses element padding rounded to integers', () => {
    const el = document.createElement('div');
    el.style.paddingTop = '12.4px';
    el.style.paddingRight = '16px';
    el.style.paddingBottom = '8.6px';
    el.style.paddingLeft = '0px';
    document.body.appendChild(el);

    expect(parsePadding(el)).toEqual({
      top: 12,
      right: 16,
      bottom: 9,
      left: 0,
    });
    el.remove();
  });

  it('calculates separated distances in all 4 directions with projection guideLines', () => {
    const source = rect(200, 200, 100, 100); // midX = 250, midY = 250

    // Target to the left and above midY (so guideLine projects down to midY)
    const leftTopTarget = rect(50, 20, 100, 80); // right = 150, bottom = 100
    const leftTopLines = calculateDistances(source, leftTopTarget);
    expect(leftTopLines).toHaveLength(2);
    expect(leftTopLines[0]).toMatchObject({
      direction: 'left',
      value: 50,
      guideLine: { x1: 150, y1: 100, x2: 150, y2: 250 },
    });
    expect(leftTopLines[1]).toMatchObject({
      direction: 'top',
      value: 100,
      guideLine: { x1: 150, y1: 100, x2: 250, y2: 100 },
    });

    // Target to the right and below midY
    const rightBottomTarget = rect(400, 400, 100, 80);
    const rightBottomLines = calculateDistances(source, rightBottomTarget);
    expect(rightBottomLines).toHaveLength(2);
    expect(rightBottomLines[0]).toMatchObject({
      direction: 'right',
      value: 100,
      guideLine: { x1: 400, y1: 400, x2: 400, y2: 250 },
    });
    expect(rightBottomLines[1]).toMatchObject({
      direction: 'bottom',
      value: 100,
      guideLine: { x1: 400, y1: 400, x2: 250, y2: 400 },
    });
  });

  it('calculates 4-sided nested distances when source is inside target', () => {
    const parent = rect(100, 100, 400, 300);
    const child = rect(120, 130, 200, 100);
    const lines = calculateDistances(child, parent);

    expect(lines.map((l) => [l.direction, l.value])).toEqual([
      ['top', 30],
      ['bottom', 170],
      ['left', 20],
      ['right', 180],
    ]);
  });

  it('positions InspectDetailsCard on right, left, bottom, top, or fallback corner based on available space', () => {
    const viewport = { width: 1000, height: 800 };
    const cardSize = { width: 272, height: 330 };

    // 1. Fits on the right
    expect(
      calculateInspectCardPosition(
        rect(100, 100, 200, 100),
        viewport,
        cardSize,
      ),
    ).toEqual({ left: 312, top: 100 });

    // 2. No room on right, fits on the left
    expect(
      calculateInspectCardPosition(
        rect(600, 100, 300, 100),
        viewport,
        cardSize,
      ),
    ).toEqual({ left: 316, top: 100 });

    // 3. Wide element (no room left or right), fits below
    expect(
      calculateInspectCardPosition(rect(100, 50, 800, 100), viewport, cardSize),
    ).toEqual({ left: 100, top: 162 });

    // 4. Wide element near bottom (no room left, right, or below), fits above
    expect(
      calculateInspectCardPosition(
        rect(100, 400, 800, 300),
        viewport,
        cardSize,
      ),
    ).toEqual({ left: 100, top: 58 });

    // 5. Fullscreen element fallback
    expect(
      calculateInspectCardPosition(rect(0, 0, 1000, 800), viewport, cardSize),
    ).toEqual({ left: 716, top: 52 });

    // 6. Pinned mode always anchors to top-right corner
    expect(
      calculateInspectCardPosition(
        rect(100, 100, 200, 100),
        viewport,
        cardSize,
        'pinned',
      ),
    ).toEqual({ left: 716, top: 52 });
  });

  it('parses element margin and calculates Flex/Grid gap overlay boxes between children', () => {
    const flexRow = document.createElement('div');
    flexRow.style.display = 'flex';
    flexRow.style.marginTop = '16px';
    flexRow.style.marginLeft = '8px';

    const c1 = document.createElement('div');
    const c2 = document.createElement('div');
    const c3 = document.createElement('div');
    flexRow.append(c1, c2, c3);
    document.body.appendChild(flexRow);

    expect(parseMargin(flexRow)).toEqual({
      top: 16,
      right: 0,
      bottom: 0,
      left: 8,
    });

    vi.spyOn(c1, 'getBoundingClientRect').mockReturnValue(
      rect(10, 10, 100, 40),
    );
    vi.spyOn(c2, 'getBoundingClientRect').mockReturnValue(
      rect(126, 10, 100, 40),
    );
    vi.spyOn(c3, 'getBoundingClientRect').mockReturnValue(
      rect(126, 62, 100, 40),
    );

    const gaps = calculateFlexGridGaps(flexRow);
    expect(gaps).toHaveLength(2);
    expect(gaps[0]).toMatchObject({
      axis: 'x',
      value: 16,
      left: 110,
      width: 16,
    });
    expect(gaps[1]).toMatchObject({
      axis: 'y',
      value: 12,
      top: 50,
      height: 12,
    });
  });

  it('covers non-flex/grid gap shortcut and vertical guideLine projections when midX is outside target', () => {
    const block = document.createElement('div');
    block.style.display = 'block';
    document.body.appendChild(block);
    expect(calculateFlexGridGaps(block)).toEqual([]);

    const source = rect(200, 200, 100, 100); // midX = 250
    // Target to the left and above with target.right < midX (guideX = target.right)
    const topLeft = rect(50, 50, 100, 50); // right = 150, bottom = 100
    const tlLines = calculateDistances(source, topLeft);
    expect(tlLines.find((l) => l.direction === 'top')?.guideLine).toEqual({
      x1: 150,
      y1: 100,
      x2: 250,
      y2: 100,
    });

    // Target to the right and below with target.left > midX (guideX = target.left)
    const bottomRight = rect(350, 400, 100, 50); // left = 350, top = 400
    const brLines = calculateDistances(source, bottomRight);
    expect(brLines.find((l) => l.direction === 'bottom')?.guideLine).toEqual({
      x1: 350,
      y1: 400,
      x2: 250,
      y2: 400,
    });

    // Target below and to the left with midY > target.bottom
    const leftAbove = rect(20, 400, 80, 60); // right = 100, top = 400
    const laLines = calculateDistances(source, leftAbove);
    expect(laLines.find((l) => l.direction === 'left')?.guideLine).toEqual({
      x1: 100,
      y1: 400,
      x2: 100,
      y2: 250,
    });

    // Target above with midX < target.left
    const topRight = rect(350, 20, 80, 60);
    const trLines = calculateDistances(source, topRight);
    expect(trLines.find((l) => l.direction === 'top')?.guideLine).toEqual({
      x1: 350,
      y1: 80,
      x2: 250,
      y2: 80,
    });
  });
});
