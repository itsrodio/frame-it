import { Lock, Scroll } from 'lucide-react';
import { Field, FieldLabel } from '@/components/ui/field';
import { Toggle } from '@/components/ui/toggle';
import type { GridGuideSettings } from '@/types/layout-guides';
import {
	ColorOpacityField,
	type ColorOpacityFieldProps,
} from './color-opacity-field';
import { ScrubbableNumberField } from './scrubbable-number-field';

export interface GridGuideFieldsProps extends ColorOpacityFieldProps {
	settings: GridGuideSettings;
	onChange: (patch: Partial<GridGuideSettings>) => void;
}

export function GridGuideFields({
	settings,
	onChange,
	...colorProps
}: GridGuideFieldsProps) {
	return (
		<>
			<ScrubbableNumberField
				id="guide-size"
				label="Size"
				value={settings.size}
				min={2}
				max={256}
				onChange={(size) => onChange({ size })}
			/>

			<ColorOpacityField {...colorProps} />

			<ScrubbableNumberField
				id="guide-grid-offset-x"
				label="Offset X"
				value={settings.offsetX}
				min={-500}
				max={500}
				onChange={(offsetX) => onChange({ offsetX })}
			/>

			<ScrubbableNumberField
				id="guide-grid-offset-y"
				label="Offset Y"
				value={settings.offsetY}
				min={-500}
				max={500}
				onChange={(offsetY) => onChange({ offsetY })}
			/>

			<Field orientation="horizontal">
				<FieldLabel className="w-2/5 text-xs text-muted-foreground">
					Position
				</FieldLabel>
				<div className="flex w-3/5 items-center gap-1">
					<Toggle
						size="sm"
						variant="outline"
						pressed={settings.followScroll}
						onPressedChange={(followScroll) => onChange({ followScroll })}
						className="h-7 w-full text-xs gap-1.5"
					>
						{settings.followScroll ? (
							<>
								<Scroll className="size-3" />
								Scroll with page
							</>
						) : (
							<>
								<Lock className="size-3" />
								Fixed to viewport
							</>
						)}
					</Toggle>
				</div>
			</Field>
		</>
	);
}
