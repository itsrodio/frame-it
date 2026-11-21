import { SlidersHorizontal } from 'lucide-react';
import { OptionsSectionCard } from '@/components/options/options-section-card';
import { getGuideTypes } from '@/components/overlay/layout-guides/constants';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { GuideType } from '@/types/layout-guides';
import type { ExtensionBehaviorSettings } from '@/types/settings';

export interface BehaviorSettingsSectionProps {
  behavior: ExtensionBehaviorSettings;
  onChange: (patch: Partial<ExtensionBehaviorSettings>) => void;
}

interface BehaviorSwitchRowProps {
  title: string;
  description: string;
  checked: boolean;
  testId: string;
  onCheckedChange: (checked: boolean) => void;
}

function BehaviorSwitchRow({
  title,
  description,
  checked,
  testId,
  onCheckedChange,
}: BehaviorSwitchRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
      <div className="space-y-0.5">
        <div className="text-xs font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <Switch
        aria-label={title}
        data-testid={testId}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}

export function BehaviorSettingsSection({
  behavior,
  onChange,
}: BehaviorSettingsSectionProps) {
  const guideTypeItems = getGuideTypes();

  return (
    <OptionsSectionCard
      icon={SlidersHorizontal}
      title={i18n.t('options.behavior.title')}
      description={i18n.t('options.behavior.description')}
    >
      <div className="divide-y">
        <BehaviorSwitchRow
          title={i18n.t('options.behavior.autoDetectOnLaunch')}
          description={i18n.t('options.behavior.autoDetectOnLaunchDescription')}
          checked={behavior.autoDetectOnLaunch}
          testId="toggle-auto-detect-on-launch"
          onCheckedChange={(autoDetectOnLaunch) =>
            onChange({ autoDetectOnLaunch })
          }
        />

        <BehaviorSwitchRow
          title={i18n.t('options.behavior.guidesEnabledByDefault')}
          description={i18n.t(
            'options.behavior.guidesEnabledByDefaultDescription',
          )}
          checked={behavior.guidesEnabledByDefault}
          testId="toggle-guides-enabled-by-default"
          onCheckedChange={(guidesEnabledByDefault) =>
            onChange({ guidesEnabledByDefault })
          }
        />

        <div className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-medium">
              {i18n.t('options.behavior.defaultGuideType')}
            </div>
            <div className="text-xs text-muted-foreground">
              {i18n.t('options.behavior.defaultGuideTypeDescription')}
            </div>
          </div>
          <div className="w-full sm:w-44">
            <Select
              items={guideTypeItems}
              value={behavior.defaultGuideType}
              onValueChange={(val) =>
                onChange({
                  defaultGuideType: val as GuideType,
                })
              }
            >
              <SelectTrigger
                id="options-default-guide-type"
                className="h-8 w-full text-xs"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {guideTypeItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <BehaviorSwitchRow
          title={i18n.t('options.behavior.rememberSiteSettings')}
          description={i18n.t(
            'options.behavior.rememberSiteSettingsDescription',
          )}
          checked={behavior.rememberSiteSettings}
          testId="toggle-remember-site-settings"
          onCheckedChange={(rememberSiteSettings) =>
            onChange({ rememberSiteSettings })
          }
        />

        <BehaviorSwitchRow
          title={i18n.t('options.behavior.holdToClose')}
          description={i18n.t('options.behavior.holdToCloseDescription')}
          checked={behavior.holdToClose}
          testId="toggle-hold-to-close"
          onCheckedChange={(holdToClose) => onChange({ holdToClose })}
        />

        <BehaviorSwitchRow
          title={i18n.t('options.behavior.designOverlayLockedByDefault')}
          description={i18n.t(
            'options.behavior.designOverlayLockedByDefaultDescription',
          )}
          checked={behavior.designOverlayLockedByDefault}
          testId="toggle-design-overlay-locked"
          onCheckedChange={(designOverlayLockedByDefault) =>
            onChange({ designOverlayLockedByDefault })
          }
        />
      </div>
    </OptionsSectionCard>
  );
}
