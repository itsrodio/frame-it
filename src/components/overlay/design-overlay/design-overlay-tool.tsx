import { cn } from 'cn';
import {
  Blend,
  ChevronDown,
  Crosshair,
  Image as ImageIcon,
  Lock,
  Maximize2,
  RotateCcw,
  Trash2,
  Unlock,
  Upload,
  WandSparkles,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { FollowScrollField } from '@/components/overlay/shared/follow-scroll-field';
import { ScrubbableNumberInput } from '@/components/overlay/shared/scrubbable-number-input';
import { SegmentedControl } from '@/components/overlay/shared/segmented-control';
import { ToolPopoverHeader } from '@/components/overlay/shared/tool-popover-header';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Toggle } from '@/components/ui/toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { clampOpacity, clampScale } from '@/lib/design-overlay-image';
import type {
  DesignOverlayBlendMode,
  DesignOverlayToolProps,
} from '@/types/design-overlay';

const SCALE_PRESETS: Array<{ value: string; label: string; numeric: number }> =
  [
    { value: '0.5', label: '0.5x', numeric: 0.5 },
    { value: '1', label: '1x', numeric: 1 },
    { value: '2', label: '2x', numeric: 2 },
  ];

export function DesignOverlayTool({
  state,
  quotaExceeded,
  isPickingTarget,
  onToggle,
  onPatch,
  onLoadFile,
  onAutoFit,
  onTogglePickTarget,
  onCenterHorizontal,
  onFitToViewportWidth,
  onResetPosition,
  onClear,
}: DesignOverlayToolProps) {
  const [open, setOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const hasImage = Boolean(state.imageUrl);
  const scalePercent = Math.round(state.scale * 100);
  const renderedWidth = Math.round(state.naturalWidth * state.scale);
  const renderedHeight = Math.round(state.naturalHeight * state.scale);

  const matchedScalePreset =
    SCALE_PRESETS.find((p) => Math.abs(state.scale - p.numeric) < 0.001)
      ?.value ?? null;

  const blendModeItems: Array<{
    value: DesignOverlayBlendMode;
    label: React.ReactNode;
  }> = [
    { value: 'normal', label: i18n.t('designOverlay.blend.normal') },
    {
      value: 'difference',
      label: (
        <>
          <Blend className="size-3" />
          <span>{i18n.t('designOverlay.blend.difference')}</span>
        </>
      ),
    },
  ];

  const handleSelectedFile = async (file: File | undefined) => {
    if (!file) return;
    setErrorMessage(null);
    try {
      await onLoadFile(file, file.name);
    } catch {
      setErrorMessage(i18n.t('designOverlay.upload.unsupportedError'));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    void handleSelectedFile(file);
  };

  return (
    <div className="flex items-center">
      <Tooltip>
        <TooltipTrigger
          render={
            <Toggle
              aria-label={i18n.t('dock.designOverlay.toggleAriaLabel')}
              pressed={hasImage && state.enabled}
              onPressedChange={(pressed) => {
                if (!hasImage) {
                  setOpen(true);
                  return;
                }
                onToggle(pressed);
              }}
              className="relative"
            >
              <ImageIcon className="h-4 w-4" />
              {hasImage && (
                <span className="absolute top-1 right-1 size-1.5 rounded-full bg-primary" />
              )}
            </Toggle>
          }
        />
        <TooltipContent className="w-fit whitespace-nowrap">
          {i18n.t('dock.designOverlay.toggleTooltip')}
        </TooltipContent>
      </Tooltip>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              className="px-1"
              data-testid="design-overlay-popover-trigger"
              aria-label={i18n.t('designOverlay.header.settingsAriaLabel')}
            >
              <ChevronDown className="size-3" />
            </Button>
          }
        />

        <PopoverContent
          align="start"
          className="w-76 p-0"
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={(e) => {
            if (e.currentTarget === e.target) {
              setIsDragOver(false);
            }
          }}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            data-testid="design-overlay-file-input"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              void handleSelectedFile(file);
            }}
          />

          <ToolPopoverHeader
            title={
              <>
                <ImageIcon className="size-3.5 text-muted-foreground" />
                <span>{i18n.t('designOverlay.header.title')}</span>
              </>
            }
            onClose={() => setOpen(false)}
            actions={
              <>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={!hasImage}
                        data-testid="design-overlay-auto-fit"
                        className="size-6 text-muted-foreground hover:text-foreground"
                        onClick={onAutoFit}
                        aria-label={i18n.t(
                          'designOverlay.header.autoFitAriaLabel',
                        )}
                      >
                        <WandSparkles className="size-3.5" />
                      </Button>
                    }
                  />
                  <TooltipContent className="w-fit whitespace-nowrap">
                    {i18n.t('designOverlay.header.autoFitTooltip')}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant={isPickingTarget ? 'default' : 'ghost'}
                        size="icon"
                        disabled={!hasImage}
                        data-testid="design-overlay-pick-target"
                        className={cn(
                          'size-6',
                          !isPickingTarget &&
                            'text-muted-foreground hover:text-foreground',
                        )}
                        onClick={() => {
                          setOpen(false);
                          onTogglePickTarget();
                        }}
                        aria-label={i18n.t(
                          'designOverlay.header.pickTargetAriaLabel',
                        )}
                      >
                        <Crosshair className="size-3.5" />
                      </Button>
                    }
                  />
                  <TooltipContent className="w-fit whitespace-nowrap">
                    {i18n.t('designOverlay.header.pickTargetTooltip')}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid="design-overlay-upload-btn"
                        className="size-6 text-muted-foreground hover:text-foreground"
                        onClick={() => fileInputRef.current?.click()}
                        aria-label={i18n.t(
                          'designOverlay.upload.replaceAriaLabel',
                        )}
                      >
                        <Upload className="size-3.5" />
                      </Button>
                    }
                  />
                  <TooltipContent className="w-fit whitespace-nowrap">
                    {i18n.t('designOverlay.upload.replaceTooltip')}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={!hasImage}
                        data-testid="design-overlay-clear-btn"
                        className="size-6 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          setErrorMessage(null);
                          onClear();
                        }}
                        aria-label={i18n.t(
                          'designOverlay.header.clearAriaLabel',
                        )}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    }
                  />
                  <TooltipContent className="w-fit whitespace-nowrap">
                    {i18n.t('designOverlay.header.clearTooltip')}
                  </TooltipContent>
                </Tooltip>
              </>
            }
          />

          <div className="p-3">
            {!hasImage ? (
              <button
                type="button"
                data-testid="design-overlay-dropzone"
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-4 text-center transition-colors',
                  isDragOver
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/60 hover:bg-muted/30',
                )}
              >
                <div className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Upload className="size-4" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs font-medium">
                    {i18n.t('designOverlay.upload.dropTitle')}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {i18n.t('designOverlay.upload.dropSubtitle')}
                  </div>
                </div>
                <div className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                  {i18n.t('designOverlay.upload.pasteHint')}
                </div>
              </button>
            ) : (
              <FieldGroup className="gap-2.5">
                <div
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-md border px-2 py-1.5',
                    isDragOver ? 'border-primary bg-primary/5' : 'bg-muted/30',
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <img
                      src={state.imageUrl ?? undefined}
                      alt=""
                      className="size-7 shrink-0 rounded border object-cover"
                    />
                    <div className="min-w-0">
                      <div className="truncate text-[11px] font-medium">
                        {state.fileName ?? 'design-mockup.png'}
                      </div>
                      <div className="truncate font-mono text-[10px] text-muted-foreground">
                        {state.naturalWidth}×{state.naturalHeight}
                        {renderedWidth !== state.naturalWidth && (
                          <span className="text-foreground/80">
                            {' '}
                            → {renderedWidth}×{renderedHeight}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-0.5">
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="xs"
                            data-testid="design-overlay-center-x"
                            className="h-6 px-1.5 text-[11px]"
                            onClick={onCenterHorizontal}
                          >
                            {i18n.t('designOverlay.fields.centerX')}
                          </Button>
                        }
                      />
                      <TooltipContent className="w-fit whitespace-nowrap">
                        {i18n.t('designOverlay.fields.centerXTooltip')}
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            data-testid="design-overlay-fit-width"
                            className="size-6 text-muted-foreground hover:text-foreground"
                            onClick={onFitToViewportWidth}
                            aria-label={i18n.t(
                              'designOverlay.fields.fitWidthAriaLabel',
                            )}
                          >
                            <Maximize2 className="size-3" />
                          </Button>
                        }
                      />
                      <TooltipContent className="w-fit whitespace-nowrap">
                        {i18n.t('designOverlay.fields.fitWidthTooltip')}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {quotaExceeded && (
                  <Alert
                    data-testid="design-overlay-quota-warning"
                    className="border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-amber-600 dark:text-amber-400"
                  >
                    <AlertDescription className="text-[11px] text-current">
                      {i18n.t('designOverlay.storage.quotaWarning')}
                    </AlertDescription>
                  </Alert>
                )}

                <Field orientation="horizontal">
                  <FieldLabel className="w-2/5 text-xs text-muted-foreground">
                    {i18n.t('designOverlay.fields.position')}
                  </FieldLabel>
                  <div className="flex w-3/5 items-center gap-1">
                    <ScrubbableNumberInput
                      id="design-overlay-x"
                      prefix="X"
                      value={state.x}
                      min={-10000}
                      max={10000}
                      ariaLabel="X"
                      className="min-w-0 flex-1"
                      onChange={(x) => onPatch({ x })}
                    />
                    <ScrubbableNumberInput
                      id="design-overlay-y"
                      prefix="Y"
                      value={state.y}
                      min={-10000}
                      max={50000}
                      ariaLabel="Y"
                      className="min-w-0 flex-1"
                      onChange={(y) => onPatch({ y })}
                    />
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            data-testid="design-overlay-reset-pos"
                            className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
                            onClick={onResetPosition}
                            aria-label={i18n.t(
                              'designOverlay.fields.resetPositionAriaLabel',
                            )}
                          >
                            <RotateCcw className="size-3" />
                          </Button>
                        }
                      />
                      <TooltipContent className="w-fit whitespace-nowrap">
                        {i18n.t('designOverlay.fields.resetPositionTooltip')}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </Field>

                <Field orientation="horizontal">
                  <FieldLabel className="w-2/5 text-xs text-muted-foreground">
                    {i18n.t('designOverlay.fields.scale')}
                  </FieldLabel>
                  <div className="flex w-3/5 items-center gap-1">
                    <div className="min-w-0 flex-1">
                      <SegmentedControl
                        items={SCALE_PRESETS}
                        value={matchedScalePreset}
                        testIdPrefix="design-overlay-scale"
                        mono
                        fullWidth
                        onValueChange={(val) => onPatch({ scale: Number(val) })}
                      />
                    </div>

                    <ScrubbableNumberInput
                      id="design-overlay-scale-pct"
                      suffix="%"
                      value={scalePercent}
                      min={10}
                      max={400}
                      ariaLabel={i18n.t('designOverlay.fields.scalePercent')}
                      className="w-13 shrink-0"
                      onChange={(pct) =>
                        onPatch({ scale: clampScale(pct / 100) })
                      }
                    />
                  </div>
                </Field>

                <Field orientation="horizontal">
                  <FieldLabel
                    htmlFor="design-overlay-opacity"
                    className="w-2/5 text-xs text-muted-foreground"
                  >
                    {i18n.t('designOverlay.fields.opacity')}
                  </FieldLabel>
                  <div className="flex w-3/5 items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <Slider
                        min={0}
                        max={100}
                        step={1}
                        value={[state.opacity]}
                        data-testid="design-overlay-opacity-slider"
                        aria-label={i18n.t(
                          'designOverlay.fields.opacityAriaLabel',
                        )}
                        onValueChange={(nextValue) => {
                          const raw = Array.isArray(nextValue)
                            ? nextValue[0]
                            : nextValue;
                          if (typeof raw === 'number') {
                            onPatch({ opacity: clampOpacity(raw) });
                          }
                        }}
                      />
                    </div>
                    <ScrubbableNumberInput
                      id="design-overlay-opacity"
                      suffix="%"
                      value={state.opacity}
                      min={0}
                      max={100}
                      ariaLabel={i18n.t(
                        'designOverlay.fields.opacityAriaLabel',
                      )}
                      className="w-13 shrink-0"
                      onChange={(opacity) =>
                        onPatch({ opacity: clampOpacity(opacity) })
                      }
                    />
                  </div>
                </Field>

                <Field orientation="horizontal">
                  <FieldLabel className="w-2/5 text-xs text-muted-foreground">
                    {i18n.t('designOverlay.fields.blendMode')}
                  </FieldLabel>
                  <div className="w-3/5">
                    <SegmentedControl
                      items={blendModeItems}
                      value={state.blendMode}
                      testIdPrefix="design-overlay-blend"
                      fullWidth
                      itemClassName="gap-1"
                      onValueChange={(blendMode) => onPatch({ blendMode })}
                    />
                  </div>
                </Field>

                <Field orientation="horizontal">
                  <FieldLabel className="w-2/5 text-xs text-muted-foreground">
                    {i18n.t('designOverlay.fields.interaction')}
                  </FieldLabel>
                  <div className="w-3/5">
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Toggle
                            size="sm"
                            variant="outline"
                            data-testid="design-overlay-lock-toggle"
                            pressed={state.locked}
                            onPressedChange={(locked) => onPatch({ locked })}
                            className="h-7 w-full gap-1.5 text-xs"
                          >
                            {state.locked ? (
                              <>
                                <Lock className="size-3 shrink-0" />
                                <span className="truncate">
                                  {i18n.t('designOverlay.lock.lockedLabel')}
                                </span>
                              </>
                            ) : (
                              <>
                                <Unlock className="size-3 shrink-0" />
                                <span className="truncate">
                                  {i18n.t('designOverlay.lock.unlockedLabel')}
                                </span>
                              </>
                            )}
                          </Toggle>
                        }
                      />
                      <TooltipContent className="w-fit whitespace-nowrap">
                        {state.locked
                          ? i18n.t('designOverlay.lock.unlockTooltip')
                          : i18n.t('designOverlay.lock.lockTooltip')}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </Field>

                <FollowScrollField
                  followScroll={state.followScroll}
                  testId="design-overlay-scroll-toggle"
                  onChange={(followScroll) => onPatch({ followScroll })}
                />
              </FieldGroup>
            )}

            {errorMessage && (
              <Alert
                variant="destructive"
                data-testid="design-overlay-error"
                className="mt-2 border-destructive/40 bg-destructive/10 px-2.5 py-1.5"
              >
                <AlertDescription className="text-[11px] text-destructive">
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
