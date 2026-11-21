import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { DesignOverlayState } from '@/types/design-overlay';

export interface DesignOverlayLayerProps {
  state: DesignOverlayState;
  scroll: { x: number; y: number };
  isInteractiveAllowed: boolean;
  onMove: (x: number, y: number) => void;
}

function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    const [header, data] = dataUrl.split(',');
    if (!header || !data) return null;
    const mimeMatch = /data:([^;]+)/.exec(header);
    const mime = mimeMatch?.[1] ?? 'image/png';
    if (header.includes(';base64')) {
      const binary = window.atob(data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new Blob([bytes], { type: mime });
    }
    return new Blob([decodeURIComponent(data)], { type: mime });
  } catch {
    return null;
  }
}

interface DragOrigin {
  clientX: number;
  clientY: number;
  startX: number;
  startY: number;
}

function computeDragPosition(
  origin: DragOrigin,
  clientX: number,
  clientY: number,
  shiftKey: boolean,
): { x: number; y: number; axis: 'x' | 'y' | null } {
  const dx = clientX - origin.clientX;
  const dy = clientY - origin.clientY;
  if (!shiftKey) {
    return {
      x: Math.round(origin.startX + dx),
      y: Math.round(origin.startY + dy),
      axis: null,
    };
  }
  if (Math.abs(dx) >= Math.abs(dy)) {
    return {
      x: Math.round(origin.startX + dx),
      y: Math.round(origin.startY),
      axis: 'x',
    };
  }
  return {
    x: Math.round(origin.startX),
    y: Math.round(origin.startY + dy),
    axis: 'y',
  };
}

export function DesignOverlayLayer({
  state,
  scroll,
  isInteractiveAllowed,
  onMove,
}: DesignOverlayLayerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [lockedAxis, setLockedAxis] = useState<'x' | 'y' | null>(null);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  const layerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragStartRef = useRef<DragOrigin | null>(null);
  const lastPointerRef = useRef<{ clientX: number; clientY: number } | null>(
    null,
  );

  const imageUrl = state.imageUrl;
  const useCanvasFallback = Boolean(imageUrl && fallbackUrl === imageUrl);

  useEffect(() => {
    if (!useCanvasFallback || !imageUrl || !canvasRef.current) return;
    if (typeof createImageBitmap !== 'function') return;

    const blob = dataUrlToBlob(imageUrl);
    if (!blob) return;

    let cancelled = false;
    createImageBitmap(blob)
      .then((bitmap) => {
        if (cancelled || !canvasRef.current) {
          bitmap.close();
          return;
        }
        const canvas = canvasRef.current;
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
        ctx?.drawImage(bitmap, 0, 0);
        bitmap.close();
      })
      .catch(() => {
        // Ignore fallback bitmap decode errors
      });

    return () => {
      cancelled = true;
    };
  }, [imageUrl, useCanvasFallback]);

  useEffect(() => {
    if (!isDragging) return;

    const applyDrag = (clientX: number, clientY: number, shiftKey: boolean) => {
      if (!dragStartRef.current) return;
      const next = computeDragPosition(
        dragStartRef.current,
        clientX,
        clientY,
        shiftKey,
      );
      setLockedAxis(next.axis);
      onMove(next.x, next.y);
    };

    const handleMouseMove = (e: MouseEvent) => {
      lastPointerRef.current = { clientX: e.clientX, clientY: e.clientY };
      applyDrag(e.clientX, e.clientY, e.shiftKey);
    };

    const handleShiftChange = (e: KeyboardEvent) => {
      if (e.key !== 'Shift' || !lastPointerRef.current) return;
      applyDrag(
        lastPointerRef.current.clientX,
        lastPointerRef.current.clientY,
        e.shiftKey,
      );
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setLockedAxis(null);
      dragStartRef.current = null;
      lastPointerRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleShiftChange);
    window.addEventListener('keyup', handleShiftChange);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleShiftChange);
      window.removeEventListener('keyup', handleShiftChange);
    };
  }, [isDragging, onMove]);

  const canDrag = !state.locked && isInteractiveAllowed;
  const renderX = state.x - (state.followScroll ? scroll.x : 0);
  const renderY = state.y - (state.followScroll ? scroll.y : 0);
  const scaledWidth = Math.round(state.naturalWidth * state.scale);
  const scaledHeight = Math.round(state.naturalHeight * state.scale);

  useEffect(() => {
    const el = layerRef.current;
    if (!el || !canDrag) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      dragStartRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        startX: state.x,
        startY: state.y,
      };
      lastPointerRef.current = { clientX: e.clientX, clientY: e.clientY };
      setLockedAxis(null);
      setIsDragging(true);
    };

    el.addEventListener('mousedown', handleMouseDown);
    return () => el.removeEventListener('mousedown', handleMouseDown);
  }, [canDrag, state.x, state.y]);

  if (!state.enabled || !imageUrl) {
    return null;
  }

  // Mount the blended image layer directly on document.body outside frameit-overlay's
  // isolated stacking context so CSS mix-blend-mode: difference blends against the webpage.
  const portalTarget =
    typeof document !== 'undefined'
      ? (document.body ?? document.documentElement)
      : null;

  const imageLayer = (
    <div
      ref={layerRef}
      data-frameit-design-overlay="true"
      data-testid="design-overlay-layer"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: state.naturalWidth > 0 ? `${state.naturalWidth}px` : 'auto',
        height: state.naturalHeight > 0 ? `${state.naturalHeight}px` : 'auto',
        transform: `translate3d(${renderX}px, ${renderY}px, 0) scale(${state.scale})`,
        transformOrigin: 'top left',
        opacity: state.opacity / 100,
        mixBlendMode: state.blendMode,
        pointerEvents: canDrag ? 'auto' : 'none',
        cursor: canDrag ? (isDragging ? 'grabbing' : 'grab') : 'default',
        zIndex: 2147483646,
        userSelect: 'none',
      }}
    >
      {useCanvasFallback ? (
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        />
      ) : (
        <img
          src={imageUrl}
          alt={state.fileName ?? 'Design overlay mockup'}
          draggable={false}
          onError={() => setFallbackUrl(imageUrl)}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            maxWidth: 'none',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        />
      )}
    </div>
  );

  return (
    <>
      {portalTarget ? createPortal(imageLayer, portalTarget) : imageLayer}

      {/* Unlocked boundary guide & live coordinate HUD inside Shadow DOM */}
      {canDrag && scaledWidth > 0 && scaledHeight > 0 && (
        <div
          data-testid="design-overlay-unlocked-frame"
          className="fixed top-0 left-0 pointer-events-none border border-dashed border-primary/80"
          style={{
            width: `${scaledWidth}px`,
            height: `${scaledHeight}px`,
            transform: `translate3d(${renderX}px, ${renderY}px, 0)`,
          }}
        >
          <div className="absolute -top-6 left-0 flex items-center gap-1.5 rounded bg-primary px-1.5 py-0.5 font-mono text-[10px] font-medium text-primary-foreground shadow-sm whitespace-nowrap">
            <span>
              {state.x}, {state.y}
            </span>
            {lockedAxis && <span>{lockedAxis === 'x' ? '↔' : '↕'}</span>}
            <span className="opacity-75">·</span>
            <span>{Math.round(state.scale * 100)}%</span>
          </div>
        </div>
      )}
    </>
  );
}
