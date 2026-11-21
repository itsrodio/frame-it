export interface DistanceLine {
  direction: 'top' | 'right' | 'bottom' | 'left';
  value: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  guideLine?: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}

export interface BoxPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface GapOverlayBox {
  axis: 'x' | 'y';
  value: number;
  top: number;
  left: number;
  width: number;
  height: number;
}

export function parsePadding(el: HTMLElement): BoxPadding {
  const style = window.getComputedStyle(el);
  return {
    top: Math.round(Number.parseFloat(style.paddingTop) || 0),
    right: Math.round(Number.parseFloat(style.paddingRight) || 0),
    bottom: Math.round(Number.parseFloat(style.paddingBottom) || 0),
    left: Math.round(Number.parseFloat(style.paddingLeft) || 0),
  };
}

export function parseMargin(el: HTMLElement): BoxPadding {
  const style = window.getComputedStyle(el);
  return {
    top: Math.max(0, Math.round(Number.parseFloat(style.marginTop) || 0)),
    right: Math.max(0, Math.round(Number.parseFloat(style.marginRight) || 0)),
    bottom: Math.max(0, Math.round(Number.parseFloat(style.marginBottom) || 0)),
    left: Math.max(0, Math.round(Number.parseFloat(style.marginLeft) || 0)),
  };
}

/**
 * Вычисляет прямоугольники визуальных отступов (gap) между прямыми видимыми детьми
 * flex- или grid-контейнера для отображения на холсте в стиле Figma Auto Layout.
 */
export function calculateFlexGridGaps(el: HTMLElement): GapOverlayBox[] {
  const style = window.getComputedStyle(el);
  const display = style.display;
  if (
    display !== 'flex' &&
    display !== 'inline-flex' &&
    display !== 'grid' &&
    display !== 'inline-grid'
  ) {
    return [];
  }

  const children = Array.from(el.children).filter(
    (c): c is HTMLElement => c instanceof HTMLElement,
  );
  if (children.length < 2) return [];

  const rects = children
    .map((c) => c.getBoundingClientRect())
    .filter((r) => r.width > 0 && r.height > 0);

  const gaps: GapOverlayBox[] = [];
  for (let i = 0; i < rects.length - 1; i++) {
    const a = rects[i];
    const b = rects[i + 1];
    if (!a || !b) continue;

    const hGap = Math.round(b.left - a.right);
    const vOverlap = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    if (hGap >= 2 && vOverlap > 0) {
      gaps.push({
        axis: 'x',
        value: hGap,
        left: a.right,
        top: Math.min(a.top, b.top),
        width: hGap,
        height: Math.max(a.bottom, b.bottom) - Math.min(a.top, b.top),
      });
      continue;
    }

    const vGap = Math.round(b.top - a.bottom);
    const hOverlap = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    if (vGap >= 2 && hOverlap > 0) {
      gaps.push({
        axis: 'y',
        value: vGap,
        left: Math.min(a.left, b.left),
        top: a.bottom,
        width: Math.max(a.right, b.right) - Math.min(a.left, b.left),
        height: vGap,
      });
    }
  }

  return gaps.slice(0, 12);
}

/**
 * Вычисляет расстояния в пикселях от sourceRect до targetRect (как по Alt в Figma).
 * Поддерживает два случая:
 * 1. Непересекающиеся элементы (внешние расстояния по X и Y + пунктирные проекции).
 * 2. Вложенные/пересекающиеся элементы (расстояния до 4 внутренних граней родителя или экрана).
 */
export function calculateDistances(
  source: DOMRect,
  target: DOMRect,
): DistanceLine[] {
  const lines: DistanceLine[] = [];
  const midX = source.left + source.width / 2;
  const midY = source.top + source.height / 2;

  const separatedLeft = target.right <= source.left;
  const separatedRight = target.left >= source.right;
  const separatedTop = target.bottom <= source.top;
  const separatedBottom = target.top >= source.bottom;

  // Если элементы разделены снаружи (sibling / другой блок на странице)
  if (separatedLeft || separatedRight || separatedTop || separatedBottom) {
    if (separatedLeft) {
      const dist = Math.round(source.left - target.right);
      if (dist > 0) {
        const guideY =
          midY < target.top
            ? target.top
            : midY > target.bottom
              ? target.bottom
              : null;
        lines.push({
          direction: 'left',
          value: dist,
          x1: target.right,
          y1: midY,
          x2: source.left,
          y2: midY,
          guideLine:
            guideY !== null
              ? { x1: target.right, y1: guideY, x2: target.right, y2: midY }
              : undefined,
        });
      }
    } else if (separatedRight) {
      const dist = Math.round(target.left - source.right);
      if (dist > 0) {
        const guideY =
          midY < target.top
            ? target.top
            : midY > target.bottom
              ? target.bottom
              : null;
        lines.push({
          direction: 'right',
          value: dist,
          x1: source.right,
          y1: midY,
          x2: target.left,
          y2: midY,
          guideLine:
            guideY !== null
              ? { x1: target.left, y1: guideY, x2: target.left, y2: midY }
              : undefined,
        });
      }
    }

    if (separatedTop) {
      const dist = Math.round(source.top - target.bottom);
      if (dist > 0) {
        const guideX =
          midX < target.left
            ? target.left
            : midX > target.right
              ? target.right
              : null;
        lines.push({
          direction: 'top',
          value: dist,
          x1: midX,
          y1: target.bottom,
          x2: midX,
          y2: source.top,
          guideLine:
            guideX !== null
              ? { x1: guideX, y1: target.bottom, x2: midX, y2: target.bottom }
              : undefined,
        });
      }
    } else if (separatedBottom) {
      const dist = Math.round(target.top - source.bottom);
      if (dist > 0) {
        const guideX =
          midX < target.left
            ? target.left
            : midX > target.right
              ? target.right
              : null;
        lines.push({
          direction: 'bottom',
          value: dist,
          x1: midX,
          y1: source.bottom,
          x2: midX,
          y2: target.top,
          guideLine:
            guideX !== null
              ? { x1: guideX, y1: target.top, x2: midX, y2: target.top }
              : undefined,
        });
      }
    }

    return lines;
  }

  // Иначе один элемент находится внутри другого (или пересекается) — меряем 4 стороны до граней
  const topDist = Math.round(Math.abs(source.top - target.top));
  if (topDist > 0) {
    lines.push({
      direction: 'top',
      value: topDist,
      x1: midX,
      y1: Math.min(source.top, target.top),
      x2: midX,
      y2: Math.max(source.top, target.top),
    });
  }

  const bottomDist = Math.round(Math.abs(target.bottom - source.bottom));
  if (bottomDist > 0) {
    lines.push({
      direction: 'bottom',
      value: bottomDist,
      x1: midX,
      y1: Math.min(source.bottom, target.bottom),
      x2: midX,
      y2: Math.max(source.bottom, target.bottom),
    });
  }

  const leftDist = Math.round(Math.abs(source.left - target.left));
  if (leftDist > 0) {
    lines.push({
      direction: 'left',
      value: leftDist,
      x1: Math.min(source.left, target.left),
      y1: midY,
      x2: Math.max(source.left, target.left),
      y2: midY,
    });
  }

  const rightDist = Math.round(Math.abs(target.right - source.right));
  if (rightDist > 0) {
    lines.push({
      direction: 'right',
      value: rightDist,
      x1: Math.min(source.right, target.right),
      y1: midY,
      x2: Math.max(source.right, target.right),
      y2: midY,
    });
  }

  return lines;
}

export interface InspectCardPosition {
  top: number;
  left: number;
}

/**
 * Вычисляет позицию карточки инспектора рядом с зафиксированным элементом так,
 * чтобы она не перекрывала сам элемент и не выходила за края вьюпорта.
 */
export function calculateInspectCardPosition(
  targetRect: DOMRect,
  viewport: { width: number; height: number },
  cardSize: { width: number; height: number } = { width: 300, height: 290 },
  placement: 'floating' | 'pinned' = 'floating',
): InspectCardPosition {
  const gap = 12;
  const margin = 12;
  const bottomSafeMargin = 72; // Оставляем место под Dock внизу экрана

  const clampX = (x: number) =>
    Math.max(
      margin,
      Math.min(x, Math.max(margin, viewport.width - cardSize.width - margin)),
    );
  const clampY = (y: number) =>
    Math.max(
      margin,
      Math.min(
        y,
        Math.max(margin, viewport.height - cardSize.height - bottomSafeMargin),
      ),
    );

  if (placement === 'pinned') {
    return {
      left: Math.round(clampX(viewport.width - cardSize.width - margin)),
      top: Math.round(margin + 40),
    };
  }

  // 1. Справа от элемента
  if (targetRect.right + gap + cardSize.width <= viewport.width - margin) {
    return {
      left: Math.round(targetRect.right + gap),
      top: Math.round(clampY(targetRect.top)),
    };
  }

  // 2. Слева от элемента
  if (targetRect.left - gap - cardSize.width >= margin) {
    return {
      left: Math.round(targetRect.left - gap - cardSize.width),
      top: Math.round(clampY(targetRect.top)),
    };
  }

  // 3. Снизу от элемента
  if (
    targetRect.bottom + gap + cardSize.height <=
    viewport.height - bottomSafeMargin
  ) {
    return {
      left: Math.round(clampX(targetRect.left)),
      top: Math.round(targetRect.bottom + gap),
    };
  }

  // 4. Сверху от элемента
  if (targetRect.top - gap - cardSize.height >= margin) {
    return {
      left: Math.round(clampX(targetRect.left)),
      top: Math.round(targetRect.top - gap - cardSize.height),
    };
  }

  // 5. Если элемент занимает почти весь экран — фиксируем в правом верхнем углу вьюпорта
  return {
    left: Math.round(clampX(viewport.width - cardSize.width - margin)),
    top: Math.round(margin + 40),
  };
}
