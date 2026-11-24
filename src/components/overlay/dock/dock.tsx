import { cn } from 'cn';
import { DesignOverlayTool } from '@/components/overlay/design-overlay/design-overlay-tool';
import { CloseTool } from '@/components/overlay/dock/close-tool';
import { HelpTool } from '@/components/overlay/dock/help-tool';
import { PageExportTool } from '@/components/overlay/dock/page-export-tool';
import { InspectTool } from '@/components/overlay/inspect/inspect-tool';
import { LayoutGuidesTool } from '@/components/overlay/layout-guides/layout-guides-tool';
import type { TourStepId } from '@/components/overlay/tour/onboarding-tour';
import { Separator } from '@/components/ui/separator';
import { DEFAULT_HOTKEYS } from '@/lib/hotkeys';
import type { DesignOverlayToolProps } from '@/types/design-overlay';
import type { LayoutGuidesToolProps } from '@/types/layout-guides';
import type {
  ExtensionHotkeys,
  ExtensionInspectSettings,
} from '@/types/settings';

export interface DockProps extends LayoutGuidesToolProps {
  inspectSettings?: ExtensionInspectSettings;
  defaultInspectSettings?: ExtensionInspectSettings;
  onUpdateInspectSettings?: (patch: Partial<ExtensionInspectSettings>) => void;
  onResetInspectSettings?: () => void;
  designOverlay?: DesignOverlayToolProps;
  hotkeys?: ExtensionHotkeys;
  activeTourStep?: TourStepId | null;
  onStartTour?: () => void;
  onClose: () => void;
  holdToClose?: boolean;
}

const TOUR_HIGHLIGHT_CLASS =
  'ring-2 ring-primary ring-offset-2 ring-offset-background';

export function Dock({
  inspectSettings,
  defaultInspectSettings,
  onUpdateInspectSettings,
  onResetInspectSettings,
  designOverlay,
  hotkeys = DEFAULT_HOTKEYS,
  activeTourStep = null,
  onStartTour,
  onClose,
  holdToClose = true,
  ...props
}: DockProps) {
  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto flex items-center bg-background border shadow-lg rounded-lg p-2 gap-2 z-50">
      <div
        data-tour-step="inspect"
        className={cn(
          'rounded-md transition-shadow',
          activeTourStep === 'inspect' && TOUR_HIGHLIGHT_CLASS,
        )}
      >
        <InspectTool
          active={props.isInspectActive}
          inspectSettings={inspectSettings}
          defaultInspectSettings={defaultInspectSettings}
          onToggle={props.onToggleInspect}
          onUpdateInspectSettings={onUpdateInspectSettings}
          onResetInspectSettings={onResetInspectSettings}
        />
      </div>

      <div
        data-tour-step="guides"
        className={cn(
          'rounded-md transition-shadow',
          activeTourStep === 'guides' && TOUR_HIGHLIGHT_CLASS,
        )}
      >
        <LayoutGuidesTool {...props} />
      </div>

      {designOverlay && (
        <div
          data-tour-step="design-overlay"
          className={cn(
            'rounded-md transition-shadow',
            activeTourStep === 'design-overlay' && TOUR_HIGHLIGHT_CLASS,
          )}
        >
          <DesignOverlayTool {...designOverlay} />
        </div>
      )}

      <div
        data-tour-step="page-export"
        className={cn(
          'rounded-md transition-shadow',
          activeTourStep === 'page-export' && TOUR_HIGHLIGHT_CLASS,
        )}
      >
        <PageExportTool />
      </div>

      <div
        data-tour-step="help"
        className={cn(
          'rounded-md transition-shadow',
          activeTourStep === 'help' && TOUR_HIGHLIGHT_CLASS,
        )}
      >
        <HelpTool hotkeys={hotkeys} onStartTour={onStartTour ?? (() => {})} />
      </div>

      <Separator orientation="vertical" className="my-1.5" />
      <CloseTool onClose={onClose} holdToClose={holdToClose} />
    </nav>
  );
}
