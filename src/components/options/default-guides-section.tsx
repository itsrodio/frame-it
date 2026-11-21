import { Columns3, Grid2X2, RotateCcw, Rows3 } from 'lucide-react';
import { useState } from 'react';
import { OptionsSectionCard } from '@/components/options/options-section-card';
import { GridGuideFields } from '@/components/overlay/layout-guides/grid-guide-fields';
import { LayoutGuidesOverlay } from '@/components/overlay/layout-guides/layout-guides-overlay';
import { LinearGuideFields } from '@/components/overlay/layout-guides/linear-guide-fields';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { buildColorOpacityProps } from '@/lib/guide-utils';
import { DEFAULT_EXTENSION_SETTINGS } from '@/lib/settings-storage';
import type {
  BaseGuideSettings,
  GridGuideSettings,
  GuideType,
  LinearGuideSettings,
} from '@/types/layout-guides';
import type { ExtensionDefaultGuides } from '@/types/settings';

export interface DefaultGuidesSectionProps {
  defaultGuides: ExtensionDefaultGuides;
  onChange: (
    updater: (prev: ExtensionDefaultGuides) => ExtensionDefaultGuides,
  ) => void;
}

export function DefaultGuidesSection({
  defaultGuides,
  onChange,
}: DefaultGuidesSectionProps) {
  const [activeDefaultTab, setActiveDefaultTab] =
    useState<GuideType>('columns');

  const updateDefaultColumns = (patch: Partial<LinearGuideSettings>) => {
    onChange((prev) => ({
      ...prev,
      columns: {
        ...prev.columns,
        ...patch,
      },
    }));
  };

  const updateDefaultRows = (patch: Partial<LinearGuideSettings>) => {
    onChange((prev) => ({
      ...prev,
      rows: {
        ...prev.rows,
        ...patch,
      },
    }));
  };

  const updateDefaultGrid = (patch: Partial<GridGuideSettings>) => {
    onChange((prev) => ({
      ...prev,
      grid: {
        ...prev.grid,
        ...patch,
      },
    }));
  };

  const activeDefaultSettings = defaultGuides[activeDefaultTab];
  const updateActiveDefaultBase = (patch: Partial<BaseGuideSettings>) => {
    if (activeDefaultTab === 'columns') updateDefaultColumns(patch);
    else if (activeDefaultTab === 'rows') updateDefaultRows(patch);
    else updateDefaultGrid(patch);
  };

  const colorOpacityProps = buildColorOpacityProps(
    activeDefaultSettings,
    updateActiveDefaultBase,
  );

  const guideTabs = [
    {
      value: 'columns',
      label: i18n.t('guides.types.columns'),
      icon: Columns3,
    },
    {
      value: 'rows',
      label: i18n.t('guides.types.rows'),
      icon: Rows3,
    },
    {
      value: 'grid',
      label: i18n.t('guides.types.grid'),
      icon: Grid2X2,
    },
  ] as const;

  return (
    <OptionsSectionCard
      icon={Columns3}
      title={i18n.t('options.defaults.title')}
      description={i18n.t('options.defaults.description')}
      action={
        <Button
          variant="outline"
          size="xs"
          data-testid="reset-default-guides"
          onClick={() =>
            onChange(() => DEFAULT_EXTENSION_SETTINGS.defaultGuides)
          }
        >
          <RotateCcw className="size-3" />
          {i18n.t('options.defaults.resetDefaults')}
        </Button>
      }
    >
      <Tabs
        value={activeDefaultTab}
        onValueChange={(val) => setActiveDefaultTab(val as GuideType)}
        className="mb-5"
      >
        <TabsList>
          {guideTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                data-testid={`default-tab-${tab.value}`}
                className="px-3 text-xs"
              >
                <Icon className="size-3.5" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-background p-4">
          <FieldGroup className="gap-2.5">
            {activeDefaultTab === 'grid' ? (
              <GridGuideFields
                settings={defaultGuides.grid}
                onChange={updateDefaultGrid}
                {...colorOpacityProps}
              />
            ) : (
              <LinearGuideFields
                mode={activeDefaultTab}
                settings={defaultGuides[activeDefaultTab]}
                onChange={
                  activeDefaultTab === 'columns'
                    ? updateDefaultColumns
                    : updateDefaultRows
                }
                {...colorOpacityProps}
              />
            )}
          </FieldGroup>
        </div>

        <div className="flex flex-col rounded-lg border bg-muted/20 p-3">
          <div className="mb-2 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
            <span>{i18n.t('options.defaults.preview')}</span>
            <span className="font-mono">
              {activeDefaultTab === 'grid'
                ? `${defaultGuides.grid.size}px`
                : `${defaultGuides[activeDefaultTab].count} × ${defaultGuides[activeDefaultTab].gutter}px`}
            </span>
          </div>
          <div className="relative min-h-56 flex-1 overflow-hidden rounded-md border bg-background shadow-2xs">
            <LayoutGuidesOverlay
              state={{
                enabled: true,
                type: activeDefaultTab,
                columns: defaultGuides.columns,
                rows: defaultGuides.rows,
                grid: defaultGuides.grid,
              }}
              scroll={{ x: 0, y: 0 }}
            />
          </div>
        </div>
      </div>
    </OptionsSectionCard>
  );
}
