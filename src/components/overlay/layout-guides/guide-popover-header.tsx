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
import { getGuideTypes } from './constants';

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
  const guideTypes = getGuideTypes();

  return (
    <div className="flex items-center justify-between border-b px-3 py-2.5">
      {/* Левая часть: выбор типа сетки (Columns / Rows / Grid) */}
      <Select
        items={guideTypes}
        value={state.type}
        onValueChange={(val) => onTypeChange(val as GuideType)}
      >
        <SelectTrigger className="h-7 w-auto gap-1.5 px-2.5 text-xs font-medium">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {guideTypes.map((item) => (
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
                aria-label={i18n.t('guides.header.autoDetectAriaLabel')}
              >
                <WandSparkles className="size-3.5" />
              </Button>
            }
          />
          <TooltipContent className="w-fit whitespace-nowrap">
            {i18n.t('guides.header.autoDetectTooltip')}
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
                aria-label={i18n.t('guides.header.pickContainerAriaLabel')}
              >
                <Crosshair className="size-3.5" />
              </Button>
            }
          />
          <TooltipContent className="w-fit whitespace-nowrap">
            {i18n.t('guides.header.pickContainerTooltip')}
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
                aria-label={i18n.t('guides.header.resetAriaLabel')}
              >
                <RotateCcw className="size-3.5" />
              </Button>
            }
          />
          <TooltipContent className="w-fit whitespace-nowrap">
            {i18n.t('guides.header.resetTooltip')}
          </TooltipContent>
        </Tooltip>

        <Button
          variant="ghost"
          size="icon"
          className="size-6 text-muted-foreground hover:text-foreground"
          onClick={onClose}
          aria-label={i18n.t('guides.header.closeAriaLabel')}
        >
          <X className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
