import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import type { GuideType } from '@/types/layout-guides';
import { GUIDE_TYPES } from './constants';

export interface GuidePopoverHeaderProps {
	type: GuideType;
	onTypeChange: (type: GuideType) => void;
	onClose: () => void;
}

export function GuidePopoverHeader({
	type,
	onTypeChange,
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
	);
}
