import { useEffect, useRef, useState } from 'react';
import { extractContainerInfo } from '@/lib/container-detector';
import { isOverlayElement } from '@/lib/dom-utils';
import type { DetectedContainerInfo } from '@/types/layout-guides';

export interface ContainerPickerOverlayProps {
  active: boolean;
  onSelect: (info: DetectedContainerInfo) => void;
  onCancel: () => void;
}

export function ContainerPickerOverlay({
  active,
  onSelect,
  onCancel,
}: ContainerPickerOverlayProps) {
  const [hoveredInfo, setHoveredInfo] = useState<DetectedContainerInfo | null>(
    null,
  );
  const hoveredInfoRef = useRef<DetectedContainerInfo | null>(null);
  const lastTargetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) {
      hoveredInfoRef.current = null;
      lastTargetRef.current = null;
      setHoveredInfo(null);
      return;
    }

    let rafId: number | null = null;
    let pendingPoint: { x: number; y: number } | null = null;

    const updateHoveredInfo = (info: DetectedContainerInfo | null) => {
      hoveredInfoRef.current = info;
      setHoveredInfo(info);
    };

    const processPointerMove = () => {
      rafId = null;
      if (!pendingPoint) return;

      const target = document.elementFromPoint(pendingPoint.x, pendingPoint.y);
      if (
        !target ||
        !(target instanceof HTMLElement) ||
        isOverlayElement(target)
      ) {
        lastTargetRef.current = null;
        updateHoveredInfo(null);
        return;
      }

      if (target === lastTargetRef.current && hoveredInfoRef.current) {
        return;
      }
      lastTargetRef.current = target;

      // Если навели на мелкий текстовый/инлайн элемент, поднимаемся до ближайшего блочного контейнера
      let candidate: HTMLElement = target;
      while (
        candidate.parentElement &&
        candidate.parentElement !== document.body &&
        candidate.getBoundingClientRect().width < 200
      ) {
        candidate = candidate.parentElement;
      }

      if (
        hoveredInfoRef.current &&
        hoveredInfoRef.current.element === candidate
      ) {
        return;
      }

      updateHoveredInfo(extractContainerInfo(candidate));
    };

    const handlePointerMove = (e: MouseEvent) => {
      pendingPoint = { x: e.clientX, y: e.clientY };
      if (rafId === null) {
        rafId = window.requestAnimationFrame(processPointerMove);
      }
    };

    const handleScrollOrResize = () => {
      const current = hoveredInfoRef.current;
      if (!current || !document.body.contains(current.element)) return;
      updateHoveredInfo(extractContainerInfo(current.element));
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (isOverlayElement(target)) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      if (hoveredInfoRef.current) {
        onSelect(hoveredInfoRef.current);
      } else {
        onCancel();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCancel();
      }
    };

    window.addEventListener('mousemove', handlePointerMove, true);
    window.addEventListener('click', handleClick, true);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('scroll', handleScrollOrResize, {
      passive: true,
      capture: true,
    });
    window.addEventListener('resize', handleScrollOrResize, { passive: true });

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener('mousemove', handlePointerMove, true);
      window.removeEventListener('click', handleClick, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [active, onSelect, onCancel]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {/* Подсказка сверху экрана */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 rounded-full bg-popover/95 px-3.5 py-1.5 text-xs font-medium text-popover-foreground shadow-lg ring-1 ring-border backdrop-blur-xs">
        {i18n.t('picker.snapHint')} • {i18n.t('picker.cancelBeforeKey')}{' '}
        <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">
          Esc
        </kbd>{' '}
        {i18n.t('picker.cancelAfterKey')}
      </div>

      {hoveredInfo && (
        <div
          className="fixed border-2 border-primary bg-primary/10 transition-all duration-75"
          style={{
            top: hoveredInfo.rect.top,
            left: hoveredInfo.rect.left,
            width: hoveredInfo.rect.width,
            height: hoveredInfo.rect.height,
          }}
        >
          {/* Визуализация внутреннего padding-inline контейнера */}
          {hoveredInfo.paddingInline > 0 && (
            <>
              <div
                className="absolute inset-y-0 left-0 bg-emerald-500/20 border-r border-dashed border-emerald-500/60"
                style={{ width: hoveredInfo.paddingInline }}
              />
              <div
                className="absolute inset-y-0 right-0 bg-emerald-500/20 border-l border-dashed border-emerald-500/60"
                style={{ width: hoveredInfo.paddingInline }}
              />
            </>
          )}

          {/* Бейдж с размерами и параметрами элемента */}
          <div className="absolute -top-7 left-0 flex items-center gap-1.5 rounded bg-primary px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-primary-foreground shadow-sm">
            <span className="font-mono">{hoveredInfo.label}</span>
            <span className="opacity-75">•</span>
            <span>{Math.round(hoveredInfo.rect.width)}px</span>
            {hoveredInfo.paddingInline > 0 && (
              <span className="opacity-85">
                {i18n.t('picker.badgePadding', [hoveredInfo.paddingInline])}
              </span>
            )}
            {hoveredInfo.columnCount && (
              <span className="rounded bg-background/20 px-1 text-[10px]">
                {i18n.t('picker.badgeCols', [hoveredInfo.columnCount])}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
