import { FollowScrollField } from '@/components/overlay/shared/follow-scroll-field';
import { Field, FieldLabel } from '@/components/ui/field';
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
import { getColumnAlignments, getRowAlignments } from './constants';
import { MaxSizeField } from './max-size-field';
import { ScrubbableNumberField } from './scrubbable-number-field';
import { TrackedElementBanner } from './tracked-element-banner';

export interface LinearGuideFieldsProps extends ColorOpacityFieldProps {
  mode: 'columns' | 'rows';
  settings: LinearGuideSettings;
  trackedElementLabel?: string | null;
  onClearTrackedElement?: () => void;
  onChange: (patch: Partial<LinearGuideSettings>) => void;
}

export function LinearGuideFields({
  mode,
  settings,
  trackedElementLabel,
  onClearTrackedElement,
  onChange,
  ...colorProps
}: LinearGuideFieldsProps) {
  const isColumns = mode === 'columns';
  const isStretch = settings.alignment === 'stretch';
  const alignments = isColumns ? getColumnAlignments() : getRowAlignments();

  const handleAlignmentChange = (alignment: GuideAlignment) => {
    onChange({
      alignment,
      itemSize: alignment === 'stretch' ? null : (settings.itemSize ?? 64),
    });
  };

  return (
    <>
      {isColumns && trackedElementLabel && (
        <TrackedElementBanner
          label={trackedElementLabel}
          onClear={onClearTrackedElement}
        />
      )}

      <ScrubbableNumberField
        id="guide-count"
        label={i18n.t('guides.fields.count')}
        value={settings.count}
        min={1}
        max={48}
        onChange={(count) => onChange({ count })}
      />

      <ColorOpacityField {...colorProps} />

      <Field orientation="horizontal">
        <FieldLabel
          htmlFor="guide-alignment"
          className="w-2/5 text-xs text-muted-foreground"
        >
          {i18n.t('guides.fields.type')}
        </FieldLabel>
        <div className="w-3/5">
          <Select
            items={alignments}
            value={settings.alignment}
            onValueChange={(val) =>
              handleAlignmentChange(val as GuideAlignment)
            }
          >
            <SelectTrigger
              id="guide-alignment"
              size="sm"
              className="w-full text-xs"
            >
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

      <MaxSizeField
        isColumns={isColumns}
        maxSize={settings.maxSize}
        onChange={(maxSize) => onChange({ maxSize })}
      />

      <ScrubbableNumberField
        id="guide-item-size"
        label={
          isColumns
            ? i18n.t('guides.fields.width')
            : i18n.t('guides.fields.height')
        }
        value={settings.itemSize ?? 64}
        min={1}
        max={2000}
        disabled={isStretch}
        displayValue={isStretch ? i18n.t('guides.fields.auto') : undefined}
        onChange={(itemSize) => onChange({ itemSize })}
      />

      <ScrubbableNumberField
        id="guide-margin"
        label={i18n.t('guides.fields.margin')}
        value={settings.margin}
        min={0}
        max={1000}
        onChange={(margin) => onChange({ margin })}
      />

      <ScrubbableNumberField
        id="guide-gutter"
        label={i18n.t('guides.fields.gutter')}
        value={settings.gutter}
        min={0}
        max={500}
        onChange={(gutter) => onChange({ gutter })}
      />

      <ScrubbableNumberField
        id="guide-offset"
        label={i18n.t('guides.fields.offset')}
        value={settings.offset}
        min={-2000}
        max={2000}
        onChange={(offset) => onChange({ offset })}
      />

      <FollowScrollField
        followScroll={settings.followScroll}
        onChange={(followScroll) => onChange({ followScroll })}
      />
    </>
  );
}
