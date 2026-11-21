import { DistanceRedlines } from '@/components/overlay/inspect/distance-redlines';
import { InspectDetailsCard } from '@/components/overlay/inspect/inspect-details-card';
import {
  HoveredElementBox,
  InspectHintBanner,
  SelectedElementBox,
  TargetOutlineBox,
} from '@/components/overlay/inspect/inspect-elements';
import { useInspectInteraction } from '@/components/overlay/inspect/use-inspect-interaction';
import { calculateDistances, parsePadding } from '@/lib/inspect-geometry';

export interface InspectMeasureOverlayProps {
  active: boolean;
  onSnapToElement?: (el: HTMLElement) => void;
  onCancel?: () => void;
}

export function InspectMeasureOverlay({
  active,
  onSnapToElement,
  onCancel,
}: InspectMeasureOverlayProps) {
  const { selectedEl, hoveredEl, isAltPressed, navigateDom, clearSelection } =
    useInspectInteraction({
      active,
      onSnapToElement,
      onCancel,
    });

  const isVisible = active || isAltPressed;
  if (!isVisible) return null;

  const validSelected =
    selectedEl && document.body.contains(selectedEl) ? selectedEl : null;
  const validHovered =
    hoveredEl && document.body.contains(hoveredEl) ? hoveredEl : null;

  const sourceEl = validSelected ?? validHovered;
  const targetEl =
    validSelected && validHovered && validSelected !== validHovered
      ? validHovered
      : validHovered?.parentElement &&
          validHovered.parentElement !== document.documentElement
        ? validHovered.parentElement
        : null;

  const sourceRect = sourceEl?.getBoundingClientRect() ?? null;
  const targetRect = targetEl?.getBoundingClientRect() ?? null;
  const hoveredPadding = validHovered ? parsePadding(validHovered) : null;

  const showDistances =
    (isAltPressed || (active && validSelected !== null)) &&
    sourceRect !== null &&
    targetRect !== null &&
    sourceEl !== targetEl;

  const distanceLines =
    showDistances && sourceRect && targetRect
      ? calculateDistances(sourceRect, targetRect)
      : [];

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {active && <InspectHintBanner />}

      {showDistances && targetRect && targetEl !== validHovered && (
        <TargetOutlineBox rect={targetRect} />
      )}

      {validSelected && sourceRect && (
        <>
          <SelectedElementBox element={validSelected} rect={sourceRect} />
          <InspectDetailsCard
            element={validSelected}
            rect={sourceRect}
            onNavigateDom={navigateDom}
            onClose={clearSelection}
          />
        </>
      )}

      {validHovered && (
        <HoveredElementBox
          element={validHovered}
          padding={hoveredPadding}
          isSameAsSelected={validHovered === validSelected}
        />
      )}

      <DistanceRedlines lines={distanceLines} />
    </div>
  );
}
