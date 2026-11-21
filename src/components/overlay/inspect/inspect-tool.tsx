import { ChevronDown, Pin, RotateCcw, SquareMousePointer } from 'lucide-react';
import { useState } from 'react';
import {
  SegmentedControl,
  type SegmentedControlItem,
} from '@/components/overlay/shared/segmented-control';
import { ToolPopoverHeader } from '@/components/overlay/shared/tool-popover-header';
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

const CODE_FORMAT_ITEMS: Array<SegmentedControlItem<InspectCodeFormat>> = [
  { value: 'css', label: 'CSS' },
  { value: 'tailwind', label: 'TW' },
  { value: 'jsx', label: 'JSX' },
];

const COLOR_FORMAT_ITEMS: Array<SegmentedControlItem<InspectColorFormat>> = [
  { value: 'hex', label: 'HEX' },
  { value: 'rgb', label: 'RGB' },
  { value: 'oklch', label: 'OKLCH' },
];

const UNIT_FORMAT_ITEMS: Array<SegmentedControlItem<InspectUnitFormat>> = [
  { value: 'px', label: 'px' },
  { value: 'rem', label: 'rem' },
  { value: 'both', label: 'px+rem' },
];

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
          <ToolPopoverHeader
            title={
              <>
                <SquareMousePointer className="size-3.5 text-muted-foreground" />
                <span>{i18n.t('inspect.settings.title')}</span>
              </>
            }
            onClose={() => setOpen(false)}
            actions={
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
            }
          />

          <FieldGroup className="gap-2.5 p-3">
            <Field orientation="horizontal">
              <FieldLabel className="w-2/5 text-xs text-muted-foreground">
                {i18n.t('inspect.settings.codeFormat')}
              </FieldLabel>
              <div className="w-3/5">
                <SegmentedControl
                  items={CODE_FORMAT_ITEMS}
                  value={inspectSettings.codeFormat}
                  testIdPrefix="dock-inspect-code"
                  fullWidth
                  onValueChange={(codeFormat) =>
                    onUpdateInspectSettings?.({ codeFormat })
                  }
                />
              </div>
            </Field>

            <Field orientation="horizontal">
              <FieldLabel className="w-2/5 text-xs text-muted-foreground">
                {i18n.t('inspect.settings.colorFormat')}
              </FieldLabel>
              <div className="w-3/5">
                <SegmentedControl
                  items={COLOR_FORMAT_ITEMS}
                  value={inspectSettings.colorFormat}
                  testIdPrefix="dock-inspect-color"
                  fullWidth
                  onValueChange={(colorFormat) =>
                    onUpdateInspectSettings?.({ colorFormat })
                  }
                />
              </div>
            </Field>

            <Field orientation="horizontal">
              <FieldLabel className="w-2/5 text-xs text-muted-foreground">
                {i18n.t('inspect.settings.unitFormat')}
              </FieldLabel>
              <div className="w-3/5">
                <SegmentedControl
                  items={UNIT_FORMAT_ITEMS}
                  value={inspectSettings.unitFormat}
                  testIdPrefix="dock-inspect-unit"
                  mono
                  fullWidth
                  onValueChange={(unitFormat) =>
                    onUpdateInspectSettings?.({ unitFormat })
                  }
                />
              </div>
            </Field>

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
