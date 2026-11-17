import { cn } from 'cn';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export interface ScrubbableNumberFieldProps {
  id: string;
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  displayValue?: string;
  onChange: (value: number) => void;
  rightAdornment?: React.ReactNode;
}

export function ScrubbableNumberField({
  id,
  label,
  value,
  min = -9999,
  max = 9999,
  step = 1,
  disabled = false,
  displayValue,
  onChange,
  rightAdornment,
}: ScrubbableNumberFieldProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const dragStartRef = useRef<{ startX: number; startVal: number } | null>(
    null,
  );

  const clamp = useCallback(
    (val: number) => Math.min(max, Math.max(min, val)),
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

  const handleLabelMouseDown = (e: React.MouseEvent) => {
    if (disabled || e.button !== 0) return;
    e.preventDefault();
    dragStartRef.current = { startX: e.clientX, startVal: value };
    setIsDragging(true);
  };

  const commitDraft = () => {
    if (draft === null) return;
    const trimmed = draft.trim();
    if (trimmed === '' || trimmed === '-') {
      setDraft(null);
      return;
    }
    const parsed = Number(trimmed);
    if (!Number.isNaN(parsed)) {
      onChange(clamp(Math.round(parsed)));
    }
    setDraft(null);
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

  const showTextValue = displayValue !== undefined;
  const inputValue = showTextValue
    ? displayValue
    : draft !== null
      ? draft
      : String(value);

  return (
    <Field orientation="horizontal">
      <FieldLabel
        htmlFor={id}
        onMouseDown={handleLabelMouseDown}
        title={
          disabled
            ? undefined
            : 'Drag horizontally to adjust (hold Shift for 10x)'
        }
        className={cn(
          'w-2/5 text-xs text-muted-foreground select-none',
          !disabled &&
            'cursor-ew-resize hover:text-foreground transition-colors',
          isDragging && 'text-foreground font-medium',
        )}
      >
        {label}
      </FieldLabel>

      <div className="relative flex w-3/5 items-center gap-1">
        <Input
          id={id}
          type={showTextValue ? 'text' : 'number'}
          min={showTextValue ? undefined : min}
          max={showTextValue ? undefined : max}
          disabled={disabled}
          value={inputValue}
          onFocus={() => {
            if (!showTextValue) {
              setDraft(String(value));
            }
          }}
          onBlur={commitDraft}
          onKeyDown={handleKeyDown}
          onChange={(e) => {
            if (showTextValue) return;
            const raw = e.target.value;
            setDraft(raw);
            const trimmed = raw.trim();
            if (trimmed === '' || trimmed === '-') return;
            const parsed = Number(trimmed);
            if (!Number.isNaN(parsed) && parsed >= min && parsed <= max) {
              onChange(Math.round(parsed));
            }
          }}
          className="h-7 w-full text-xs disabled:opacity-50"
        />
        {rightAdornment}
      </div>
    </Field>
  );
}
