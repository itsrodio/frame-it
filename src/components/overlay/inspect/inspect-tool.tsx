import { SquareMousePointer } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface InspectToolProps {
  active: boolean;
  onToggle: (active: boolean) => void;
}

export function InspectTool({ active, onToggle }: InspectToolProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Toggle
            aria-label={i18n.t('dock.inspect.ariaLabel')}
            pressed={active}
            onPressedChange={onToggle}
          >
            <SquareMousePointer className="h-4 w-4" />
          </Toggle>
        }
      />
      <TooltipContent className="w-fit whitespace-nowrap">
        {i18n.t('dock.inspect.tooltip')}
      </TooltipContent>
    </Tooltip>
  );
}
