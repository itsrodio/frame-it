import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { getMaxWidthPresets } from './constants';

export interface MaxSizeFieldProps {
  isColumns: boolean;
  maxSize: number | null;
  onChange: (maxSize: number | null) => void;
}

export function MaxSizeField({
  isColumns,
  maxSize,
  onChange,
}: MaxSizeFieldProps) {
  const [maxSizeDraft, setMaxSizeDraft] = useState<string | null>(null);
  const maxWidthPresets = getMaxWidthPresets();

  const commitMaxSizeDraft = () => {
    if (maxSizeDraft === null) return;
    const trimmed = maxSizeDraft.trim();
    if (!trimmed) {
      onChange(null);
      setMaxSizeDraft(null);
      return;
    }
    const num = Number(trimmed);
    if (!Number.isNaN(num)) {
      onChange(Math.max(60, Math.round(num)));
    }
    setMaxSizeDraft(null);
  };

  return (
    <Field orientation="horizontal">
      <FieldLabel
        htmlFor="guide-max-size"
        className="w-2/5 text-xs text-muted-foreground"
        title={i18n.t('guides.fields.maxSizeTooltip')}
      >
        {isColumns
          ? i18n.t('guides.fields.maxWidth')
          : i18n.t('guides.fields.maxHeight')}
      </FieldLabel>
      <div className="flex w-3/5 items-center gap-1">
        <Input
          id="guide-max-size"
          type="number"
          min={60}
          placeholder={i18n.t('guides.fields.maxSizePlaceholder')}
          value={maxSizeDraft !== null ? maxSizeDraft : (maxSize ?? '')}
          onFocus={() =>
            setMaxSizeDraft(maxSize !== null ? String(maxSize) : '')
          }
          onBlur={commitMaxSizeDraft}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            } else if (e.key === 'Escape') {
              setMaxSizeDraft(null);
              e.currentTarget.blur();
            }
          }}
          onChange={(e) => {
            const raw = e.target.value;
            setMaxSizeDraft(raw);
            const trimmed = raw.trim();
            if (!trimmed) {
              onChange(null);
              return;
            }
            const num = Number(trimmed);
            if (!Number.isNaN(num) && num >= 60) {
              onChange(Math.round(num));
            }
          }}
          className="h-7 w-full text-xs"
        />
        {isColumns && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="icon-xs"
                  className="h-7 w-6 shrink-0"
                  aria-label={i18n.t('guides.fields.maxWidthPresetsAriaLabel')}
                >
                  <ChevronDown className="size-3 text-muted-foreground" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-44">
              {maxWidthPresets.map((preset) => (
                <DropdownMenuItem
                  key={preset.label}
                  onClick={() => {
                    setMaxSizeDraft(null);
                    onChange(preset.value);
                  }}
                  className="flex items-center justify-between text-xs"
                >
                  <span>{preset.label}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {preset.sublabel}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </Field>
  );
}
