import { SquareMousePointer } from 'lucide-react';
import { OptionsSectionCard } from '@/components/options/options-section-card';
import { SegmentedControl } from '@/components/overlay/shared/segmented-control';
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
    <OptionsSectionCard
      icon={SquareMousePointer}
      title={i18n.t('inspect.settings.title')}
      description={i18n.t('inspect.settings.description')}
    >
      <div className="divide-y">
        <div className="flex flex-col gap-3 py-3.5 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-medium">
              {i18n.t('inspect.settings.codeFormat')}
            </div>
            <div className="text-xs text-muted-foreground">
              {i18n.t('inspect.settings.codeFormatDescription')}
            </div>
          </div>
          <SegmentedControl
            items={CODE_FORMATS}
            value={inspect.codeFormat}
            testIdPrefix="inspect-code-format"
            onValueChange={(codeFormat) => onChange({ codeFormat })}
            className="h-8 w-fit shrink-0 rounded-lg bg-muted/40 p-1"
            itemClassName="h-full rounded-md px-2.5 text-xs"
          />
        </div>

        <div className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-medium">
              {i18n.t('inspect.settings.colorFormat')}
            </div>
            <div className="text-xs text-muted-foreground">
              {i18n.t('inspect.settings.colorFormatDescription')}
            </div>
          </div>
          <SegmentedControl
            items={COLOR_FORMATS}
            value={inspect.colorFormat}
            testIdPrefix="inspect-color-format"
            onValueChange={(colorFormat) => onChange({ colorFormat })}
            className="h-8 w-fit shrink-0 rounded-lg bg-muted/40 p-1"
            itemClassName="h-full rounded-md px-2.5 text-xs"
          />
        </div>

        <div className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-medium">
              {i18n.t('inspect.settings.unitFormat')}
            </div>
            <div className="text-xs text-muted-foreground">
              {i18n.t('inspect.settings.unitFormatDescription')}
            </div>
          </div>
          <SegmentedControl
            items={UNIT_FORMATS}
            value={inspect.unitFormat}
            testIdPrefix="inspect-unit-format"
            mono
            onValueChange={(unitFormat) => onChange({ unitFormat })}
            className="h-8 w-fit shrink-0 rounded-lg bg-muted/40 p-1"
            itemClassName="h-full rounded-md px-2.5 text-xs"
          />
        </div>

        <div className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-medium">
              {i18n.t('inspect.settings.cardPlacement')}
            </div>
            <div className="text-xs text-muted-foreground">
              {i18n.t('inspect.settings.cardPlacementDescription')}
            </div>
          </div>
          <SegmentedControl
            items={placements}
            value={inspect.cardPlacement}
            testIdPrefix="inspect-placement"
            onValueChange={(cardPlacement) => onChange({ cardPlacement })}
            className="h-8 w-fit shrink-0 rounded-lg bg-muted/40 p-1"
            itemClassName="h-full rounded-md px-2.5 text-xs"
          />
        </div>

        <div className="flex flex-col gap-3 py-3.5 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-medium">
              {i18n.t('inspect.settings.boxOverlays')}
            </div>
            <div className="text-xs text-muted-foreground">
              {i18n.t('inspect.settings.boxOverlaysDescription')}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
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
    </OptionsSectionCard>
  );
}
