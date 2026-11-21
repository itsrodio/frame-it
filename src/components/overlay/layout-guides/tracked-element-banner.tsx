import { Link2Off } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface TrackedElementBannerProps {
  label: string;
  onClear?: () => void;
}

export function TrackedElementBanner({
  label,
  onClear,
}: TrackedElementBannerProps) {
  return (
    <div className="mb-1 flex items-center justify-between gap-1.5 rounded-md border border-primary/25 bg-primary/10 px-2 py-1 text-[11px]">
      <div className="flex min-w-0 items-center gap-1">
        <span className="size-1.5 shrink-0 rounded-full bg-primary" />
        <span className="truncate font-mono text-foreground">{label}</span>
      </div>
      {onClear && (
        <Button
          variant="ghost"
          size="icon-xs"
          className="size-5 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={onClear}
          title={i18n.t('guides.fields.unlinkElement')}
          aria-label={i18n.t('guides.fields.unlinkElement')}
        >
          <Link2Off className="size-3" />
        </Button>
      )}
    </div>
  );
}
