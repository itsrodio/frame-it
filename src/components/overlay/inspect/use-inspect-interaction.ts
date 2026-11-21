import { useEffect, useRef, useState } from 'react';
import { isEditableTarget, isOverlayElement } from '@/lib/dom-utils';

export interface UseInspectInteractionOptions {
  active: boolean;
  onSnapToElement?: (el: HTMLElement) => void;
  onCancel?: () => void;
}

export function useInspectInteraction({
  active,
  onSnapToElement,
  onCancel,
}: UseInspectInteractionOptions) {
  const [selectedEl, setSelectedEl] = useState<HTMLElement | null>(null);
  const [hoveredEl, setHoveredEl] = useState<HTMLElement | null>(null);
  const [isAltPressed, setIsAltPressed] = useState(false);
  const [, setTick] = useState(0);

  const activeRef = useRef(active);
  activeRef.current = active;

  const selectedElRef = useRef<HTMLElement | null>(selectedEl);
  selectedElRef.current = selectedEl;

  const isAltPressedRef = useRef(isAltPressed);
  isAltPressedRef.current = isAltPressed;

  useEffect(() => {
    if (!active) {
      setSelectedEl(null);
      setHoveredEl(null);
    }
  }, [active]);

  useEffect(() => {
    let moveRafId: number | null = null;
    let layoutRafId: number | null = null;
    let pendingPoint: { x: number; y: number } | null = null;

    const updateAltState = (pressed: boolean) => {
      if (isAltPressedRef.current === pressed) return;
      isAltPressedRef.current = pressed;
      setIsAltPressed(pressed);
      if (!pressed && !activeRef.current) {
        setHoveredEl(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;

      if (e.key === 'Alt') {
        updateAltState(true);
      } else if (e.key === 'Escape') {
        if (selectedElRef.current) {
          e.preventDefault();
          setSelectedEl(null);
        } else if (activeRef.current && onCancel) {
          e.preventDefault();
          onCancel();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        updateAltState(false);
      }
    };

    const handleBlur = () => {
      updateAltState(false);
    };

    const processMouseMove = () => {
      moveRafId = null;
      if (!pendingPoint) return;

      const target = document.elementFromPoint(pendingPoint.x, pendingPoint.y);
      if (
        !target ||
        !(target instanceof HTMLElement) ||
        isOverlayElement(target)
      ) {
        setHoveredEl(null);
        return;
      }
      setHoveredEl((prev) => (prev === target ? prev : target));
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!activeRef.current && !e.altKey && !isAltPressedRef.current) return;
      if (e.altKey !== isAltPressedRef.current) {
        updateAltState(e.altKey);
      }

      pendingPoint = { x: e.clientX, y: e.clientY };
      if (moveRafId === null) {
        moveRafId = window.requestAnimationFrame(processMouseMove);
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (!activeRef.current && !e.altKey) return;
      const target = e.target as Element | null;
      if (isOverlayElement(target) || !(target instanceof HTMLElement)) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      if (e.shiftKey && onSnapToElement) {
        onSnapToElement(target);
        return;
      }

      setSelectedEl((prev) => (prev === target ? null : target));
    };

    const handleScrollOrResize = () => {
      if (!activeRef.current && !isAltPressedRef.current) return;
      if (layoutRafId !== null) return;
      layoutRafId = window.requestAnimationFrame(() => {
        layoutRafId = null;
        setTick((t) => t + 1);
      });
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('mousemove', handleMouseMove, true);
    window.addEventListener('click', handleClick, true);
    window.addEventListener('scroll', handleScrollOrResize, {
      passive: true,
      capture: true,
    });
    window.addEventListener('resize', handleScrollOrResize, { passive: true });

    return () => {
      if (moveRafId !== null) window.cancelAnimationFrame(moveRafId);
      if (layoutRafId !== null) window.cancelAnimationFrame(layoutRafId);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('mousemove', handleMouseMove, true);
      window.removeEventListener('click', handleClick, true);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [onCancel, onSnapToElement]);

  return {
    selectedEl,
    hoveredEl,
    isAltPressed,
  };
}
