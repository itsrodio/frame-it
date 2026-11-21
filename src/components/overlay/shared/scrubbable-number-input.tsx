import { cn } from 'cn';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';
import { useScrubbableNumber } from '@/hooks/use-scrubbable-number';

export interface ScrubbableNumberInputProps {
  id: string;
  prefix?: string;
  suffix?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  ariaLabel: string;
  className?: string;
  onChange: (value: number) => void;
}

/**
 * Compact numeric input built on shadcn InputGroup with horizontal scrub-to-adjust on its prefix.
 */
export function ScrubbableNumberInput({
  id,
  prefix,
  suffix,
  value,
  min,
  max,
  step = 1,
  ariaLabel,
  className,
  onChange,
}: ScrubbableNumberInputProps) {
  const {
    isDragging,
    draft,
    handleScrubMouseDown,
    commitDraft,
    handleFocus,
    handleKeyDown,
    handleChange,
  } = useScrubbableNumber({ value, min, max, step, onChange });

  return (
    <InputGroup className={cn('h-7 shadow-none', className)}>
      {prefix && (
        <InputGroupAddon align="inline-start" className="pl-1.5 pr-0">
          <label
            htmlFor={id}
            onMouseDown={handleScrubMouseDown}
            title={i18n.t('guides.fields.scrubHint')}
            className={cn(
              'cursor-ew-resize select-none text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground',
              isDragging && 'text-foreground',
            )}
          >
            {prefix}
          </label>
        </InputGroupAddon>
      )}
      <InputGroupInput
        id={id}
        type="number"
        min={min}
        max={max}
        aria-label={ariaLabel}
        value={draft !== null ? draft : String(value)}
        onFocus={handleFocus}
        onBlur={commitDraft}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        className="px-1.5 text-right font-mono text-xs [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      {suffix && (
        <InputGroupAddon align="inline-end" className="pr-1.5 pl-0">
          <InputGroupText className="text-[10px]">{suffix}</InputGroupText>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}
