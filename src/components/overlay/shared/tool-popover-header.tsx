import { X } from 'lucide-react';
import type * as React from 'react';
import { Button } from '@/components/ui/button';

export interface ToolPopoverHeaderProps {
  title: React.ReactNode;
  actions?: React.ReactNode;
  onClose: () => void;
}

/**
 * Shared header layout for Dock tool popovers (title/selector on left, actions + close on right).
 */
export function ToolPopoverHeader({
  title,
  actions,
  onClose,
}: ToolPopoverHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-xs font-medium">
        {title}
      </div>

      <div className="flex items-center gap-0.5">
        {actions}
        <Button
          variant="ghost"
          size="icon"
          className="size-6 text-muted-foreground hover:text-foreground"
          onClick={onClose}
          aria-label={i18n.t('guides.header.closeAriaLabel')}
        >
          <X className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
