import { Kbd } from '@/components/ui/kbd';
import { getElementLabel } from '@/lib/dom-utils';
import type { BoxPadding, GapOverlayBox } from '@/lib/inspect-geometry';

export function InspectHintBanner() {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-popover/95 px-3.5 py-1.5 text-xs font-medium text-popover-foreground shadow-lg ring-1 ring-border backdrop-blur-xs">
      <span>
        <strong className="font-semibold">{i18n.t('inspect.clickKey')}</strong>{' '}
        {i18n.t('inspect.lockElement')} •{' '}
        <Kbd className="h-auto px-1 py-0.5 font-mono text-[10px]">Alt</Kbd>{' '}
        {i18n.t('inspect.measureDistances')} •{' '}
        <Kbd className="h-auto px-1 py-0.5 font-mono text-[10px]">
          {i18n.t('inspect.shiftClickKey')}
        </Kbd>{' '}
        {i18n.t('inspect.snapGrid')} •{' '}
        <Kbd className="h-auto px-1 py-0.5 font-mono text-[10px]">Esc</Kbd>{' '}
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
  margin,
  gaps,
  isSameAsSelected,
}: {
  element: HTMLElement;
  padding: BoxPadding | null;
  margin?: BoxPadding | null;
  gaps?: GapOverlayBox[];
  isSameAsSelected: boolean;
}) {
  const rect = element.getBoundingClientRect();

  return (
    <>
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
        {/* Outer element margins (amber layer) */}
        {margin && margin.top > 0 && (
          <div
            data-testid="inspect-margin-top"
            className="absolute inset-x-0 bg-amber-500/20 border-t border-dashed border-amber-500/50"
            style={{ top: -margin.top, height: margin.top }}
          />
        )}
        {margin && margin.bottom > 0 && (
          <div
            data-testid="inspect-margin-bottom"
            className="absolute inset-x-0 bg-amber-500/20 border-b border-dashed border-amber-500/50"
            style={{ bottom: -margin.bottom, height: margin.bottom }}
          />
        )}
        {margin && margin.left > 0 && (
          <div
            data-testid="inspect-margin-left"
            className="absolute inset-y-0 bg-amber-500/20 border-l border-dashed border-amber-500/50"
            style={{ left: -margin.left, width: margin.left }}
          />
        )}
        {margin && margin.right > 0 && (
          <div
            data-testid="inspect-margin-right"
            className="absolute inset-y-0 bg-amber-500/20 border-r border-dashed border-amber-500/50"
            style={{ right: -margin.right, width: margin.right }}
          />
        )}

        {/* Inner element padding (emerald layer) */}
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

      {/* Flex / Grid gap overlays between child elements (Figma Auto Layout style) */}
      {gaps?.map((gap) => (
        <div
          key={`gap-${gap.axis}-${gap.left}-${gap.top}-${gap.width}-${gap.height}`}
          data-testid="inspect-gap-overlay"
          className="fixed flex items-center justify-center bg-purple-500/20 border border-dashed border-purple-500/50"
          style={{
            top: gap.top,
            left: gap.left,
            width: gap.width,
            height: gap.height,
          }}
        >
          {(gap.width >= 16 || gap.height >= 14) && (
            <span className="rounded bg-purple-600 px-1 py-0.5 font-mono text-[9px] leading-none font-semibold text-white shadow-2xs">
              {gap.value}
            </span>
          )}
        </div>
      ))}
    </>
  );
}
