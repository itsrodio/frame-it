import { cn } from 'cn';
import {
  Blend,
  ChevronDown,
  Crosshair,
  Image as ImageIcon,
  Lock,
  Maximize2,
  RotateCcw,
  Scroll,
  Trash2,
  Unlock,
  Upload,
  WandSparkles,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
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

const SCALE_PRESETS: Array<{ value: number; label: string }> = [
  { value: 0.5, label: '0.5x' },
  { value: 1, label: '1x' },
  { value: 2, label: '2x' },
];

const BLEND_MODES: Array<{ value: DesignOverlayBlendMode; labelKey: string }> =
  [
    { value: 'normal', labelKey: 'designOverlay.blend.normal' },
    { value: 'difference', labelKey: 'designOverlay.blend.difference' },
  ];

interface CompactNumberBoxProps {
  id: string;
  prefix?: string;
  suffix?: string;
  value: number;
  min: number;
  max: number;
  ariaLabel: string;
  className?: string;
  onChange: (value: number) => void;
}

function CompactNumberBox({
  id,
  prefix,
  suffix,
  value,
  min,
  max,
  ariaLabel,
  className,
  onChange,
}: CompactNumberBoxProps) {
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
      const nextVal = clamp(
        dragStartRef.current.startVal + Math.round(deltaX / 2) * multiplier,
      );
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
  }, [clamp, isDragging, onChange]);

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

  return (
    <div
      className={cn(
        'flex h-7 items-center overflow-hidden rounded-md border border-input bg-transparent px-1.5 focus-within:ring-1 focus-within:ring-ring',
        className,
      )}
    >
      {prefix && (
        <label
          htmlFor={id}
          onMouseDown={(e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            dragStartRef.current = { startX: e.clientX, startVal: value };
            setIsDragging(true);
          }}
          title={i18n.t('guides.fields.scrubHint')}
          className={cn(
            'mr-1 shrink-0 cursor-ew-resize select-none text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground',
            isDragging && 'text-foreground',
          )}
        >
          {prefix}
        </label>
      )}
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        aria-label={ariaLabel}
        value={draft !== null ? draft : String(value)}
        onFocus={() => setDraft(String(value))}
        onBlur={commitDraft}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const dir = e.key === 'ArrowUp' ? 1 : -1;
            const multiplier = e.shiftKey ? 10 : 1;
            const nextVal = clamp(value + dir * multiplier);
            setDraft(String(nextVal));
            onChange(nextVal);
          } else if (e.key === 'Enter') {
            e.currentTarget.blur();
          } else if (e.key === 'Escape') {
            setDraft(null);
            e.currentTarget.blur();
          }
        }}
        onChange={(e) => {
          const raw = e.target.value;
          setDraft(raw);
          const trimmed = raw.trim();
          if (trimmed === '' || trimmed === '-') return;
          const parsed = Number(trimmed);
          if (!Number.isNaN(parsed) && parsed >= min && parsed <= max) {
            onChange(Math.round(parsed));
          }
        }}
        className="h-full min-w-0 flex-1 bg-transparent text-right font-mono text-xs outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      {suffix && (
        <span className="ml-0.5 shrink-0 select-none text-[10px] text-muted-foreground">
          {suffix}
        </span>
      )}
    </div>
  );
}

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

          {/* Header */}
          <div className="flex items-center justify-between border-b px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <ImageIcon className="size-3.5 text-muted-foreground" />
              <span>{i18n.t('designOverlay.header.title')}</span>
            </div>

            <div className="flex items-center gap-0.5">
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
                      aria-label={i18n.t('designOverlay.header.clearAriaLabel')}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  }
                />
                <TooltipContent className="w-fit whitespace-nowrap">
                  {i18n.t('designOverlay.header.clearTooltip')}
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
                {/* Preview, Dimensions & Quick Alignment */}
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
                  <div
                    data-testid="design-overlay-quota-warning"
                    className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-600 dark:text-amber-400"
                  >
                    {i18n.t('designOverlay.storage.quotaWarning')}
                  </div>
                )}

                {/* Position X & Y in one compact row */}
                <Field orientation="horizontal">
                  <FieldLabel className="w-2/5 text-xs text-muted-foreground">
                    {i18n.t('designOverlay.fields.position')}
                  </FieldLabel>
                  <div className="flex w-3/5 items-center gap-1">
                    <CompactNumberBox
                      id="design-overlay-x"
                      prefix="X"
                      value={state.x}
                      min={-10000}
                      max={10000}
                      ariaLabel="X"
                      className="min-w-0 flex-1"
                      onChange={(x) => onPatch({ x })}
                    />
                    <CompactNumberBox
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

                {/* Scale Presets + Custom % in one compact row */}
                <Field orientation="horizontal">
                  <FieldLabel className="w-2/5 text-xs text-muted-foreground">
                    {i18n.t('designOverlay.fields.scale')}
                  </FieldLabel>
                  <div className="flex w-3/5 items-center gap-1">
                    <div className="grid h-7 min-w-0 flex-1 grid-cols-3 gap-0.5 rounded-md border border-input bg-muted/30 p-0.5">
                      {SCALE_PRESETS.map((preset) => {
                        const isSelected =
                          Math.abs(state.scale - preset.value) < 0.001;
                        return (
                          <button
                            key={preset.value}
                            type="button"
                            aria-pressed={isSelected}
                            data-testid={`design-overlay-scale-${preset.value}`}
                            onClick={() => onPatch({ scale: preset.value })}
                            className={cn(
                              'flex items-center justify-center rounded-xs font-mono text-[11px] font-medium transition-colors cursor-pointer',
                              isSelected
                                ? 'bg-primary text-primary-foreground shadow-2xs'
                                : 'text-muted-foreground hover:text-foreground',
                            )}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>

                    <CompactNumberBox
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

                {/* Opacity Slider + % */}
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
                    <CompactNumberBox
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

                {/* Blend Mode */}
                <Field orientation="horizontal">
                  <FieldLabel className="w-2/5 text-xs text-muted-foreground">
                    {i18n.t('designOverlay.fields.blendMode')}
                  </FieldLabel>
                  <div className="grid h-7 w-3/5 grid-cols-2 gap-0.5 rounded-md border border-input bg-muted/30 p-0.5">
                    {BLEND_MODES.map((mode) => {
                      const isSelected = state.blendMode === mode.value;
                      return (
                        <button
                          key={mode.value}
                          type="button"
                          aria-pressed={isSelected}
                          data-testid={`design-overlay-blend-${mode.value}`}
                          onClick={() => onPatch({ blendMode: mode.value })}
                          className={cn(
                            'flex items-center justify-center gap-1 rounded-xs text-[11px] font-medium transition-colors cursor-pointer',
                            isSelected
                              ? 'bg-primary text-primary-foreground shadow-2xs'
                              : 'text-muted-foreground hover:text-foreground',
                          )}
                        >
                          {mode.value === 'difference' && (
                            <Blend className="size-3" />
                          )}
                          <span>{i18n.t(mode.labelKey)}</span>
                        </button>
                      );
                    })}
                  </div>
                </Field>

                {/* Lock & Scroll */}
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

                <Field orientation="horizontal">
                  <FieldLabel className="w-2/5 text-xs text-muted-foreground">
                    {i18n.t('guides.fields.position')}
                  </FieldLabel>
                  <div className="w-3/5">
                    <Toggle
                      size="sm"
                      variant="outline"
                      data-testid="design-overlay-scroll-toggle"
                      pressed={state.followScroll}
                      onPressedChange={(followScroll) =>
                        onPatch({ followScroll })
                      }
                      className="h-7 w-full gap-1.5 text-xs"
                    >
                      {state.followScroll ? (
                        <>
                          <Scroll className="size-3 shrink-0" />
                          <span className="truncate">
                            {i18n.t('guides.position.scrollWithPage')}
                          </span>
                        </>
                      ) : (
                        <>
                          <Lock className="size-3 shrink-0" />
                          <span className="truncate">
                            {i18n.t('guides.position.fixedToViewport')}
                          </span>
                        </>
                      )}
                    </Toggle>
                  </div>
                </Field>
              </FieldGroup>
            )}

            {errorMessage && (
              <div
                data-testid="design-overlay-error"
                className="mt-2 rounded-md border border-destructive/40 bg-destructive/10 px-2.5 py-1.5 text-[11px] text-destructive"
              >
                {errorMessage}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
