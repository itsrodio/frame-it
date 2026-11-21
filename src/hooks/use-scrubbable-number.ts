import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseScrubbableNumberOptions {
  value: number;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}

/**
 * Shared state and event handlers for scrubbable numeric inputs
 * (horizontal pointer drag on label, Shift x10 multiplier, arrow keys, and draft editing).
 */
export function useScrubbableNumber({
  value,
  min,
  max,
  step = 1,
  disabled = false,
  onChange,
}: UseScrubbableNumberOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const dragStartRef = useRef<{ startX: number; startVal: number } | null>(
    null,
  );

  const clamp = useCallback(
    (val: number) => Math.min(max, Math.max(min, Math.round(val))),
    [max, min],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const deltaX = e.clientX - dragStartRef.current.startX;
      const multiplier = e.shiftKey ? 10 : 1;
      const deltaSteps = Math.round(deltaX / 2) * step * multiplier;
      const nextVal = clamp(dragStartRef.current.startVal + deltaSteps);
      setDraft(null);
      onChange(nextVal);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [clamp, isDragging, onChange, step]);

  const handleScrubMouseDown = (e: React.MouseEvent) => {
    if (disabled || e.button !== 0) return;
    e.preventDefault();
    dragStartRef.current = { startX: e.clientX, startVal: value };
    setIsDragging(true);
  };

  const commitDraft = () => {
    if (draft === null) return;
    const trimmed = draft.trim();
    if (trimmed !== '' && trimmed !== '-') {
      const parsed = Number(trimmed);
      if (!Number.isNaN(parsed)) {
        onChange(clamp(parsed));
      }
    }
    setDraft(null);
  };

  const handleFocus = () => {
    setDraft(String(value));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const dir = e.key === 'ArrowUp' ? 1 : -1;
      const multiplier = e.shiftKey ? 10 : 1;
      const nextVal = clamp(value + dir * step * multiplier);
      setDraft(String(nextVal));
      onChange(nextVal);
    } else if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setDraft(null);
      e.currentTarget.blur();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDraft(raw);
    const trimmed = raw.trim();
    if (trimmed === '' || trimmed === '-') return;
    const parsed = Number(trimmed);
    if (!Number.isNaN(parsed) && parsed >= min && parsed <= max) {
      onChange(Math.round(parsed));
    }
  };

  return {
    isDragging,
    draft,
    handleScrubMouseDown,
    commitDraft,
    handleFocus,
    handleKeyDown,
    handleChange,
  };
}
