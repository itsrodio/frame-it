import { Bug, CircleHelp, ExternalLink, Lightbulb, Star } from 'lucide-react';
import { OptionsSectionCard } from '@/components/options/options-section-card';
import { Badge } from '@/components/ui/badge';
import {
  BUG_REPORT_URL,
  CHROME_WEB_STORE_URL,
  FEATURE_REQUEST_URL,
  getExtensionVersion,
} from '@/lib/links';

export function AboutFeedbackSection() {
  const version = getExtensionVersion();

  return (
    <OptionsSectionCard
      icon={CircleHelp}
      title={i18n.t('options.about.title')}
      description={i18n.t('options.about.description')}
      action={
        <Badge variant="secondary" className="font-mono text-[11px]">
          v{version}
        </Badge>
      }
    >
      <div className="grid gap-2 sm:grid-cols-3">
        <a
          href={BUG_REPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="options-report-bug"
          className="flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2.5 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <span className="flex items-center gap-2">
            <Bug
              className="size-3.5 text-muted-foreground"
              aria-hidden="true"
            />
            <span>{i18n.t('help.reportBug')}</span>
          </span>
          <ExternalLink
            className="size-3 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        </a>

        <a
          href={FEATURE_REQUEST_URL}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="options-feature-request"
          className="flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2.5 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <span className="flex items-center gap-2">
            <Lightbulb
              className="size-3.5 text-muted-foreground"
              aria-hidden="true"
            />
            <span>{i18n.t('help.requestFeature')}</span>
          </span>
          <ExternalLink
            className="size-3 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        </a>

        <a
          href={CHROME_WEB_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="options-rate-store"
          className="flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2.5 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <span className="flex items-center gap-2">
            <Star
              className="size-3.5 text-muted-foreground"
              aria-hidden="true"
            />
            <span>{i18n.t('help.rateStore')}</span>
          </span>
          <ExternalLink
            className="size-3 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        </a>
      </div>
    </OptionsSectionCard>
  );
}
