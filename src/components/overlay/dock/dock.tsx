import { CloseTool } from '@/components/overlay/dock/close-tool';
import { InspectTool } from '@/components/overlay/inspect/inspect-tool';
import { LayoutGuidesTool } from '@/components/overlay/layout-guides/layout-guides-tool';
import { Separator } from '@/components/ui/separator';
import type { LayoutGuidesToolProps } from '@/types/layout-guides';

export interface DockProps extends LayoutGuidesToolProps {
  onClose: () => void;
  holdToClose?: boolean;
}

export function Dock({ onClose, holdToClose = true, ...props }: DockProps) {
  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto flex items-center bg-background border shadow-lg rounded-lg p-2 gap-2 z-50">
      <InspectTool
        active={props.isInspectActive}
        onToggle={props.onToggleInspect}
      />
      <LayoutGuidesTool {...props} />
      <Separator orientation="vertical" className="my-1.5" />
      <CloseTool onClose={onClose} holdToClose={holdToClose} />
    </nav>
  );
}
