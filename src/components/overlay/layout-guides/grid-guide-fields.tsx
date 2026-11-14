import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
	ColorOpacityField,
	type ColorOpacityFieldProps,
} from './color-opacity-field';

export interface GridGuideFieldsProps extends ColorOpacityFieldProps {
	size: number;
	onSizeChange: (size: number) => void;
}

export function GridGuideFields({
	size,
	onSizeChange,
	...colorProps
}: GridGuideFieldsProps) {
	return (
		<>
			<Field orientation="horizontal">
				<FieldLabel
					htmlFor="guide-size"
					className="w-2/5 text-xs text-muted-foreground"
				>
					Size
				</FieldLabel>
				<Input
					id="guide-size"
					type="number"
					min={2}
					value={size}
					onChange={(e) =>
						onSizeChange(Math.max(2, Number(e.target.value) || 2))
					}
					className="h-7 w-3/5 text-xs"
				/>
			</Field>

			<ColorOpacityField {...colorProps} />
		</>
	);
}
