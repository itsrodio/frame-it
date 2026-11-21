import { describe, expect, it } from 'vitest';
import {
  calculateDistances,
  calculateInspectCardPosition,
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
  });
});
