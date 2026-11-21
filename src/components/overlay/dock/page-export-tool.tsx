import { cn } from 'cn';
import {
  Camera,
  Check,
  ChevronDown,
  Copy,
  Download,
  Layers,
  Loader2,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  SegmentedControl,
  type SegmentedControlItem,
} from '@/components/overlay/shared/segmented-control';
import { ToolPopoverHeader } from '@/components/overlay/shared/tool-popover-header';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
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
import {
  copyBlobToClipboard,
  copyTextToClipboard,
  downloadBlobFile,
  downloadTextFile,
} from '@/lib/dom-utils';
import {
  buildPageExportFilename,
  buildPageFigmaSvg,
} from '@/lib/inspect-figma-svg';
import { captureFullPagePngBlob } from '@/lib/page-screenshot';

export type PageExportFormat = 'svg' | 'png';
export type PageExportAction = 'copy' | 'save';
type PageExportStatus = 'idle' | 'copied' | 'saved';

const FORMAT_ITEMS: Array<SegmentedControlItem<PageExportFormat>> = [
  { value: 'svg', label: 'SVG' },
  { value: 'png', label: 'PNG' },
];

export interface PageExportToolProps {
  onBuildPageSvg?: () => Promise<string>;
  onCapturePagePng?: () => Promise<Blob>;
  onCopySvg?: (svg: string) => Promise<boolean>;
  onCopyPng?: (blob: Blob) => Promise<boolean>;
  onSaveSvg?: (svg: string, filename: string) => void;
  onSavePng?: (blob: Blob, filename: string) => void;
}

export function PageExportTool({
  onBuildPageSvg = () => buildPageFigmaSvg(),
  onCapturePagePng = () => captureFullPagePngBlob(),
  onCopySvg = copyTextToClipboard,
  onCopyPng = copyBlobToClipboard,
  onSaveSvg = (svg, filename) => downloadTextFile(svg, filename),
  onSavePng = (blob, filename) => downloadBlobFile(blob, filename),
}: PageExportToolProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<PageExportFormat>('svg');
  const [exportingAction, setExportingAction] =
    useState<PageExportAction | null>(null);
  const [status, setStatus] = useState<PageExportStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const scheduleStatusReset = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setStatus('idle');
    }, 1400);
  }, []);

  const handleAction = useCallback(
    async (action: PageExportAction) => {
      if (exportingAction !== null) return;
      setExportingAction(action);
      setError(null);

      try {
        if (format === 'svg') {
          const svg = await onBuildPageSvg();
          if (!svg) {
            setError(i18n.t('pageExport.error'));
            setOpen(true);
            return;
          }
          if (action === 'copy') {
            const copied = await onCopySvg(svg);
            if (!copied) {
              setError(i18n.t('pageExport.error'));
              setOpen(true);
              return;
            }
            setStatus('copied');
          } else {
            onSaveSvg(
              svg,
              buildPageExportFilename(document, window.location, 'svg'),
            );
            setStatus('saved');
          }
        } else {
          const pngBlob = await onCapturePagePng();
          if (action === 'copy') {
            const copied = await onCopyPng(pngBlob);
            if (!copied) {
              setError(i18n.t('pageExport.error'));
              setOpen(true);
              return;
            }
            setStatus('copied');
          } else {
            onSavePng(
              pngBlob,
              buildPageExportFilename(document, window.location, 'png'),
            );
            setStatus('saved');
          }
        }

        setOpen(false);
        scheduleStatusReset();
      } catch {
        setError(i18n.t('pageExport.error'));
        setOpen(true);
      } finally {
        setExportingAction(null);
      }
    },
    [
      exportingAction,
      format,
      onBuildPageSvg,
      onCapturePagePng,
      onCopyPng,
      onCopySvg,
      onSavePng,
      onSaveSvg,
      scheduleStatusReset,
    ],
  );

  const isExporting = exportingAction !== null;
  const isCompleted = status !== 'idle';

  const tooltipText =
    status === 'copied'
      ? i18n.t('dock.pageExport.copiedTooltip')
      : status === 'saved'
        ? i18n.t('dock.pageExport.savedTooltip')
        : format === 'png'
          ? i18n.t('dock.pageExport.tooltipPng')
          : i18n.t('dock.pageExport.tooltipSvg');

  const FormatIcon = format === 'png' ? Camera : Layers;

  return (
    <div className="flex items-center">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              disabled={isExporting}
              data-testid="page-export-button"
              aria-label={i18n.t('dock.pageExport.ariaLabel')}
              onClick={() => void handleAction('copy')}
              className={cn(
                isCompleted && 'text-emerald-600 dark:text-emerald-400',
              )}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isCompleted ? (
                <Check className="h-4 w-4" />
              ) : (
                <FormatIcon className="h-4 w-4" />
              )}
            </Button>
          }
        />
        <TooltipContent className="w-fit whitespace-nowrap">
          {tooltipText}
        </TooltipContent>
      </Tooltip>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              className="px-1"
              data-testid="page-export-popover-trigger"
              aria-label={i18n.t('pageExport.title')}
            >
              <ChevronDown className="size-3" />
            </Button>
          }
        />
        <PopoverContent align="start" className="w-64 p-0">
          <ToolPopoverHeader
            title={
              <>
                <FormatIcon className="size-3.5 text-muted-foreground" />
                <span>{i18n.t('pageExport.title')}</span>
              </>
            }
            onClose={() => setOpen(false)}
          />

          <FieldGroup className="gap-2.5 p-3">
            <Field orientation="horizontal">
              <FieldLabel className="w-2/5 text-xs text-muted-foreground">
                {i18n.t('pageExport.format')}
              </FieldLabel>
              <div className="w-3/5">
                <SegmentedControl
                  items={FORMAT_ITEMS}
                  value={format}
                  testIdPrefix="page-export-format"
                  fullWidth
                  onValueChange={(nextFormat) => {
                    setFormat(nextFormat);
                    setStatus('idle');
                    setError(null);
                  }}
                />
              </div>
            </Field>

            <p className="text-[11px] text-muted-foreground">
              {format === 'png'
                ? i18n.t('pageExport.pngHint')
                : i18n.t('pageExport.svgHint')}
            </p>

            <div className="flex flex-col gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                disabled={isExporting}
                data-testid="page-export-save"
                className={cn(
                  'h-8 w-full justify-start gap-2 px-2.5 text-xs',
                  status === 'saved' &&
                    'text-emerald-600 dark:text-emerald-400',
                )}
                onClick={() => void handleAction('save')}
              >
                {exportingAction === 'save' ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : status === 'saved' ? (
                  <Check className="size-3.5" />
                ) : (
                  <Download className="size-3.5" />
                )}
                <span>
                  {status === 'saved'
                    ? i18n.t('pageExport.saved')
                    : format === 'png'
                      ? i18n.t('pageExport.savePng')
                      : i18n.t('pageExport.saveSvg')}
                </span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                disabled={isExporting}
                data-testid="page-export-copy"
                className={cn(
                  'h-8 w-full justify-start gap-2 px-2.5 text-xs font-normal',
                  status === 'copied' &&
                    'text-emerald-600 dark:text-emerald-400',
                )}
                onClick={() => void handleAction('copy')}
              >
                {exportingAction === 'copy' ? (
                  <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                ) : status === 'copied' ? (
                  <Check className="size-3.5" />
                ) : (
                  <Copy className="size-3.5 text-muted-foreground" />
                )}
                <span>
                  {status === 'copied'
                    ? i18n.t('inspect.card.copied')
                    : i18n.t('pageExport.copyClipboard')}
                </span>
              </Button>
            </div>

            {error && (
              <p
                data-testid="page-export-error"
                className="text-[11px] text-destructive"
              >
                {error}
              </p>
            )}
          </FieldGroup>
        </PopoverContent>
      </Popover>
    </div>
  );
}
