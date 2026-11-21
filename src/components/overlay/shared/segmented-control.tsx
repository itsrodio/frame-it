import { cn } from 'cn';
import type * as React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export interface SegmentedControlItem<T extends string> {
  value: T;
  label: React.ReactNode;
  testId?: string;
}

export interface SegmentedControlProps<T extends string> {
  items: Array<SegmentedControlItem<T>>;
  value: T | null;
  onValueChange: (value: T) => void;
  testIdPrefix?: string;
  mono?: boolean;
  fullWidth?: boolean;
  className?: string;
  itemClassName?: string;
  ariaLabel?: string;
}

/**
 * Single-select segmented control built on shadcn ToggleGroup.
 */
export function SegmentedControl<T extends string>({
  items,
  value,
  onValueChange,
  testIdPrefix,
  mono = false,
  fullWidth = false,
  className,
  itemClassName,
  ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <ToggleGroup
      spacing={1}
      aria-label={ariaLabel}
      value={value !== null ? [value] : []}
      onValueChange={(nextValues) => {
        const next = nextValues[0];
        if (next) {
          onValueChange(next as T);
        }
      }}
      className={cn(
        'h-7 rounded-md border border-input bg-muted/30 p-0.5',
        fullWidth && 'grid w-full auto-cols-fr grid-flow-col',
        className,
      )}
    >
      {items.map((item) => (
        <ToggleGroupItem
          key={item.value}
          value={item.value}
          size="sm"
          data-testid={
            item.testId ??
            (testIdPrefix ? `${testIdPrefix}-${item.value}` : undefined)
          }
          className={cn(
            'h-full min-w-0 rounded-xs px-2 text-[11px] font-medium text-muted-foreground hover:bg-transparent hover:text-foreground aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:shadow-2xs aria-pressed:hover:bg-primary aria-pressed:hover:text-primary-foreground',
            mono && 'font-mono',
            itemClassName,
          )}
        >
          {item.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
