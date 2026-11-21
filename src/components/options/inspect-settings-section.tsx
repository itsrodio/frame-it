import { SquareMousePointer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import type {
  ExtensionInspectSettings,
  InspectCardPlacement,
  InspectCodeFormat,
  InspectColorFormat,
  InspectUnitFormat,
} from '@/types/settings';

export interface InspectSettingsSectionProps {
  inspect: ExtensionInspectSettings;
  onChange: (patch: Partial<ExtensionInspectSettings>) => void;
}

const CODE_FORMATS: Array<{ value: InspectCodeFormat; label: string }> = [
  { value: 'css', label: 'CSS' },
  { value: 'tailwind', label: 'Tailwind' },
  { value: 'jsx', label: 'JSX' },
];

const COLOR_FORMATS: Array<{ value: InspectColorFormat; label: string }> = [
  { value: 'hex', label: 'HEX' },
  { value: 'rgb', label: 'RGB' },
  { value: 'oklch', label: 'OKLCH' },
];

const UNIT_FORMATS: Array<{ value: InspectUnitFormat; label: string }> = [
  { value: 'px', label: 'px' },
  { value: 'rem', label: 'rem' },
  { value: 'both', label: 'px + rem' },
];

export function InspectSettingsSection({
  inspect,
  onChange,
}: InspectSettingsSectionProps) {
  const placements: Array<{ value: InspectCardPlacement; label: string }> = [
    {
      value: 'floating',
      label: i18n.t('inspect.settings.placementFloating'),
    },
    {
      value: 'pinned',
      label: i18n.t('inspect.settings.placementPinned'),
    },
  ];

  return (
    <section className="rounded-xl border bg-card p-6 shadow-xs">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <SquareMousePointer className="size-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">
            {i18n.t('inspect.settings.title')}
          </h2>
          <p className="text-xs text-muted-foreground">
            {i18n.t('inspect.settings.description')}
          </p>
        </div>
      </div>

      <div className="divide-y">
        {/* Code Format */}
        <div className="flex flex-col gap-3 py-3.5 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs font-medium">
            {i18n.t('inspect.settings.codeFormat')}
          </div>
          <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1 w-fit">
            {CODE_FORMATS.map((item) => (
              <Button
                key={item.value}
                variant={
                  inspect.codeFormat === item.value ? 'default' : 'ghost'
                }
                size="xs"
                data-testid={`inspect-code-format-${item.value}`}
                onClick={() => onChange({ codeFormat: item.value })}
                className="h-7 px-2.5 text-xs"
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Color Format */}
        <div className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs font-medium">
            {i18n.t('inspect.settings.colorFormat')}
          </div>
          <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1 w-fit">
            {COLOR_FORMATS.map((item) => (
              <Button
                key={item.value}
                variant={
                  inspect.colorFormat === item.value ? 'default' : 'ghost'
                }
                size="xs"
                data-testid={`inspect-color-format-${item.value}`}
                onClick={() => onChange({ colorFormat: item.value })}
                className="h-7 px-2.5 text-xs"
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Units */}
        <div className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs font-medium">
            {i18n.t('inspect.settings.unitFormat')}
          </div>
          <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1 w-fit">
            {UNIT_FORMATS.map((item) => (
              <Button
                key={item.value}
                variant={
                  inspect.unitFormat === item.value ? 'default' : 'ghost'
                }
                size="xs"
                data-testid={`inspect-unit-format-${item.value}`}
                onClick={() => onChange({ unitFormat: item.value })}
                className="h-7 px-2.5 font-mono text-xs"
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Card Placement */}
        <div className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs font-medium">
            {i18n.t('inspect.settings.cardPlacement')}
          </div>
          <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1 w-fit">
            {placements.map((item) => (
              <Button
                key={item.value}
                variant={
                  inspect.cardPlacement === item.value ? 'default' : 'ghost'
                }
                size="xs"
                data-testid={`inspect-placement-${item.value}`}
                onClick={() => onChange({ cardPlacement: item.value })}
                className="h-7 px-2.5 text-xs"
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Box Model Overlays */}
        <div className="flex flex-col gap-3 py-3.5 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs font-medium">
            {i18n.t('inspect.settings.boxOverlays')}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Toggle
              size="sm"
              variant="outline"
              data-testid="toggle-inspect-padding"
              pressed={inspect.showPadding}
              onPressedChange={(showPadding) => onChange({ showPadding })}
              className="h-7 px-2.5 text-xs"
            >
              {i18n.t('inspect.settings.showPadding')}
            </Toggle>
            <Toggle
              size="sm"
              variant="outline"
              data-testid="toggle-inspect-margin"
              pressed={inspect.showMargin}
              onPressedChange={(showMargin) => onChange({ showMargin })}
              className="h-7 px-2.5 text-xs"
            >
              {i18n.t('inspect.settings.showMargin')}
            </Toggle>
            <Toggle
              size="sm"
              variant="outline"
              data-testid="toggle-inspect-gap"
              pressed={inspect.showGap}
              onPressedChange={(showGap) => onChange({ showGap })}
              className="h-7 px-2.5 text-xs"
            >
              {i18n.t('inspect.settings.showGap')}
            </Toggle>
          </div>
        </div>
      </div>
    </section>
  );
}
