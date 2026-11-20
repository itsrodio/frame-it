import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const HOLD_DURATION_MS = 450;

interface CloseToolProps {
  onClose: () => void;
  holdToClose?: boolean;
}

export function CloseTool({ onClose, holdToClose = true }: CloseToolProps) {
  const [isHolding, setIsHolding] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!holdToClose || !isHolding || isCompleted) return;

    const timer = window.setTimeout(() => {
      setIsCompleted(true);
      navigator.vibrate?.(15);
      onClose();
    }, HOLD_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [holdToClose, isHolding, isCompleted, onClose]);

  const startHold = () => {
    if (!holdToClose) return;
    if (isCompleted) return;
    setIsHolding(true);
  };

  const cancelHold = () => {
    if (!holdToClose) return;
    if (isCompleted) return;
    setIsHolding(false);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!holdToClose) return;
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    startHold();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!holdToClose) return;
    if (e.repeat) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      startHold();
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!holdToClose) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      cancelHold();
    }
  };

  const handleClick = () => {
    if (!holdToClose) {
      onClose();
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={
              holdToClose
                ? i18n.t('dock.close.ariaLabel')
                : i18n.t('dock.close.clickToClose')
            }
            data-holding={isHolding || undefined}
            onClick={handleClick}
            onPointerDown={handlePointerDown}
            onPointerUp={cancelHold}
            onPointerCancel={cancelHold}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            onBlur={cancelHold}
            className="group relative overflow-hidden transition-transform duration-150 ease-out hover:text-destructive active:scale-[0.92] data-[holding=true]:scale-[0.92] data-[holding=true]:text-destructive"
          >
            {/* Радиальная заливка из центра */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full bg-destructive/20 transition-transform"
              style={{
                transform: isHolding ? 'scale(1.5)' : 'scale(0)',
                transitionDuration: isHolding
                  ? `${HOLD_DURATION_MS}ms`
                  : '180ms',
                transitionTimingFunction: isHolding
                  ? 'cubic-bezier(0.25, 0.8, 0.25, 1)'
                  : 'cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />

            {/* Тонкая рамка, проявляющаяся при удержании */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-[inherit] border border-destructive/40 opacity-0 transition-opacity duration-150 group-data-[holding=true]:opacity-100"
            />

            {/* Иконка с лёгким поворотом при удержании */}
            <X className="relative z-10 transition-transform duration-300 ease-out group-data-[holding=true]:rotate-90 group-data-[holding=true]:scale-110" />
          </Button>
        }
      />
      <TooltipContent className="w-fit whitespace-nowrap">
        {!holdToClose
          ? i18n.t('dock.close.clickToClose')
          : isHolding
            ? i18n.t('dock.close.keepHolding')
            : i18n.t('dock.close.holdToClose')}
      </TooltipContent>
    </Tooltip>
  );
}
