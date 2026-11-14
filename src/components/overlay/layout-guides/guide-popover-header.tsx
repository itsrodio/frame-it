import { RotateCcw, X } from 'lucide-react';
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
import type { GuideType } from '@/types/layout-guides';
import { GUIDE_TYPES } from './constants';

export interface GuidePopoverHeaderProps {
	type: GuideType;
	canReset: boolean;
	onTypeChange: (type: GuideType) => void;
	onReset: () => void;
	onClose: () => void;
}

export function GuidePopoverHeader({
	type,
	canReset,
	onTypeChange,
	onReset,
	onClose,
}: GuidePopoverHeaderProps) {
	return (
		<div className="flex items-center justify-between border-b px-3 py-2.5">
			<Select
				items={GUIDE_TYPES}
				value={type}
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

			<div className="flex items-center gap-0.5">
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
						Reset to defaults
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
