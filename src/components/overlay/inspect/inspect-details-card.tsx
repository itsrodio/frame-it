import { cn } from 'cn';
import { Check, Copy, Layers, Pin, X } from 'lucide-react';
import {
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ColorInspectField,
  CopyableFieldBox,
  DomBreadcrumbsTitle,
} from '@/components/overlay/inspect/inspect-card-fields';
import type { DomNavDirection } from '@/components/overlay/inspect/use-inspect-interaction';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  buildCodeSnippet,
  buildFigmaSvg,
  formatDimensionWithUnit,
} from '@/lib/inspect-exporters';
import { preloadImagesForFigma } from '@/lib/inspect-figma-svg';
import { calculateInspectCardPosition } from '@/lib/inspect-geometry';
import { extractInspectedStyles } from '@/lib/inspect-styles';
import { DEFAULT_EXTENSION_SETTINGS } from '@/lib/settings-storage';
import type {
  ExtensionInspectSettings,
  InspectCodeFormat,
} from '@/types/settings';

const CODE_FORMAT_LABELS: Record<InspectCodeFormat, string> = {
  css: 'CSS',
  tailwind: 'Tailwind',
  jsx: 'JSX',
};

export interface InspectDetailsCardProps {
  element: HTMLElement;
  rect: DOMRect;
  inspectSettings?: ExtensionInspectSettings;
  onUpdateInspectSettings?: (patch: Partial<ExtensionInspectSettings>) => void;
  onSelectElement?: (el: HTMLElement) => void;
  onNavigateDom?: (direction: DomNavDirection) => void;
  onClose?: () => void;
}

const CARD_WIDTH = 272;
const CARD_MIN_HEIGHT = 120;
const VIEWPORT_MARGIN = 8;

export function InspectDetailsCard({
  element,
  rect,
  inspectSettings = DEFAULT_EXTENSION_SETTINGS.inspect,
  onUpdateInspectSettings,
  onSelectElement,
  onClose,
}: InspectDetailsCardProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [draggedPos, setDraggedPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const timerRef = useRef<number | null>(null);
  const dragSessionRef = useRef<{
    startX: number;
    startY: number;
    initialTop: number;
    initialLeft: number;
  } | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleCopy = useCallback((id: string, text: string) => {
    try {
      void navigator.clipboard?.writeText?.(text);
    } catch {
      // Ignore clipboard errors in restricted contexts
    }
    setCopiedId(id);
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setCopiedId(null);
    }, 1400);
  }, []);

  const styles = extractInspectedStyles(element, rect);
  const isDirectSvg = element.tagName.toLowerCase() === 'svg';
  const figmaSvgPayload = buildFigmaSvg(element, styles, rect);
  const copyPayload = isDirectSvg
    ? figmaSvgPayload
    : buildCodeSnippet(element, styles, inspectSettings.codeFormat);

  const handleCopyFigma = useCallback(async () => {
    const hasImgs =
      element instanceof HTMLImageElement ||
      element.querySelector('img') !== null;
    if (!hasImgs) {
      handleCopy('figma-svg', figmaSvgPayload);
      return;
    }
    const preloaded = await preloadImagesForFigma(element);
    const svgWithImages = buildFigmaSvg(element, styles, rect, preloaded);
    handleCopy('figma-svg', svgWithImages);
  }, [element, figmaSvgPayload, handleCopy, rect, styles]);

  const viewport = {
    width: document.documentElement.clientWidth || window.innerWidth || 1280,
    height: window.innerHeight || 800,
  };
  const autoPosition = calculateInspectCardPosition(
    rect,
    viewport,
    {
      width: CARD_WIDTH,
      height: 320,
    },
    inspectSettings.cardPlacement,
  );
  const position = draggedPos ?? autoPosition;

  const handleDragBarMouseDown = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      dragSessionRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initialTop: position.top,
        initialLeft: position.left,
      };
      setIsDragging(true);
    },
    [position.left, position.top],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const session = dragSessionRef.current;
      if (!session) return;
      const vw =
        document.documentElement.clientWidth || window.innerWidth || 1280;
      const vh = window.innerHeight || 800;
      const dx = e.clientX - session.startX;
      const dy = e.clientY - session.startY;
      const maxLeft = Math.max(
        VIEWPORT_MARGIN,
        vw - CARD_WIDTH - VIEWPORT_MARGIN,
      );
      const maxTop = Math.max(
        VIEWPORT_MARGIN,
        vh - CARD_MIN_HEIGHT - VIEWPORT_MARGIN,
      );
      setDraggedPos({
        left: Math.min(
          maxLeft,
          Math.max(VIEWPORT_MARGIN, Math.round(session.initialLeft + dx)),
        ),
        top: Math.min(
          maxTop,
          Math.max(VIEWPORT_MARGIN, Math.round(session.initialTop + dy)),
        ),
      });
    };

    const handleMouseUp = () => {
      dragSessionRef.current = null;
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const contrastLevel = styles.colors.contrast.level;
  const contrastBadgeClass =
    contrastLevel === 'AAA' || contrastLevel === 'AA'
      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
      : 'bg-destructive/15 text-destructive';

  const isCodeCopied = copiedId === 'all-css';
  const isFigmaCopied = copiedId === 'figma-svg';
  const isSizeCopied = copiedId === 'font-size';
  const isWeightCopied = copiedId === 'font-weight';
  const isPinned = inspectSettings.cardPlacement === 'pinned';

  const fmtUnit = (val: string) =>
    formatDimensionWithUnit(val, inspectSettings.unitFormat);

  const copyTooltipText = isCodeCopied
    ? i18n.t('inspect.card.copied')
    : isDirectSvg
      ? i18n.t('inspect.card.copySvg')
      : `${i18n.t('inspect.card.copyCss')} ${CODE_FORMAT_LABELS[inspectSettings.codeFormat]}`;

  return (
    <div
      data-testid="inspect-details-card"
      className="fixed z-50 flex w-68 flex-col overflow-hidden rounded-xl bg-popover p-0 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 pointer-events-auto"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      {/* Цветная (primary) полоска сверху карточки для перетаскивания без конфликта с кнопками */}
      <div
        role="toolbar"
        data-testid="inspect-card-drag-handle"
        onMouseDown={handleDragBarMouseDown}
        className={cn(
          'group flex h-3 w-full items-center justify-center bg-primary/15 transition-colors hover:bg-primary/25 select-none',
          isDragging ? 'cursor-grabbing bg-primary/35' : 'cursor-grab',
        )}
      >
        <div
          className={cn(
            'h-1 w-10 rounded-full bg-primary/70 transition-all group-hover:w-12 group-hover:bg-primary',
            isDragging && 'w-12 bg-primary',
          )}
        />
      </div>

      {/* Лаконичная шапка: слева путь элемента (родитель › элемент), справа действия (Figma SVG, Copy Code, Pin, Close) */}
      <div className="flex items-center justify-between border-b px-3 py-2">
        <DomBreadcrumbsTitle
          element={element}
          onSelectElement={onSelectElement}
        />

        <div className="flex shrink-0 items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  data-testid="inspect-copy-figma"
                  className={cn(
                    'size-6',
                    isFigmaCopied
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  onClick={() => void handleCopyFigma()}
                  aria-label={i18n.t('inspect.card.copyFigma')}
                >
                  {isFigmaCopied ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Layers className="size-3.5" />
                  )}
                </Button>
              }
            />
            <TooltipContent className="w-fit whitespace-nowrap">
              {isFigmaCopied
                ? i18n.t('inspect.card.copied')
                : i18n.t('inspect.card.copyFigma')}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  data-testid="inspect-copy-css"
                  className={cn(
                    'size-6',
                    isCodeCopied
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  onClick={() => handleCopy('all-css', copyPayload)}
                  aria-label={i18n.t('inspect.card.copyCss')}
                >
                  {isCodeCopied ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  <span className="sr-only">{copyTooltipText}</span>
                </Button>
              }
            />
            <TooltipContent className="w-fit whitespace-nowrap">
              {copyTooltipText}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant={isPinned ? 'default' : 'ghost'}
                  size="icon"
                  data-testid="inspect-toggle-pin"
                  className={cn(
                    'size-6',
                    !isPinned && 'text-muted-foreground hover:text-foreground',
                  )}
                  onClick={() => {
                    setDraggedPos(null);
                    onUpdateInspectSettings?.({
                      cardPlacement: isPinned ? 'floating' : 'pinned',
                    });
                  }}
                  aria-label={
                    isPinned
                      ? i18n.t('inspect.card.floatCard')
                      : i18n.t('inspect.card.pinCard')
                  }
                >
                  <Pin className="size-3.5" />
                </Button>
              }
            />
            <TooltipContent className="w-fit whitespace-nowrap">
              {isPinned
                ? i18n.t('inspect.card.floatCard')
                : i18n.t('inspect.card.pinCard')}
            </TooltipContent>
          </Tooltip>

          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="size-6 text-muted-foreground hover:text-foreground"
              onClick={onClose}
              aria-label={i18n.t('inspect.card.unpinAriaLabel')}
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Поля свойств в едином стиле с LinearGuideFields / GridGuideFields */}
      <FieldGroup className="gap-2 p-3">
        <Field orientation="horizontal">
          <FieldLabel className="w-2/5 text-xs text-muted-foreground">
            {i18n.t('inspect.card.dimensions')}
          </FieldLabel>
          <CopyableFieldBox
            id="size"
            value={`${styles.width} × ${styles.height}`}
            copyValue={`${styles.width}px × ${styles.height}px`}
            copiedId={copiedId}
            onCopy={handleCopy}
          />
        </Field>

        <Field orientation="horizontal">
          <FieldLabel className="w-2/5 text-xs text-muted-foreground">
            {i18n.t('inspect.card.font')}
          </FieldLabel>
          <CopyableFieldBox
            id="font-family"
            value={styles.typography.fontFamily}
            tooltip={`${i18n.t('inspect.card.clickToCopy')}: ${styles.typography.fontStack}`}
            copiedId={copiedId}
            onCopy={handleCopy}
          />
        </Field>

        <Field orientation="horizontal">
          <FieldLabel className="w-2/5 text-xs text-muted-foreground">
            {i18n.t('inspect.card.typography')}
          </FieldLabel>
          <div className="flex h-7 w-3/5 items-center overflow-hidden rounded-md border border-input bg-transparent">
            <button
              type="button"
              data-testid="inspect-copy-font-size"
              onClick={() =>
                handleCopy(
                  'font-size',
                  `font-size: ${styles.typography.fontSize}; line-height: ${styles.typography.lineHeight};`,
                )
              }
              title={`${i18n.t('inspect.card.clickToCopy')}: ${styles.typography.fontSize} / ${styles.typography.lineHeight}`}
              className={cn(
                'flex h-full min-w-0 flex-1 items-center px-2 font-mono text-xs transition-colors hover:bg-muted/50 cursor-pointer',
                isSizeCopied &&
                  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium',
              )}
            >
              {isSizeCopied ? (
                <span className="flex items-center gap-1 truncate">
                  <Check className="size-3 shrink-0" />
                  <span className="truncate">
                    {i18n.t('inspect.card.copied')}
                  </span>
                </span>
              ) : (
                <span className="truncate">
                  {fmtUnit(styles.typography.fontSize)} /{' '}
                  {fmtUnit(styles.typography.lineHeight)}
                </span>
              )}
            </button>

            <button
              type="button"
              data-testid="inspect-copy-font-weight"
              onClick={() =>
                handleCopy('font-weight', styles.typography.fontWeight)
              }
              title={`${i18n.t('inspect.card.clickToCopy')}: ${styles.typography.fontWeight}`}
              className={cn(
                'flex h-full shrink-0 items-center border-l border-input px-1.5 font-mono text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground cursor-pointer',
                isWeightCopied &&
                  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium',
              )}
            >
              {isWeightCopied ? (
                <Check className="size-3" />
              ) : (
                <span>{styles.typography.fontWeight}</span>
              )}
            </button>
          </div>
        </Field>

        <ColorInspectField
          idPrefix="text"
          label={i18n.t('inspect.card.color')}
          color={styles.colors.text}
          colorFormat={inspectSettings.colorFormat}
          copiedId={copiedId}
          onCopy={handleCopy}
        />

        <ColorInspectField
          idPrefix="bg"
          label={i18n.t('inspect.card.background')}
          color={styles.colors.background}
          colorFormat={inspectSettings.colorFormat}
          copiedId={copiedId}
          onCopy={handleCopy}
        />

        <Field orientation="horizontal">
          <FieldLabel className="w-2/5 text-xs text-muted-foreground">
            {i18n.t('inspect.card.contrast')}
          </FieldLabel>
          <div
            data-testid="inspect-contrast-badge"
            className="flex h-7 w-3/5 items-center justify-between rounded-md border border-input bg-transparent px-2 font-mono text-xs"
          >
            <span>{styles.colors.contrast.formattedRatio}</span>
            <span
              className={cn(
                'rounded px-1.5 py-0.5 text-[10px] leading-none font-semibold',
                contrastBadgeClass,
              )}
            >
              {styles.colors.contrast.level}
            </span>
          </div>
        </Field>

        <Field orientation="horizontal">
          <FieldLabel className="w-2/5 text-xs text-muted-foreground">
            {i18n.t('inspect.card.display')}
          </FieldLabel>
          <CopyableFieldBox
            id="display"
            value={styles.layout.display}
            copiedId={copiedId}
            onCopy={handleCopy}
          />
        </Field>

        {styles.layout.gap && (
          <Field orientation="horizontal">
            <FieldLabel className="w-2/5 text-xs text-muted-foreground">
              {i18n.t('inspect.card.gap')}
            </FieldLabel>
            <CopyableFieldBox
              id="gap"
              value={fmtUnit(styles.layout.gap)}
              copyValue={styles.layout.gap}
              copiedId={copiedId}
              onCopy={handleCopy}
            />
          </Field>
        )}

        <Field orientation="horizontal">
          <FieldLabel className="w-2/5 text-xs text-muted-foreground">
            {i18n.t('inspect.card.padding')}
          </FieldLabel>
          <CopyableFieldBox
            id="padding"
            value={fmtUnit(styles.layout.padding)}
            copyValue={styles.layout.padding}
            copiedId={copiedId}
            onCopy={handleCopy}
          />
        </Field>

        {styles.layout.margin !== '0px' && (
          <Field orientation="horizontal">
            <FieldLabel className="w-2/5 text-xs text-muted-foreground">
              {i18n.t('inspect.card.margin')}
            </FieldLabel>
            <CopyableFieldBox
              id="margin"
              value={fmtUnit(styles.layout.margin)}
              copyValue={styles.layout.margin}
              copiedId={copiedId}
              onCopy={handleCopy}
            />
          </Field>
        )}

        {styles.layout.borderRadius !== '0px' && (
          <Field orientation="horizontal">
            <FieldLabel className="w-2/5 text-xs text-muted-foreground">
              {i18n.t('inspect.card.radius')}
            </FieldLabel>
            <CopyableFieldBox
              id="radius"
              value={fmtUnit(styles.layout.borderRadius)}
              copyValue={styles.layout.borderRadius}
              copiedId={copiedId}
              onCopy={handleCopy}
            />
          </Field>
        )}
      </FieldGroup>
    </div>
  );
}
