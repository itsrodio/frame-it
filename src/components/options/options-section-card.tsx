import type { LucideIcon } from 'lucide-react';
import type * as React from 'react';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export interface OptionsSectionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Shared Card layout for sections on the Extension Options page.
 */
export function OptionsSectionCard({
  icon: Icon,
  title,
  description,
  action,
  children,
}: OptionsSectionCardProps) {
  return (
    <Card>
      <CardHeader className="gap-1.5">
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-4" />
          </div>
          <div className="space-y-0.5">
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
        </div>
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent className="gap-0">{children}</CardContent>
    </Card>
  );
}
