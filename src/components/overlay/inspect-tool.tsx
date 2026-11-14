import { SquareMousePointer } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip';

export function InspectTool() {
	return (
		<Tooltip>
			<TooltipTrigger>
				<Toggle aria-label="Inspect" disabled>
					<SquareMousePointer className="h-4 w-4" />
				</Toggle>
			</TooltipTrigger>
			<TooltipContent className="w-fit whitespace-nowrap">
				Currently not available
			</TooltipContent>
		</Tooltip>
	);
}
