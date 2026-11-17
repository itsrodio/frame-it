import { ChevronDown, Link2Off, Lock, Scroll } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import type {
  GuideAlignment,
  LinearGuideSettings,
} from '@/types/layout-guides';
import {
  ColorOpacityField,
  type ColorOpacityFieldProps,
} from './color-opacity-field';
import {
  COLUMN_ALIGNMENTS,
  MAX_WIDTH_PRESETS,
  ROW_ALIGNMENTS,
} from './constants';
import { ScrubbableNumberField } from './scrubbable-number-field';

export interface LinearGuideFieldsProps extends ColorOpacityFieldProps {
  mode: 'columns' | 'rows';
  settings: LinearGuideSettings;
  trackedElementLabel?: string | null;
  onClearTrackedElement?: () => void;
  onChange: (patch: Partial<LinearGuideSettings>) => void;
}

export function LinearGuideFields({
  mode,
  settings,
  trackedElementLabel,
  onClearTrackedElement,
  onChange,
  ...colorProps
}: LinearGuideFieldsProps) {
  const isColumns = mode === 'columns';
  const isStretch = settings.alignment === 'stretch';
  const alignments = isColumns ? COLUMN_ALIGNMENTS : ROW_ALIGNMENTS;
  const [maxSizeDraft, setMaxSizeDraft] = useState<string | null>(null);

  const handleAlignmentChange = (alignment: GuideAlignment) => {
    onChange({
      alignment,
      itemSize: alignment === 'stretch' ? null : (settings.itemSize ?? 64),
    });
  };

  const commitMaxSizeDraft = () => {
    if (maxSizeDraft === null) return;
    const trimmed = maxSizeDraft.trim();
    if (!trimmed) {
      onChange({ maxSize: null });
      setMaxSizeDraft(null);
      return;
    }
    const num = Number(trimmed);
    if (!Number.isNaN(num)) {
      onChange({ maxSize: Math.max(60, Math.round(num)) });
    }
    setMaxSizeDraft(null);
  };

  return (
    <>
      {isColumns && trackedElementLabel && (
        <div className="mb-1 flex items-center justify-between gap-1.5 rounded-md border border-primary/25 bg-primary/10 px-2 py-1 text-[11px]">
          <div className="flex min-w-0 items-center gap-1">
            <span className="size-1.5 shrink-0 rounded-full bg-primary" />
            <span className="truncate font-mono text-foreground">
              {trackedElementLabel}
            </span>
          </div>
          {onClearTrackedElement && (
            <Button
              variant="ghost"
              size="icon-xs"
              className="size-5 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={onClearTrackedElement}
              title="Unlink from element"
              aria-label="Unlink from element"
            >
              <Link2Off className="size-3" />
            </Button>
          )}
        </div>
      )}

      <ScrubbableNumberField
        id="guide-count"
        label="Count"
        value={settings.count}
        min={1}
        max={48}
        onChange={(count) => onChange({ count })}
      />

      <ColorOpacityField {...colorProps} />

      <Field orientation="horizontal">
        <FieldLabel
          htmlFor="guide-alignment"
          className="w-2/5 text-xs text-muted-foreground"
        >
          Type
        </FieldLabel>
        <div className="w-3/5">
          <Select
            items={alignments}
            value={settings.alignment}
            onValueChange={(val) =>
              handleAlignmentChange(val as GuideAlignment)
            }
          >
            <SelectTrigger id="guide-alignment" className="h-7 w-full text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {alignments.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </Field>

      {/* Max Width / Height контейнера сетки (решает проблему растяжения Stretch на весь монитор) */}
      <Field orientation="horizontal">
        <FieldLabel
          htmlFor="guide-max-size"
          className="w-2/5 text-xs text-muted-foreground"
          title="Maximum container width for the grid (e.g. 1280px)"
        >
          {isColumns ? 'Max W' : 'Max H'}
        </FieldLabel>
        <div className="flex w-3/5 items-center gap-1">
          <Input
            id="guide-max-size"
            type="number"
            min={60}
            placeholder="Auto (100%)"
            value={
              maxSizeDraft !== null ? maxSizeDraft : (settings.maxSize ?? '')
            }
            onFocus={() =>
              setMaxSizeDraft(
                settings.maxSize !== null ? String(settings.maxSize) : '',
              )
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
                onChange({ maxSize: null });
                return;
              }
              const num = Number(trimmed);
              if (!Number.isNaN(num) && num >= 60) {
                onChange({ maxSize: Math.round(num) });
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
                    aria-label="Max width presets"
                  >
                    <ChevronDown className="size-3 text-muted-foreground" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-44">
                {MAX_WIDTH_PRESETS.map((preset) => (
                  <DropdownMenuItem
                    key={preset.label}
                    onClick={() => {
                      setMaxSizeDraft(null);
                      onChange({ maxSize: preset.value });
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

      <ScrubbableNumberField
        id="guide-item-size"
        label={isColumns ? 'Width' : 'Height'}
        value={settings.itemSize ?? 64}
        min={1}
        max={2000}
        disabled={isStretch}
        displayValue={isStretch ? 'Auto' : undefined}
        onChange={(itemSize) => onChange({ itemSize })}
      />

      <ScrubbableNumberField
        id="guide-margin"
        label="Margin"
        value={settings.margin}
        min={0}
        max={1000}
        onChange={(margin) => onChange({ margin })}
      />

      <ScrubbableNumberField
        id="guide-gutter"
        label="Gutter"
        value={settings.gutter}
        min={0}
        max={500}
        onChange={(gutter) => onChange({ gutter })}
      />

      <ScrubbableNumberField
        id="guide-offset"
        label="Offset"
        value={settings.offset}
        min={-2000}
        max={2000}
        onChange={(offset) => onChange({ offset })}
      />

      <Field orientation="horizontal">
        <FieldLabel className="w-2/5 text-xs text-muted-foreground">
          Position
        </FieldLabel>
        <div className="flex w-3/5 items-center gap-1">
          <Toggle
            size="sm"
            variant="outline"
            pressed={settings.followScroll}
            onPressedChange={(followScroll) => onChange({ followScroll })}
            className="h-7 w-full text-xs gap-1.5"
          >
            {settings.followScroll ? (
              <>
                <Scroll className="size-3" />
                Scroll with page
              </>
            ) : (
              <>
                <Lock className="size-3" />
                Fixed to viewport
              </>
            )}
          </Toggle>
        </div>
      </Field>
    </>
  );
}
