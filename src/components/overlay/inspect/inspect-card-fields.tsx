import { cn } from 'cn';
import { Check, ChevronRight } from 'lucide-react';
import { Field, FieldLabel } from '@/components/ui/field';
import { getElementLabel, isOverlayElement } from '@/lib/dom-utils';
import { formatColorByPreference } from '@/lib/inspect-exporters';
import type { FormattedColor } from '@/lib/inspect-styles';
import type { InspectColorFormat } from '@/types/settings';

export function DomBreadcrumbsTitle({
  element,
  onSelectElement,
}: {
  element: HTMLElement;
  onSelectElement?: (el: HTMLElement) => void;
}) {
  const rawNodes: HTMLElement[] = [element];
  let curr = element.parentElement;
  while (
    curr &&
    curr !== document.body &&
    curr !== document.documentElement &&
    !isOverlayElement(curr) &&
    rawNodes.length < 2
  ) {
    rawNodes.unshift(curr);
    curr = curr.parentElement;
  }

  const chain = rawNodes.map((node, depth) => ({
    node,
    depth,
    label: getElementLabel(node, 14),
    key: `${depth}-${getElementLabel(node, 14)}`,
  }));

  return (
    <div
      data-testid="inspect-breadcrumbs"
      className="flex min-w-0 items-center gap-1 pr-1"
    >
      <span className="size-1.5 shrink-0 rounded-full bg-primary" />
      <div className="flex min-w-0 items-center gap-0.5 overflow-hidden">
        {chain.map((item) => {
          const isCurrent = item.node === element;
          return (
            <div key={item.key} className="flex min-w-0 items-center gap-0.5">
              {item.depth > 0 && (
                <ChevronRight className="size-3 shrink-0 text-muted-foreground/60" />
              )}
              <button
                type="button"
                disabled={isCurrent}
                data-testid={`inspect-breadcrumb-${item.depth}`}
                onClick={() => onSelectElement?.(item.node)}
                className={cn(
                  'truncate rounded px-1 py-0.5 font-mono text-xs transition-colors',
                  isCurrent
                    ? 'font-medium text-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer',
                )}
              >
                {item.label}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CopyableFieldBox({
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

export function ColorInspectField({
  idPrefix,
  label,
  color,
  colorFormat,
  copiedId,
  onCopy,
}: {
  idPrefix: string;
  label: string;
  color: FormattedColor;
  colorFormat: InspectColorFormat;
  copiedId: string | null;
  onCopy: (id: string, text: string) => void;
}) {
  const primaryId = `${idPrefix}-hex`;
  const secondaryId = `${idPrefix}-rgb`;
  const primaryText = formatColorByPreference(color, colorFormat);
  const secondaryFormat: InspectColorFormat =
    colorFormat === 'hex' ? 'rgb' : 'hex';
  const secondaryText = formatColorByPreference(color, secondaryFormat);

  const isPrimaryCopied = copiedId === primaryId;
  const isSecondaryCopied = copiedId === secondaryId;

  return (
    <Field orientation="horizontal">
      <FieldLabel className="w-2/5 text-xs text-muted-foreground">
        {label}
      </FieldLabel>

      <div className="flex h-7 w-3/5 items-center overflow-hidden rounded-md border border-input bg-transparent">
        <span
          className="ml-1.5 size-4 shrink-0 rounded-[3px] border border-border/60"
          style={{
            background: color.gradient ?? color.rgb,
          }}
        />

        <button
          type="button"
          data-testid={`inspect-copy-${primaryId}`}
          onClick={() => onCopy(primaryId, primaryText)}
          title={`${i18n.t('inspect.card.clickToCopy')}: ${primaryText}`}
          className={cn(
            'flex h-full min-w-0 flex-1 items-center px-1.5 font-mono text-xs transition-colors hover:bg-muted/50 cursor-pointer',
            isPrimaryCopied &&
              'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium',
          )}
        >
          {isPrimaryCopied ? (
            <span className="flex items-center gap-1 truncate">
              <Check className="size-3 shrink-0" />
              <span className="truncate">{i18n.t('inspect.card.copied')}</span>
            </span>
          ) : (
            <span className="truncate">{primaryText}</span>
          )}
        </button>

        <button
          type="button"
          data-testid={`inspect-copy-${secondaryId}`}
          onClick={() => onCopy(secondaryId, secondaryText)}
          title={`${i18n.t('inspect.card.clickToCopy')}: ${secondaryText}`}
          className={cn(
            'flex h-full shrink-0 items-center border-l border-input px-1.5 font-mono text-[10px] uppercase text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground cursor-pointer',
            isSecondaryCopied &&
              'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium',
          )}
        >
          {isSecondaryCopied ? (
            <Check className="size-3" />
          ) : (
            <span>{secondaryFormat}</span>
          )}
          <span className="sr-only">{secondaryText}</span>
        </button>
      </div>
    </Field>
  );
}
