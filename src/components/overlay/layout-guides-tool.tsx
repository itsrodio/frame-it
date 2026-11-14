import { ChevronDown, Grid2X2 } from 'lucide-react';
import { useState } from 'react';
import {
	DEFAULT_COLUMNS_SETTINGS,
	DEFAULT_GRID_SETTINGS,
	DEFAULT_ROWS_SETTINGS,
	GUIDE_TYPES,
} from '@/components/overlay/layout-guides/constants';
import { GridGuideFields } from '@/components/overlay/layout-guides/grid-guide-fields';
import { GuidePopoverHeader } from '@/components/overlay/layout-guides/guide-popover-header';
import { LinearGuideFields } from '@/components/overlay/layout-guides/linear-guide-fields';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { Toggle } from '@/components/ui/toggle';
import type {
	BaseGuideSettings,
	LayoutGuidesToolProps,
	LinearGuideSettings,
} from '@/types/layout-guides';

function isLinearModified(
	current: LinearGuideSettings,
	defaults: LinearGuideSettings,
): boolean {
	return (
		current.count !== defaults.count ||
		current.color.toUpperCase() !== defaults.color.toUpperCase() ||
		current.opacity !== defaults.opacity ||
		current.alignment !== defaults.alignment ||
		current.itemSize !== defaults.itemSize ||
		current.margin !== defaults.margin ||
		current.gutter !== defaults.gutter
	);
}

export function LayoutGuidesTool({
	state,
	onToggle,
	onTypeChange,
	onColumnsChange,
	onRowsChange,
	onGridChange,
	onReset,
}: LayoutGuidesToolProps) {
	const [open, setOpen] = useState(false);

	const ActiveIcon =
		GUIDE_TYPES.find((item) => item.value === state.type)?.icon ?? Grid2X2;

	const activeSettings = state[state.type];

	const canReset =
		state.type === 'columns'
			? isLinearModified(state.columns, DEFAULT_COLUMNS_SETTINGS)
			: state.type === 'rows'
				? isLinearModified(state.rows, DEFAULT_ROWS_SETTINGS)
				: state.grid.size !== DEFAULT_GRID_SETTINGS.size ||
					state.grid.color.toUpperCase() !==
						DEFAULT_GRID_SETTINGS.color.toUpperCase() ||
					state.grid.opacity !== DEFAULT_GRID_SETTINGS.opacity;

	const updateActiveBase = (patch: Partial<BaseGuideSettings>) => {
		if (state.type === 'columns') onColumnsChange(patch);
		else if (state.type === 'rows') onRowsChange(patch);
		else onGridChange(patch);
	};

	// Нормализация HEX для отображения без '#' как в Figma и валидации для превью
	const cleanHex = activeSettings.color.replace(/^#/, '').toUpperCase();
	const validCssHex = /^[0-9A-F]{6}$/i.test(cleanHex)
		? `#${cleanHex}`
		: '#FF0000';

	const handleHexChange = (raw: string) => {
		const sanitized = raw.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
		updateActiveBase({ color: `#${sanitized}` });
	};

	const handleOpacityChange = (raw: string) => {
		const num = Number(raw);
		if (Number.isNaN(num)) return;
		updateActiveBase({ opacity: Math.max(0, Math.min(100, num)) });
	};

	return (
		<div className="flex items-center">
			<Toggle
				aria-label="Toggle layout guides"
				pressed={state.enabled}
				onPressedChange={onToggle}
			>
				<ActiveIcon />
			</Toggle>

			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger
					render={
						<Button variant="ghost" className="px-1">
							<ChevronDown className="size-3" />
						</Button>
					}
				/>
				<PopoverContent align="start" className="w-64 p-0">
					<GuidePopoverHeader
						type={state.type}
						canReset={canReset}
						onTypeChange={onTypeChange}
						onReset={onReset}
						onClose={() => setOpen(false)}
					/>

					<FieldGroup className="gap-2 p-3">
						{state.type === 'grid' ? (
							<GridGuideFields
								size={state.grid.size}
								onSizeChange={(size) => onGridChange({ size })}
								cleanHex={cleanHex}
								validCssHex={validCssHex}
								opacity={state.grid.opacity}
								onHexChange={handleHexChange}
								onOpacityChange={handleOpacityChange}
							/>
						) : (
							<LinearGuideFields
								mode={state.type}
								settings={state[state.type]}
								onChange={
									state.type === 'columns' ? onColumnsChange : onRowsChange
								}
								cleanHex={cleanHex}
								validCssHex={validCssHex}
								opacity={activeSettings.opacity}
								onHexChange={handleHexChange}
								onOpacityChange={handleOpacityChange}
							/>
						)}
					</FieldGroup>
				</PopoverContent>
			</Popover>
		</div>
	);
}
