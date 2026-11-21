import { Lock, Scroll } from 'lucide-react';
import { Field, FieldLabel } from '@/components/ui/field';
import { Toggle } from '@/components/ui/toggle';

export interface FollowScrollFieldProps {
  label?: string;
  followScroll: boolean;
  onChange: (followScroll: boolean) => void;
  testId?: string;
}

/**
 * Shared horizontal field row toggling between scroll-with-page and fixed-to-viewport modes.
 */
export function FollowScrollField({
  label = i18n.t('guides.fields.position'),
  followScroll,
  onChange,
  testId,
}: FollowScrollFieldProps) {
  return (
    <Field orientation="horizontal">
      <FieldLabel className="w-2/5 text-xs text-muted-foreground">
        {label}
      </FieldLabel>
      <div className="flex w-3/5 items-center gap-1">
        <Toggle
          size="sm"
          variant="outline"
          data-testid={testId}
          pressed={followScroll}
          onPressedChange={onChange}
          className="h-7 w-full gap-1.5 text-xs"
        >
          {followScroll ? (
            <>
              <Scroll className="size-3 shrink-0" />
              <span className="truncate">
                {i18n.t('guides.position.scrollWithPage')}
              </span>
            </>
          ) : (
            <>
              <Lock className="size-3 shrink-0" />
              <span className="truncate">
                {i18n.t('guides.position.fixedToViewport')}
              </span>
            </>
          )}
        </Toggle>
      </div>
    </Field>
  );
}
