import { Field, FieldLabel } from '@/components/ui/field';

export interface ColorOpacityFieldProps {
	cleanHex: string;
	validCssHex: string;
	opacity: number;
	onHexChange: (value: string) => void;
	onOpacityChange: (value: string) => void;
}

export function ColorOpacityField({
	cleanHex,
	validCssHex,
	opacity,
	onHexChange,
	onOpacityChange,
}: ColorOpacityFieldProps) {
	return (
		<Field orientation="horizontal">
			<FieldLabel
				htmlFor="guide-color"
				className="w-2/5 text-xs text-muted-foreground"
			>
				Color
			</FieldLabel>

			{/* Составной контрол: [Swatch | HEX | Opacity %] */}
			<div className="flex h-7 w-3/5 items-center overflow-hidden rounded-md border border-input bg-transparent focus-within:ring-1 focus-within:ring-ring">
				{/* Превью цвета + нативный color picker по клику */}
				<label className="relative ml-1.5 flex size-4 shrink-0 cursor-pointer overflow-hidden rounded-[3px] border border-border/60">
					{/* Сплошной цвет слева */}
					<span
						className="h-full w-1/2"
						style={{ backgroundColor: validCssHex }}
					/>
					{/* Цвет с прозрачностью поверх шахматки справа */}
					<span
						className="relative h-full w-1/2"
						style={{
							backgroundImage:
								'conic-gradient(#ccc 25%, #fff 0 50%, #ccc 0 75%, #fff 0)',
							backgroundSize: '6px 6px',
						}}
					>
						<span
							className="absolute inset-0"
							style={{
								backgroundColor: validCssHex,
								opacity: opacity / 100,
							}}
						/>
					</span>
					<input
						type="color"
						value={validCssHex}
						onChange={(e) => onHexChange(e.target.value)}
						className="sr-only"
						aria-label="Pick guide color"
					/>
				</label>

				{/* HEX ввод */}
				<input
					id="guide-color"
					type="text"
					value={cleanHex}
					onChange={(e) => onHexChange(e.target.value)}
					maxLength={6}
					className="h-full w-full min-w-0 bg-transparent px-1.5 font-mono text-xs uppercase outline-none"
				/>

				{/* Разделитель и поле непрозрачности */}
				<div className="flex h-full shrink-0 items-center border-l border-input px-1.5">
					<input
						type="number"
						min={0}
						max={100}
						value={opacity}
						onChange={(e) => onOpacityChange(e.target.value)}
						aria-label="Guide opacity"
						className="w-7 bg-transparent text-right text-xs outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
					/>
					<span className="ml-0.5 text-xs text-muted-foreground">%</span>
				</div>
			</div>
		</Field>
	);
}
