import {
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Columns3,
  Image as ImageIcon,
  Layers,
  SquareMousePointer,
  X,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { Button } from '@/components/ui/button';

export type TourStepId =
  | 'inspect'
  | 'guides'
  | 'design-overlay'
  | 'page-export'
  | 'help';

export const TOUR_STEPS: readonly TourStepId[] = [
  'inspect',
  'guides',
  'design-overlay',
  'page-export',
  'help',
];

interface StepMeta {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  titleKey:
    | 'tour.steps.inspect.title'
    | 'tour.steps.guides.title'
    | 'tour.steps.designOverlay.title'
    | 'tour.steps.pageExport.title'
    | 'tour.steps.help.title';
  descriptionKey:
    | 'tour.steps.inspect.description'
    | 'tour.steps.guides.description'
    | 'tour.steps.designOverlay.description'
    | 'tour.steps.pageExport.description'
    | 'tour.steps.help.description';
}

const STEP_META: Record<TourStepId, StepMeta> = {
  inspect: {
    icon: SquareMousePointer,
    titleKey: 'tour.steps.inspect.title',
    descriptionKey: 'tour.steps.inspect.description',
  },
  guides: {
    icon: Columns3,
    titleKey: 'tour.steps.guides.title',
    descriptionKey: 'tour.steps.guides.description',
  },
  'design-overlay': {
    icon: ImageIcon,
    titleKey: 'tour.steps.designOverlay.title',
    descriptionKey: 'tour.steps.designOverlay.description',
  },
  'page-export': {
    icon: Layers,
    titleKey: 'tour.steps.pageExport.title',
    descriptionKey: 'tour.steps.pageExport.description',
  },
  help: {
    icon: CircleHelp,
    titleKey: 'tour.steps.help.title',
    descriptionKey: 'tour.steps.help.description',
  },
};

const CARD_WIDTH = 288;
const VIEWPORT_MARGIN = 12;
const TARGET_GAP = 14;

interface CardPosition {
  left: number;
  bottom: number;
  arrowLeft: number;
}

export interface OnboardingTourProps {
  open: boolean;
  stepIndex: number;
  steps?: readonly TourStepId[];
  portalContainer: HTMLElement;
  onStepChange: (nextIndex: number) => void;
  onClose: () => void;
}

export function OnboardingTour({
  open,
  stepIndex,
  steps = TOUR_STEPS,
  portalContainer,
  onStepChange,
  onClose,
}: OnboardingTourProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [position, setPosition] = useState<CardPosition | null>(null);

  const clampedIndex = Math.max(0, Math.min(stepIndex, steps.length - 1));
  const currentStepId = steps[clampedIndex] ?? 'inspect';
  const meta = STEP_META[currentStepId];
  const StepIcon = meta.icon;
  const isFirst = clampedIndex === 0;
  const isLast = clampedIndex === steps.length - 1;

  const updatePosition = useCallback(() => {
    const target = portalContainer.querySelector<HTMLElement>(
      `[data-tour-step="${currentStepId}"]`,
    );
    if (!target) {
      setPosition(null);
      return;
    }

    const rect = target.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      setPosition(null);
      return;
    }

    const targetCenterX = rect.left + rect.width / 2;
    const maxLeft = Math.max(
      VIEWPORT_MARGIN,
      window.innerWidth - CARD_WIDTH - VIEWPORT_MARGIN,
    );
    const left = Math.max(
      VIEWPORT_MARGIN,
      Math.min(maxLeft, targetCenterX - CARD_WIDTH / 2),
    );
    const bottom = Math.max(
      VIEWPORT_MARGIN,
      window.innerHeight - rect.top + TARGET_GAP,
    );
    const arrowLeft = Math.max(
      18,
      Math.min(CARD_WIDTH - 18, targetCenterX - left),
    );

    setPosition({ left, bottom, arrowLeft });
  }, [currentStepId, portalContainer]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const rootNode = portalContainer.getRootNode();
    const activeEl =
      rootNode instanceof ShadowRoot
        ? (rootNode.activeElement as HTMLElement | null)
        : (document.activeElement as HTMLElement | null);
    previousFocusRef.current = activeEl;

    dialogRef.current?.focus({ preventScroll: true });

    return () => {
      if (previousFocusRef.current?.isConnected) {
        previousFocusRef.current.focus({ preventScroll: true });
      }
      previousFocusRef.current = null;
    };
  }, [open, portalContainer]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        if (isLast) {
          onClose();
        } else {
          onStepChange(clampedIndex + 1);
        }
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();
        if (!isFirst) {
          onStepChange(clampedIndex - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [clampedIndex, isFirst, isLast, onClose, onStepChange, open]);

  if (!open) return null;

  const cardStyle: React.CSSProperties = position
    ? {
        left: `${position.left}px`,
        bottom: `${position.bottom}px`,
      }
    : {
        left: '50%',
        bottom: '84px',
        transform: 'translateX(-50%)',
      };

  return (
    <>
      <div
        data-testid="tour-backdrop"
        aria-hidden="true"
        className="fixed inset-0 z-40 pointer-events-auto bg-background/15"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        data-testid="onboarding-tour-card"
        data-tour-active-step={currentStepId}
        style={cardStyle}
        className="fixed z-60 pointer-events-auto w-72 rounded-xl border bg-popover p-3.5 text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <StepIcon className="size-3.5" aria-hidden={true} />
            </div>
            <h2 id={titleId} className="text-xs font-semibold leading-snug">
              {i18n.t(meta.titleKey)}
            </h2>
          </div>

          <Button
            variant="ghost"
            size="icon"
            data-testid="tour-close-button"
            className="-mt-1 -mr-1 size-6 shrink-0 text-muted-foreground hover:text-foreground"
            aria-label={i18n.t('tour.skip')}
            onClick={onClose}
          >
            <X className="size-3.5" aria-hidden="true" />
          </Button>
        </div>

        <p
          id={descriptionId}
          className="mt-2 text-xs leading-relaxed text-muted-foreground"
        >
          {i18n.t(meta.descriptionKey)}
        </p>

        <div className="mt-3.5 flex items-center justify-between gap-2 border-t pt-2.5">
          <div className="flex items-center gap-2">
            <span
              data-testid="tour-step-counter"
              className="font-mono text-[11px] text-muted-foreground"
            >
              {clampedIndex + 1}/{steps.length}
            </span>
            <Button
              variant="ghost"
              size="xs"
              data-testid="tour-skip-button"
              className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
              onClick={onClose}
            >
              {i18n.t('tour.skip')}
            </Button>
          </div>

          <div className="flex items-center gap-1">
            {!isFirst && (
              <Button
                variant="outline"
                size="xs"
                data-testid="tour-back-button"
                className="h-7 gap-0.5 px-2 text-xs"
                onClick={() => onStepChange(clampedIndex - 1)}
              >
                <ChevronLeft className="size-3" aria-hidden="true" />
                <span>{i18n.t('tour.back')}</span>
              </Button>
            )}

            <Button
              variant="default"
              size="xs"
              data-testid="tour-next-button"
              className="h-7 gap-0.5 px-2.5 text-xs"
              onClick={() => {
                if (isLast) {
                  onClose();
                } else {
                  onStepChange(clampedIndex + 1);
                }
              }}
            >
              <span>{isLast ? i18n.t('tour.done') : i18n.t('tour.next')}</span>
              {!isLast && (
                <ChevronRight className="size-3" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>

        {position && (
          <span
            aria-hidden="true"
            style={{ left: `${position.arrowLeft}px` }}
            className="pointer-events-none absolute -bottom-1.5 size-3 -translate-x-1/2 rotate-45 border-r border-b bg-popover"
          />
        )}
      </div>
    </>
  );
}
