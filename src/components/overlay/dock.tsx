import { CloseTool } from '@/components/overlay/close-tool';
import { InspectTool } from '@/components/overlay/inspect-tool';
import { LayoutGuidesTool } from '@/components/overlay/layout-guides-tool';
import { Separator } from '@/components/ui/separator';
import type { LayoutGuidesToolProps } from '@/types/layout-guides';

export interface DockProps extends LayoutGuidesToolProps {
	onClose: () => void;
}

export function Dock({ onClose, ...props }: DockProps) {
	return (
		<nav className="fixed bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto flex items-center bg-background border shadow-lg rounded-lg p-2 gap-2">
			<InspectTool />
			<LayoutGuidesTool {...props} />
			<Separator orientation="vertical" className="my-1.5" />
			<CloseTool onClose={onClose} />
		</nav>
	);
}
