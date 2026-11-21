import { useEffect } from 'react';
import { extractImageFromClipboard } from '@/lib/design-overlay-image';
import { isEditableTarget } from '@/lib/dom-utils';

export interface UseDesignOverlayInteractionOptions {
  portalContainer: HTMLElement;
  canNudge: boolean;
  onPasteImage: (file: File | Blob, fileName: string) => void;
  onNudge: (dx: number, dy: number) => void;
}

function getShadowActiveElement(portalContainer: HTMLElement): Element | null {
  const root = portalContainer.getRootNode();
  return root instanceof ShadowRoot ? root.activeElement : null;
}

function isInteractiveOverlayWidget(el: Element | null): boolean {
  if (!el) return false;
  return Boolean(
    el.closest('[role="listbox"]') ||
      el.closest('[role="menu"]') ||
      el.closest('[role="slider"]'),
  );
}

export function useDesignOverlayInteraction({
  portalContainer,
  canNudge,
  onPasteImage,
  onNudge,
}: UseDesignOverlayInteractionOptions): void {
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const shadowActive = getShadowActiveElement(portalContainer);
      const originTarget = (e.composedPath?.()[0] ??
        e.target) as EventTarget | null;

      if (
        isEditableTarget(e.target) ||
        isEditableTarget(originTarget) ||
        isEditableTarget(shadowActive)
      ) {
        return;
      }

      const extracted = extractImageFromClipboard(e.clipboardData);
      if (!extracted) return;

      e.preventDefault();
      e.stopPropagation();
      onPasteImage(extracted.file, extracted.fileName);
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onPasteImage, portalContainer]);

  useEffect(() => {
    if (!canNudge) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const shadowActive = getShadowActiveElement(portalContainer);
      const originTarget = (e.composedPath?.()[0] ??
        e.target) as EventTarget | null;

      if (
        isEditableTarget(e.target) ||
        isEditableTarget(originTarget) ||
        isEditableTarget(shadowActive) ||
        isInteractiveOverlayWidget(shadowActive)
      ) {
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const step = e.shiftKey ? 10 : 1;
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          onNudge(-step, 0);
          break;
        case 'ArrowRight':
          e.preventDefault();
          onNudge(step, 0);
          break;
        case 'ArrowUp':
          e.preventDefault();
          onNudge(0, -step);
          break;
        case 'ArrowDown':
          e.preventDefault();
          onNudge(0, step);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canNudge, onNudge, portalContainer]);
}
