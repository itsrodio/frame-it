import { FollowScrollField } from '@/components/overlay/shared/follow-scroll-field';
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
        label={i18n.t('guides.fields.size')}
        value={settings.size}
        min={2}
        max={256}
        onChange={(size) => onChange({ size })}
      />

      <ColorOpacityField {...colorProps} />

      <ScrubbableNumberField
        id="guide-grid-offset-x"
        label={i18n.t('guides.fields.offsetX')}
        value={settings.offsetX}
        min={-500}
        max={500}
        onChange={(offsetX) => onChange({ offsetX })}
      />

      <ScrubbableNumberField
        id="guide-grid-offset-y"
        label={i18n.t('guides.fields.offsetY')}
        value={settings.offsetY}
        min={-500}
        max={500}
        onChange={(offsetY) => onChange({ offsetY })}
      />

      <FollowScrollField
        followScroll={settings.followScroll}
        onChange={(followScroll) => onChange({ followScroll })}
      />
    </>
  );
}
