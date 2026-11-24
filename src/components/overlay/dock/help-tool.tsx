import {
  Bug,
  CircleHelp,
  Compass,
  ExternalLink,
  Keyboard,
  Lightbulb,
  Settings,
  Star,
} from 'lucide-react';
import { useState } from 'react';
import { ToolPopoverHeader } from '@/components/overlay/shared/tool-popover-header';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatHotkey } from '@/lib/hotkeys';
import {
  BUG_REPORT_URL,
  CHROME_WEB_STORE_URL,
  FEATURE_REQUEST_URL,
  getExtensionVersion,
  openExtensionOptionsPage,
} from '@/lib/links';
import type { ExtensionHotkeys, HotkeyAction } from '@/types/settings';

const SHORTCUT_SUMMARY_ACTIONS: Array<{
  action: HotkeyAction;
  labelKey:
    | 'options.hotkeys.toggleGuides'
    | 'options.hotkeys.toggleInspect'
    | 'options.hotkeys.autoDetect'
    | 'options.hotkeys.pickContainer'
    | 'options.hotkeys.toggleDesignOverlay'
    | 'options.hotkeys.toggleDesignOverlayLock';
}> = [
  { action: 'toggleGuides', labelKey: 'options.hotkeys.toggleGuides' },
  { action: 'toggleInspect', labelKey: 'options.hotkeys.toggleInspect' },
  { action: 'autoDetect', labelKey: 'options.hotkeys.autoDetect' },
  { action: 'pickContainer', labelKey: 'options.hotkeys.pickContainer' },
  {
    action: 'toggleDesignOverlay',
    labelKey: 'options.hotkeys.toggleDesignOverlay',
  },
  {
    action: 'toggleDesignOverlayLock',
    labelKey: 'options.hotkeys.toggleDesignOverlayLock',
  },
];

export interface HelpToolProps {
  hotkeys: ExtensionHotkeys;
  onStartTour: () => void;
  onOpenOptions?: () => void;
}

export function HelpTool({
  hotkeys,
  onStartTour,
  onOpenOptions = () => void openExtensionOptionsPage(),
}: HelpToolProps) {
  const [open, setOpen] = useState(false);
  const version = getExtensionVersion();

  const handleStartTour = () => {
    setOpen(false);
    onStartTour();
  };

  const handleOpenOptions = () => {
    setOpen(false);
    onOpenOptions();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  data-testid="help-popover-trigger"
                  aria-label={i18n.t('dock.help.ariaLabel')}
                >
                  <CircleHelp className="h-4 w-4" aria-hidden="true" />
                </Button>
              }
            />
          }
        />
        <TooltipContent className="w-fit whitespace-nowrap">
          {i18n.t('dock.help.tooltip')}
        </TooltipContent>
      </Tooltip>

      <PopoverContent align="end" className="w-76 p-0">
        <ToolPopoverHeader
          title={
            <>
              <CircleHelp
                className="size-3.5 text-muted-foreground"
                aria-hidden="true"
              />
              <span>{i18n.t('help.title')}</span>
            </>
          }
          onClose={() => setOpen(false)}
        />

        <div className="space-y-3 p-3">
          <Button
            variant="secondary"
            size="sm"
            data-testid="help-start-tour"
            className="h-8 w-full justify-start gap-2 px-2.5 text-xs"
            onClick={handleStartTour}
          >
            <Compass className="size-3.5 text-primary" aria-hidden="true" />
            <span>{i18n.t('help.startTour')}</span>
          </Button>

          <div className="space-y-1.5 border-t pt-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <Keyboard className="size-3" aria-hidden="true" />
                <span>{i18n.t('help.shortcutsTitle')}</span>
              </div>
              <Button
                variant="ghost"
                size="xs"
                data-testid="help-open-options"
                className="h-6 gap-1 px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                onClick={handleOpenOptions}
              >
                <Settings className="size-3" aria-hidden="true" />
                <span>{i18n.t('help.configureOptions')}</span>
              </Button>
            </div>

            {hotkeys.enabled ? (
              <ul
                data-testid="help-shortcuts-list"
                className="space-y-1 text-xs"
              >
                {SHORTCUT_SUMMARY_ACTIONS.map(({ action, labelKey }) => (
                  <li
                    key={action}
                    className="flex items-center justify-between gap-2 py-0.5"
                  >
                    <span className="truncate text-[11px] text-foreground/90">
                      {i18n.t(labelKey)}
                    </span>
                    <kbd className="shrink-0 rounded border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                      {formatHotkey(hotkeys[action])}
                    </kbd>
                  </li>
                ))}
              </ul>
            ) : (
              <p
                data-testid="help-shortcuts-disabled"
                className="text-[11px] text-muted-foreground"
              >
                {i18n.t('help.shortcutsDisabled')}
              </p>
            )}
          </div>

          <div className="space-y-0.5 border-t pt-2.5">
            <div className="px-2 pb-1 text-[11px] font-medium text-muted-foreground">
              {i18n.t('help.feedbackTitle')}
            </div>

            <a
              href={BUG_REPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="help-report-bug"
              className="flex h-7 items-center justify-between rounded-md px-2 text-xs text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <span className="flex items-center gap-2">
                <Bug
                  className="size-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
                <span>{i18n.t('help.reportBug')}</span>
              </span>
              <ExternalLink
                className="size-3 text-muted-foreground"
                aria-hidden="true"
              />
            </a>

            <a
              href={FEATURE_REQUEST_URL}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="help-feature-request"
              className="flex h-7 items-center justify-between rounded-md px-2 text-xs text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <span className="flex items-center gap-2">
                <Lightbulb
                  className="size-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
                <span>{i18n.t('help.requestFeature')}</span>
              </span>
              <ExternalLink
                className="size-3 text-muted-foreground"
                aria-hidden="true"
              />
            </a>

            <a
              href={CHROME_WEB_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="help-rate-store"
              className="flex h-7 items-center justify-between rounded-md px-2 text-xs text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <span className="flex items-center gap-2">
                <Star
                  className="size-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
                <span>{i18n.t('help.rateStore')}</span>
              </span>
              <ExternalLink
                className="size-3 text-muted-foreground"
                aria-hidden="true"
              />
            </a>
          </div>
        </div>

        <div
          data-testid="help-version"
          className="flex items-center justify-between border-t px-3 py-2 text-[11px] text-muted-foreground"
        >
          <span>{i18n.t('extName')}</span>
          <span className="font-mono">v{version}</span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
