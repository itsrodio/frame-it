import { cn } from 'cn';
import { Crosshair, RotateCcw, WandSparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { GuideType, LayoutGuidesState } from '@/types/layout-guides';
import { GUIDE_TYPES } from './constants';

export interface GuidePopoverHeaderProps {
  state: LayoutGuidesState;
  canReset: boolean;
  isPickingContainer: boolean;
  onTypeChange: (type: GuideType) => void;
  onAutoDetect: () => void;
  onTogglePickContainer: () => void;
  onReset: () => void;
  onClose: () => void;
}

export function GuidePopoverHeader({
  state,
  canReset,
  isPickingContainer,
  onTypeChange,
  onAutoDetect,
  onTogglePickContainer,
  onReset,
  onClose,
}: GuidePopoverHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b px-3 py-2.5">
      {/* Левая часть: выбор типа сетки (Columns / Rows / Grid) */}
      <Select
        items={GUIDE_TYPES}
        value={state.type}
        onValueChange={(val) => onTypeChange(val as GuideType)}
      >
        <SelectTrigger className="h-7 w-auto gap-1.5 px-2.5 text-xs font-medium">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {GUIDE_TYPES.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {/* Правая часть: Auto-detect, Pick container, Reset, Close */}
      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-6 text-muted-foreground hover:text-foreground"
                onClick={onAutoDetect}
                aria-label="Auto-detect page container"
              >
                <WandSparkles className="size-3.5" />
              </Button>
            }
          />
          <TooltipContent className="w-fit whitespace-nowrap">
            Auto-detect container (Shift+A)
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant={isPickingContainer ? 'default' : 'ghost'}
                size="icon"
                className={cn(
                  'size-6',
                  !isPickingContainer &&
                    'text-muted-foreground hover:text-foreground',
                )}
                onClick={onTogglePickContainer}
                aria-label="Pick container on page"
              >
                <Crosshair className="size-3.5" />
              </Button>
            }
          />
          <TooltipContent className="w-fit whitespace-nowrap">
            Pick container on page (Shift+C)
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                disabled={!canReset}
                className="size-6 text-muted-foreground hover:text-foreground"
                onClick={onReset}
                aria-label="Reset settings"
              >
                <RotateCcw className="size-3.5" />
              </Button>
            }
          />
          <TooltipContent className="w-fit whitespace-nowrap">
            Reset site settings (back to auto-detect)
          </TooltipContent>
        </Tooltip>

        <Button
          variant="ghost"
          size="icon"
          className="size-6 text-muted-foreground hover:text-foreground"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
