import { SlidersHorizontal } from 'lucide-react';
import { getGuideTypes } from '@/components/overlay/layout-guides/constants';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import type { GuideType } from '@/types/layout-guides';
import type { ExtensionBehaviorSettings } from '@/types/settings';

export interface BehaviorSettingsSectionProps {
  behavior: ExtensionBehaviorSettings;
  onChange: (patch: Partial<ExtensionBehaviorSettings>) => void;
}

export function BehaviorSettingsSection({
  behavior,
  onChange,
}: BehaviorSettingsSectionProps) {
  const guideTypeItems = getGuideTypes();

  return (
    <section className="rounded-xl border bg-card p-6 shadow-xs">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <SlidersHorizontal className="size-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">
            {i18n.t('options.behavior.title')}
          </h2>
          <p className="text-xs text-muted-foreground">
            {i18n.t('options.behavior.description')}
          </p>
        </div>
      </div>

      <div className="divide-y">
        <div className="flex items-center justify-between gap-4 py-3.5 first:pt-0">
          <div className="space-y-0.5">
            <div className="text-xs font-medium">
              {i18n.t('options.behavior.autoDetectOnLaunch')}
            </div>
            <div className="text-xs text-muted-foreground">
              {i18n.t('options.behavior.autoDetectOnLaunchDescription')}
            </div>
          </div>
          <Toggle
            size="sm"
            variant="outline"
            data-testid="toggle-auto-detect-on-launch"
            pressed={behavior.autoDetectOnLaunch}
            onPressedChange={(autoDetectOnLaunch) =>
              onChange({ autoDetectOnLaunch })
            }
            className="h-7 min-w-22 text-xs"
          >
            {behavior.autoDetectOnLaunch
              ? i18n.t('options.behavior.enabled')
              : i18n.t('options.behavior.disabled')}
          </Toggle>
        </div>

        <div className="flex items-center justify-between gap-4 py-3.5">
          <div className="space-y-0.5">
            <div className="text-xs font-medium">
              {i18n.t('options.behavior.guidesEnabledByDefault')}
            </div>
            <div className="text-xs text-muted-foreground">
              {i18n.t('options.behavior.guidesEnabledByDefaultDescription')}
            </div>
          </div>
          <Toggle
            size="sm"
            variant="outline"
            data-testid="toggle-guides-enabled-by-default"
            pressed={behavior.guidesEnabledByDefault}
            onPressedChange={(guidesEnabledByDefault) =>
              onChange({ guidesEnabledByDefault })
            }
            className="h-7 min-w-22 text-xs"
          >
            {behavior.guidesEnabledByDefault
              ? i18n.t('options.behavior.enabled')
              : i18n.t('options.behavior.disabled')}
          </Toggle>
        </div>

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

        <div className="flex items-center justify-between gap-4 py-3.5">
          <div className="space-y-0.5">
            <div className="text-xs font-medium">
              {i18n.t('options.behavior.rememberSiteSettings')}
            </div>
            <div className="text-xs text-muted-foreground">
              {i18n.t('options.behavior.rememberSiteSettingsDescription')}
            </div>
          </div>
          <Toggle
            size="sm"
            variant="outline"
            data-testid="toggle-remember-site-settings"
            pressed={behavior.rememberSiteSettings}
            onPressedChange={(rememberSiteSettings) =>
              onChange({ rememberSiteSettings })
            }
            className="h-7 min-w-22 text-xs"
          >
            {behavior.rememberSiteSettings
              ? i18n.t('options.behavior.enabled')
              : i18n.t('options.behavior.disabled')}
          </Toggle>
        </div>

        <div className="flex items-center justify-between gap-4 py-3.5">
          <div className="space-y-0.5">
            <div className="text-xs font-medium">
              {i18n.t('options.behavior.holdToClose')}
            </div>
            <div className="text-xs text-muted-foreground">
              {i18n.t('options.behavior.holdToCloseDescription')}
            </div>
          </div>
          <Toggle
            size="sm"
            variant="outline"
            data-testid="toggle-hold-to-close"
            pressed={behavior.holdToClose}
            onPressedChange={(holdToClose) => onChange({ holdToClose })}
            className="h-7 min-w-22 text-xs"
          >
            {behavior.holdToClose
              ? i18n.t('options.behavior.enabled')
              : i18n.t('options.behavior.disabled')}
          </Toggle>
        </div>

        <div className="flex items-center justify-between gap-4 py-3.5 last:pb-0">
          <div className="space-y-0.5">
            <div className="text-xs font-medium">
              {i18n.t('options.behavior.designOverlayLockedByDefault')}
            </div>
            <div className="text-xs text-muted-foreground">
              {i18n.t(
                'options.behavior.designOverlayLockedByDefaultDescription',
              )}
            </div>
          </div>
          <Toggle
            size="sm"
            variant="outline"
            data-testid="toggle-design-overlay-locked"
            pressed={behavior.designOverlayLockedByDefault}
            onPressedChange={(designOverlayLockedByDefault) =>
              onChange({ designOverlayLockedByDefault })
            }
            className="h-7 min-w-22 text-xs"
          >
            {behavior.designOverlayLockedByDefault
              ? i18n.t('options.behavior.enabled')
              : i18n.t('options.behavior.disabled')}
          </Toggle>
        </div>
      </div>
    </section>
  );
}
