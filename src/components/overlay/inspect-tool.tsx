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
						aria-label="Inspect & measure distances"
						pressed={active}
						onPressedChange={onToggle}
					>
						<SquareMousePointer className="h-4 w-4" />
					</Toggle>
				}
			/>
			<TooltipContent className="w-fit whitespace-nowrap">
				Inspect & measure (Shift+I or hold Alt)
			</TooltipContent>
		</Tooltip>
	);
}
