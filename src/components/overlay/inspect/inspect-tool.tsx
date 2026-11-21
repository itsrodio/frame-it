import { cn } from 'cn';
import {
  ChevronDown,
  Pin,
  RotateCcw,
  SquareMousePointer,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Toggle } from '@/components/ui/toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { DEFAULT_EXTENSION_SETTINGS } from '@/lib/settings-storage';
import type {
  ExtensionInspectSettings,
  InspectCodeFormat,
  InspectColorFormat,
  InspectUnitFormat,
} from '@/types/settings';

export interface InspectToolProps {
  active: boolean;
  inspectSettings?: ExtensionInspectSettings;
  defaultInspectSettings?: ExtensionInspectSettings;
  onToggle: (active: boolean) => void;
  onUpdateInspectSettings?: (patch: Partial<ExtensionInspectSettings>) => void;
  onResetInspectSettings?: () => void;
}

const CODE_FORMAT_ITEMS: Array<{ value: InspectCodeFormat; label: string }> = [
  { value: 'css', label: 'CSS' },
  { value: 'tailwind', label: 'TW' },
  { value: 'jsx', label: 'JSX' },
];

const COLOR_FORMAT_ITEMS: Array<{ value: InspectColorFormat; label: string }> =
  [
    { value: 'hex', label: 'HEX' },
    { value: 'rgb', label: 'RGB' },
    { value: 'oklch', label: 'OKLCH' },
  ];

const UNIT_FORMAT_ITEMS: Array<{ value: InspectUnitFormat; label: string }> = [
  { value: 'px', label: 'px' },
  { value: 'rem', label: 'rem' },
  { value: 'both', label: 'px+rem' },
];

function SegmentedButtonGroup<T extends string>({
  label,
  items,
  value,
  testIdPrefix,
  mono = false,
  onSelect,
}: {
  label: string;
  items: Array<{ value: T; label: string }>;
  value: T;
  testIdPrefix: string;
  mono?: boolean;
  onSelect: (value: T) => void;
}) {
  return (
    <Field orientation="horizontal">
      <FieldLabel className="w-2/5 text-xs text-muted-foreground">
        {label}
      </FieldLabel>
      <div className="grid h-7 w-3/5 grid-cols-3 gap-0.5 rounded-md border border-input bg-muted/30 p-0.5">
        {items.map((item) => {
          const isSelected = value === item.value;
          return (
            <button
              key={item.value}
              type="button"
              aria-pressed={isSelected}
              data-testid={`${testIdPrefix}-${item.value}`}
              onClick={() => onSelect(item.value)}
              className={cn(
                'flex items-center justify-center rounded-xs text-[11px] font-medium transition-colors cursor-pointer',
                mono && 'font-mono',
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </Field>
  );
}

function isInspectSettingsModified(
  current: ExtensionInspectSettings,
  defaults: ExtensionInspectSettings,
): boolean {
  return (
    current.codeFormat !== defaults.codeFormat ||
    current.colorFormat !== defaults.colorFormat ||
    current.unitFormat !== defaults.unitFormat ||
    current.cardPlacement !== defaults.cardPlacement ||
    current.showPadding !== defaults.showPadding ||
    current.showMargin !== defaults.showMargin ||
    current.showGap !== defaults.showGap
  );
}

export function InspectTool({
  active,
  inspectSettings = DEFAULT_EXTENSION_SETTINGS.inspect,
  defaultInspectSettings = DEFAULT_EXTENSION_SETTINGS.inspect,
  onToggle,
  onUpdateInspectSettings,
  onResetInspectSettings,
}: InspectToolProps) {
  const [open, setOpen] = useState(false);
  const canReset = isInspectSettingsModified(
    inspectSettings,
    defaultInspectSettings,
  );
  const isPinned = inspectSettings.cardPlacement === 'pinned';

  const handleReset = () => {
    if (onResetInspectSettings) {
      onResetInspectSettings();
    } else {
      onUpdateInspectSettings?.(defaultInspectSettings);
    }
  };

  return (
    <div className="flex items-center">
      <Tooltip>
        <TooltipTrigger
          render={
            <Toggle
              aria-label={i18n.t('dock.inspect.ariaLabel')}
              pressed={active}
              onPressedChange={onToggle}
            >
              <SquareMousePointer className="h-4 w-4" />
            </Toggle>
          }
        />
        <TooltipContent className="w-fit whitespace-nowrap">
          {i18n.t('dock.inspect.tooltip')}
        </TooltipContent>
      </Tooltip>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              className="relative px-1"
              data-testid="inspect-popover-trigger"
              aria-label={i18n.t('inspect.settings.title')}
            >
              <ChevronDown className="size-3" />
              {canReset && (
                <span className="absolute top-1 right-0.5 size-1.5 rounded-full bg-primary" />
              )}
            </Button>
          }
        />
        <PopoverContent align="start" className="w-76 p-0">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <SquareMousePointer className="size-3.5 text-muted-foreground" />
              <span>{i18n.t('inspect.settings.title')}</span>
            </div>

            <div className="flex items-center gap-0.5">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={!canReset}
                      data-testid="inspect-popover-reset"
                      className="size-6 text-muted-foreground hover:text-foreground"
                      onClick={handleReset}
                      aria-label={i18n.t('guides.header.resetAriaLabel')}
                    >
                      <RotateCcw className="size-3.5" />
                    </Button>
                  }
                />
                <TooltipContent className="w-fit whitespace-nowrap">
                  {i18n.t('guides.header.resetAriaLabel')}
                </TooltipContent>
              </Tooltip>

              <Button
                variant="ghost"
                size="icon"
                className="size-6 text-muted-foreground hover:text-foreground"
                onClick={() => setOpen(false)}
                aria-label={i18n.t('guides.header.closeAriaLabel')}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* Quick Session Settings Fields */}
          <FieldGroup className="gap-2.5 p-3">
            <SegmentedButtonGroup
              label={i18n.t('inspect.settings.codeFormat')}
              items={CODE_FORMAT_ITEMS}
              value={inspectSettings.codeFormat}
              testIdPrefix="dock-inspect-code"
              onSelect={(codeFormat) =>
                onUpdateInspectSettings?.({ codeFormat })
              }
            />

            <SegmentedButtonGroup
              label={i18n.t('inspect.settings.colorFormat')}
              items={COLOR_FORMAT_ITEMS}
              value={inspectSettings.colorFormat}
              testIdPrefix="dock-inspect-color"
              onSelect={(colorFormat) =>
                onUpdateInspectSettings?.({ colorFormat })
              }
            />

            <SegmentedButtonGroup
              label={i18n.t('inspect.settings.unitFormat')}
              items={UNIT_FORMAT_ITEMS}
              value={inspectSettings.unitFormat}
              testIdPrefix="dock-inspect-unit"
              mono
              onSelect={(unitFormat) =>
                onUpdateInspectSettings?.({ unitFormat })
              }
            />

            {/* Box Model Overlays */}
            <Field orientation="horizontal">
              <FieldLabel className="w-2/5 text-xs text-muted-foreground">
                {i18n.t('inspect.settings.boxOverlays')}
              </FieldLabel>
              <div className="grid h-7 w-3/5 grid-cols-3 gap-1">
                <Toggle
                  size="sm"
                  variant="outline"
                  data-testid="dock-inspect-padding"
                  pressed={inspectSettings.showPadding}
                  onPressedChange={(showPadding) =>
                    onUpdateInspectSettings?.({ showPadding })
                  }
                  className="h-7 px-1 text-[11px]"
                >
                  {i18n.t('inspect.settings.showPadding')}
                </Toggle>
                <Toggle
                  size="sm"
                  variant="outline"
                  data-testid="dock-inspect-margin"
                  pressed={inspectSettings.showMargin}
                  onPressedChange={(showMargin) =>
                    onUpdateInspectSettings?.({ showMargin })
                  }
                  className="h-7 px-1 text-[11px]"
                >
                  {i18n.t('inspect.settings.showMargin')}
                </Toggle>
                <Toggle
                  size="sm"
                  variant="outline"
                  data-testid="dock-inspect-gap"
                  aria-label={i18n.t('inspect.settings.showGap')}
                  pressed={inspectSettings.showGap}
                  onPressedChange={(showGap) =>
                    onUpdateInspectSettings?.({ showGap })
                  }
                  className="h-7 px-1 text-[11px]"
                >
                  Gap
                </Toggle>
              </div>
            </Field>

            {/* Card Position */}
            <Field orientation="horizontal">
              <FieldLabel className="w-2/5 text-xs text-muted-foreground">
                {i18n.t('inspect.settings.cardPlacement')}
              </FieldLabel>
              <div className="flex w-3/5 items-center gap-1">
                <Toggle
                  size="sm"
                  variant="outline"
                  data-testid="dock-inspect-placement"
                  pressed={isPinned}
                  onPressedChange={(pinned) =>
                    onUpdateInspectSettings?.({
                      cardPlacement: pinned ? 'pinned' : 'floating',
                    })
                  }
                  className="h-7 w-full gap-1.5 px-2 text-xs"
                >
                  <Pin className="size-3 shrink-0" />
                  <span className="truncate">
                    {isPinned
                      ? i18n.t('inspect.settings.placementPinned')
                      : i18n.t('inspect.settings.placementFloating')}
                  </span>
                </Toggle>
              </div>
            </Field>
          </FieldGroup>
        </PopoverContent>
      </Popover>
    </div>
  );
}
