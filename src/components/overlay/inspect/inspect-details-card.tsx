import { cn } from 'cn';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  Copy,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { DomNavDirection } from '@/components/overlay/inspect/use-inspect-interaction';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getElementLabel } from '@/lib/dom-utils';
import { calculateInspectCardPosition } from '@/lib/inspect-geometry';
import {
  buildInspectedCssSnippet,
  extractInspectedStyles,
  type FormattedColor,
} from '@/lib/inspect-styles';

export interface InspectDetailsCardProps {
  element: HTMLElement;
  rect: DOMRect;
  onNavigateDom?: (direction: DomNavDirection) => void;
  onClose?: () => void;
}

function CopyableFieldBox({
  id,
  value,
  copyValue,
  tooltip,
  copiedId,
  onCopy,
  className,
}: {
  id: string;
  value: string;
  copyValue?: string;
  tooltip?: string;
  copiedId: string | null;
  onCopy: (id: string, text: string) => void;
  className?: string;
}) {
  const isCopied = copiedId === id;
  return (
    <button
      type="button"
      data-testid={`inspect-copy-${id}`}
      onClick={() => onCopy(id, copyValue ?? value)}
      title={
        tooltip ??
        `${i18n.t('inspect.card.clickToCopy')}: ${copyValue ?? value}`
      }
      className={cn(
        'flex h-7 w-3/5 items-center justify-between overflow-hidden rounded-md border border-input bg-transparent px-2 font-mono text-xs transition-colors hover:bg-muted/50 cursor-pointer',
        isCopied &&
          'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium',
        className,
      )}
    >
      {isCopied ? (
        <span className="flex items-center gap-1 truncate">
          <Check className="size-3 shrink-0" />
          <span>{i18n.t('inspect.card.copied')}</span>
        </span>
      ) : (
        <span className="truncate">{value}</span>
      )}
    </button>
  );
}

function ColorInspectField({
  idPrefix,
  label,
  color,
  copiedId,
  onCopy,
}: {
  idPrefix: string;
  label: string;
  color: FormattedColor;
  copiedId: string | null;
  onCopy: (id: string, text: string) => void;
}) {
  const hexId = `${idPrefix}-hex`;
  const rgbId = `${idPrefix}-rgb`;
  const isHexCopied = copiedId === hexId;
  const isRgbCopied = copiedId === rgbId;

  return (
    <Field orientation="horizontal">
      <FieldLabel className="w-2/5 text-xs text-muted-foreground">
        {label}
      </FieldLabel>

      {/* Составной контрол в стиле ColorOpacityField: [Swatch | HEX | RGB] */}
      <div className="flex h-7 w-3/5 items-center overflow-hidden rounded-md border border-input bg-transparent">
        <span
          className="ml-1.5 size-4 shrink-0 rounded-[3px] border border-border/60"
          style={{
            background: color.gradient ?? color.rgb,
          }}
        />

        <button
          type="button"
          data-testid={`inspect-copy-${hexId}`}
          onClick={() => onCopy(hexId, color.hex)}
          title={`${i18n.t('inspect.card.clickToCopy')}: ${color.hex}`}
          className={cn(
            'flex h-full min-w-0 flex-1 items-center px-1.5 font-mono text-xs transition-colors hover:bg-muted/50 cursor-pointer',
            isHexCopied &&
              'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium',
          )}
        >
          {isHexCopied ? (
            <span className="flex items-center gap-1 truncate">
              <Check className="size-3 shrink-0" />
              <span className="truncate">{i18n.t('inspect.card.copied')}</span>
            </span>
          ) : (
            <span className="truncate">{color.hex}</span>
          )}
        </button>

        <button
          type="button"
          data-testid={`inspect-copy-${rgbId}`}
          onClick={() => onCopy(rgbId, color.rgb)}
          title={`${i18n.t('inspect.card.clickToCopy')}: ${color.rgb}`}
          className={cn(
            'flex h-full shrink-0 items-center border-l border-input px-1.5 font-mono text-[10px] text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground cursor-pointer',
            isRgbCopied &&
              'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium',
          )}
        >
          {isRgbCopied ? <Check className="size-3" /> : <span>RGB</span>}
          <span className="sr-only">{color.rgb}</span>
        </button>
      </div>
    </Field>
  );
}

export function InspectDetailsCard({
  element,
  rect,
  onNavigateDom,
  onClose,
}: InspectDetailsCardProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

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
  const cssSnippet = buildInspectedCssSnippet(styles);

  const viewport = {
    width: document.documentElement.clientWidth || window.innerWidth || 1280,
    height: window.innerHeight || 800,
  };
  const position = calculateInspectCardPosition(rect, viewport, {
    width: 272,
    height: 330,
  });

  const contrastLevel = styles.colors.contrast.level;
  const contrastBadgeClass =
    contrastLevel === 'AAA' || contrastLevel === 'AA'
      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
      : 'bg-destructive/15 text-destructive';

  const isCssCopied = copiedId === 'all-css';
  const isSizeCopied = copiedId === 'font-size';
  const isWeightCopied = copiedId === 'font-weight';

  return (
    <div
      data-testid="inspect-details-card"
      className="fixed z-50 flex w-68 flex-col rounded-xl bg-popover p-0 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 pointer-events-auto"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      {/* Шапка в едином стиле с GuidePopoverHeader */}
      <div className="flex items-center justify-between border-b px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-1.5 pr-1">
          <span className="size-1.5 shrink-0 rounded-full bg-primary" />
          <span className="truncate font-mono text-xs font-medium text-foreground">
            {getElementLabel(element)}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  data-testid="inspect-nav-parent"
                  className="size-6 text-muted-foreground hover:text-foreground"
                  onClick={() => onNavigateDom?.('parent')}
                  aria-label={i18n.t('inspect.card.navParent')}
                >
                  <ArrowUp className="size-3.5" />
                </Button>
              }
            />
            <TooltipContent className="w-fit whitespace-nowrap">
              {i18n.t('inspect.card.navParent')}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  data-testid="inspect-nav-child"
                  className="size-6 text-muted-foreground hover:text-foreground"
                  onClick={() => onNavigateDom?.('child')}
                  aria-label={i18n.t('inspect.card.navChild')}
                >
                  <ArrowDown className="size-3.5" />
                </Button>
              }
            />
            <TooltipContent className="w-fit whitespace-nowrap">
              {i18n.t('inspect.card.navChild')}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  data-testid="inspect-nav-prev"
                  className="size-6 text-muted-foreground hover:text-foreground"
                  onClick={() => onNavigateDom?.('prev')}
                  aria-label={i18n.t('inspect.card.navPrev')}
                >
                  <ArrowLeft className="size-3.5" />
                </Button>
              }
            />
            <TooltipContent className="w-fit whitespace-nowrap">
              {i18n.t('inspect.card.navPrev')}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  data-testid="inspect-nav-next"
                  className="size-6 text-muted-foreground hover:text-foreground"
                  onClick={() => onNavigateDom?.('next')}
                  aria-label={i18n.t('inspect.card.navNext')}
                >
                  <ArrowRight className="size-3.5" />
                </Button>
              }
            />
            <TooltipContent className="w-fit whitespace-nowrap">
              {i18n.t('inspect.card.navNext')}
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
                    isCssCopied
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  onClick={() => handleCopy('all-css', cssSnippet)}
                  aria-label={i18n.t('inspect.card.copyCss')}
                >
                  {isCssCopied ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  <span className="sr-only">
                    {isCssCopied
                      ? i18n.t('inspect.card.copied')
                      : i18n.t('inspect.card.copyCss')}
                  </span>
                </Button>
              }
            />
            <TooltipContent className="w-fit whitespace-nowrap">
              {isCssCopied
                ? i18n.t('inspect.card.copied')
                : i18n.t('inspect.card.copyCss')}
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
                  {styles.typography.fontSize} / {styles.typography.lineHeight}
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
          copiedId={copiedId}
          onCopy={handleCopy}
        />

        <ColorInspectField
          idPrefix="bg"
          label={i18n.t('inspect.card.background')}
          color={styles.colors.background}
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
              value={styles.layout.gap}
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
            value={styles.layout.padding}
            copiedId={copiedId}
            onCopy={handleCopy}
          />
        </Field>

        <Field orientation="horizontal">
          <FieldLabel className="w-2/5 text-xs text-muted-foreground">
            {i18n.t('inspect.card.margin')}
          </FieldLabel>
          <CopyableFieldBox
            id="margin"
            value={styles.layout.margin}
            copiedId={copiedId}
            onCopy={handleCopy}
          />
        </Field>

        <Field orientation="horizontal">
          <FieldLabel className="w-2/5 text-xs text-muted-foreground">
            {i18n.t('inspect.card.radius')}
          </FieldLabel>
          <CopyableFieldBox
            id="radius"
            value={styles.layout.borderRadius}
            copiedId={copiedId}
            onCopy={handleCopy}
          />
        </Field>
      </FieldGroup>
    </div>
  );
}
