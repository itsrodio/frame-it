import { cn } from 'cn';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useScrubbableNumber } from '@/hooks/use-scrubbable-number';

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
  const {
    isDragging,
    draft,
    handleScrubMouseDown,
    commitDraft,
    handleFocus,
    handleKeyDown,
    handleChange,
  } = useScrubbableNumber({ value, min, max, step, disabled, onChange });

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
        onMouseDown={handleScrubMouseDown}
        title={disabled ? undefined : i18n.t('guides.fields.scrubHint')}
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
              handleFocus();
            }
          }}
          onBlur={commitDraft}
          onKeyDown={handleKeyDown}
          onChange={(e) => {
            if (!showTextValue) {
              handleChange(e);
            }
          }}
          className="h-7 w-full text-xs disabled:opacity-50"
        />
        {rightAdornment}
      </div>
    </Field>
  );
}
