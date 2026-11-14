import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import type {
	GuideAlignment,
	LinearGuideSettings,
} from '@/types/layout-guides';
import {
	ColorOpacityField,
	type ColorOpacityFieldProps,
} from './color-opacity-field';
import { COLUMN_ALIGNMENTS, ROW_ALIGNMENTS } from './constants';

export interface LinearGuideFieldsProps extends ColorOpacityFieldProps {
	mode: 'columns' | 'rows';
	settings: LinearGuideSettings;
	onChange: (patch: Partial<LinearGuideSettings>) => void;
}

export function LinearGuideFields({
	mode,
	settings,
	onChange,
	...colorProps
}: LinearGuideFieldsProps) {
	const isColumns = mode === 'columns';
	const isStretch = settings.alignment === 'stretch';
	const isCenter = settings.alignment === 'center';
	const alignments = isColumns ? COLUMN_ALIGNMENTS : ROW_ALIGNMENTS;

	const handleAlignmentChange = (alignment: GuideAlignment) => {
		onChange({
			alignment,
			itemSize: alignment === 'stretch' ? null : (settings.itemSize ?? 64),
		});
	};

	return (
		<>
			<Field orientation="horizontal">
				<FieldLabel
					htmlFor="guide-count"
					className="w-2/5 text-xs text-muted-foreground"
				>
					Count
				</FieldLabel>
				<Input
					id="guide-count"
					type="number"
					min={1}
					max={48}
					value={settings.count}
					onChange={(e) =>
						onChange({
							count: Math.min(48, Math.max(1, Number(e.target.value) || 1)),
						})
					}
					className="h-7 w-3/5 text-xs"
				/>
			</Field>

			<ColorOpacityField {...colorProps} />

			<Field orientation="horizontal">
				<FieldLabel
					htmlFor="guide-alignment"
					className="w-2/5 text-xs text-muted-foreground"
				>
					Type
				</FieldLabel>
				<div className="w-3/5">
					<Select
						items={alignments}
						value={settings.alignment}
						onValueChange={(val) =>
							handleAlignmentChange(val as GuideAlignment)
						}
					>
						<SelectTrigger id="guide-alignment" className="h-7 w-full text-xs">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								{alignments.map((item) => (
									<SelectItem key={item.value} value={item.value}>
										{item.label}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
				</div>
			</Field>

			<Field orientation="horizontal">
				<FieldLabel
					htmlFor="guide-item-size"
					className="w-2/5 text-xs text-muted-foreground"
				>
					{isColumns ? 'Width' : 'Height'}
				</FieldLabel>
				<Input
					id="guide-item-size"
					type={isStretch ? 'text' : 'number'}
					min={1}
					disabled={isStretch}
					value={isStretch ? 'Auto' : (settings.itemSize ?? 64)}
					onChange={(e) =>
						onChange({
							itemSize: Math.max(1, Number(e.target.value) || 1),
						})
					}
					className="h-7 w-3/5 text-xs disabled:opacity-50"
				/>
			</Field>

			<Field orientation="horizontal">
				<FieldLabel
					htmlFor="guide-margin"
					className="w-2/5 text-xs text-muted-foreground"
				>
					Margin
				</FieldLabel>
				<Input
					id="guide-margin"
					type="number"
					min={0}
					disabled={isCenter}
					value={settings.margin}
					onChange={(e) =>
						onChange({
							margin: Math.max(0, Number(e.target.value) || 0),
						})
					}
					className="h-7 w-3/5 text-xs disabled:opacity-50"
				/>
			</Field>

			<Field orientation="horizontal">
				<FieldLabel
					htmlFor="guide-gutter"
					className="w-2/5 text-xs text-muted-foreground"
				>
					Gutter
				</FieldLabel>
				<Input
					id="guide-gutter"
					type="number"
					min={0}
					value={settings.gutter}
					onChange={(e) =>
						onChange({
							gutter: Math.max(0, Number(e.target.value) || 0),
						})
					}
					className="h-7 w-3/5 text-xs"
				/>
			</Field>
		</>
	);
}
