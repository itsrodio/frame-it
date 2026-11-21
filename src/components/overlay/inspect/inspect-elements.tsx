import { getElementLabel } from '@/lib/dom-utils';
import type { BoxPadding } from '@/lib/inspect-geometry';

export function InspectHintBanner() {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-popover/95 px-3.5 py-1.5 text-xs font-medium text-popover-foreground shadow-lg ring-1 ring-border backdrop-blur-xs">
      <span>
        <strong className="font-semibold">{i18n.t('inspect.clickKey')}</strong>{' '}
        {i18n.t('inspect.lockElement')} •{' '}
        <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">
          Alt
        </kbd>{' '}
        {i18n.t('inspect.measureDistances')} •{' '}
        <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">
          {i18n.t('inspect.shiftClickKey')}
        </kbd>{' '}
        {i18n.t('inspect.snapGrid')} •{' '}
        <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">
          Esc
        </kbd>{' '}
        {i18n.t('inspect.exit')}
      </span>
    </div>
  );
}

export function TargetOutlineBox({ rect }: { rect: DOMRect }) {
  return (
    <div
      className="fixed border border-dashed border-[#F24E1E]/70"
      style={{
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      }}
    />
  );
}

export function SelectedElementBox({
  element,
  rect,
}: {
  element: HTMLElement;
  rect: DOMRect;
}) {
  return (
    <div
      className="fixed border-2 border-[#0D99FF] bg-[#0D99FF]/5"
      style={{
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      }}
    >
      <div className="absolute -top-6 left-0 flex items-center gap-1 rounded bg-[#0D99FF] px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap text-white shadow-xs">
        <span className="font-mono">{getElementLabel(element)}</span>
        <span className="opacity-75">•</span>
        <span>
          {Math.round(rect.width)} × {Math.round(rect.height)}
        </span>
      </div>
    </div>
  );
}

export function HoveredElementBox({
  element,
  padding,
  isSameAsSelected,
}: {
  element: HTMLElement;
  padding: BoxPadding | null;
  isSameAsSelected: boolean;
}) {
  const rect = element.getBoundingClientRect();

  return (
    <div
      className={
        isSameAsSelected
          ? 'fixed'
          : 'fixed border border-[#F24E1E] bg-[#F24E1E]/5'
      }
      style={{
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      }}
    >
      {padding && padding.top > 0 && (
        <div
          className="absolute inset-x-0 top-0 bg-emerald-500/15"
          style={{ height: padding.top }}
        />
      )}
      {padding && padding.bottom > 0 && (
        <div
          className="absolute inset-x-0 bottom-0 bg-emerald-500/15"
          style={{ height: padding.bottom }}
        />
      )}
      {padding && padding.left > 0 && (
        <div
          className="absolute inset-y-0 left-0 bg-emerald-500/15"
          style={{ width: padding.left }}
        />
      )}
      {padding && padding.right > 0 && (
        <div
          className="absolute inset-y-0 right-0 bg-emerald-500/15"
          style={{ width: padding.right }}
        />
      )}

      {!isSameAsSelected && (
        <div className="absolute -bottom-6 left-0 flex items-center gap-1 rounded bg-[#F24E1E] px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap text-white shadow-xs z-10">
          <span className="font-mono">{getElementLabel(element)}</span>
          <span className="opacity-75">•</span>
          <span>
            {Math.round(rect.width)} × {Math.round(rect.height)}
          </span>
        </div>
      )}
    </div>
  );
}
