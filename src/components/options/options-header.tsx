import { Check, RotateCcw } from 'lucide-react';
import appIcon from '@/assets/icon.png';
import { Button } from '@/components/ui/button';

export interface OptionsHeaderProps {
  onResetAll: () => void;
}

export function OptionsHeader({ onResetAll }: OptionsHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs select-none">
            <img
              src={appIcon}
              alt={i18n.t('options.title')}
              className="size-full object-cover"
            />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            {i18n.t('options.title')}
          </h1>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <Check className="size-3" />
            {i18n.t('options.savedBadge')}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {i18n.t('options.subtitle')}
        </p>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onResetAll}
        data-testid="reset-all-settings"
      >
        <RotateCcw className="size-3.5" />
        {i18n.t('options.resetAll')}
      </Button>
    </header>
  );
}
