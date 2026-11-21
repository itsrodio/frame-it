import { CloseTool } from '@/components/overlay/dock/close-tool';
import { InspectTool } from '@/components/overlay/inspect/inspect-tool';
import { LayoutGuidesTool } from '@/components/overlay/layout-guides/layout-guides-tool';
import { Separator } from '@/components/ui/separator';
import type { LayoutGuidesToolProps } from '@/types/layout-guides';
import type { ExtensionInspectSettings } from '@/types/settings';

export interface DockProps extends LayoutGuidesToolProps {
  inspectSettings?: ExtensionInspectSettings;
  defaultInspectSettings?: ExtensionInspectSettings;
  onUpdateInspectSettings?: (patch: Partial<ExtensionInspectSettings>) => void;
  onResetInspectSettings?: () => void;
  onClose: () => void;
  holdToClose?: boolean;
}

export function Dock({
  inspectSettings,
  defaultInspectSettings,
  onUpdateInspectSettings,
  onResetInspectSettings,
  onClose,
  holdToClose = true,
  ...props
}: DockProps) {
  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto flex items-center bg-background border shadow-lg rounded-lg p-2 gap-2 z-50">
      <InspectTool
        active={props.isInspectActive}
        inspectSettings={inspectSettings}
        defaultInspectSettings={defaultInspectSettings}
        onToggle={props.onToggleInspect}
        onUpdateInspectSettings={onUpdateInspectSettings}
        onResetInspectSettings={onResetInspectSettings}
      />
      <LayoutGuidesTool {...props} />
      <Separator orientation="vertical" className="my-1.5" />
      <CloseTool onClose={onClose} holdToClose={holdToClose} />
    </nav>
  );
}
