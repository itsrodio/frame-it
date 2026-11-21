import { Keyboard, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import {
  DEFAULT_HOTKEYS,
  eventToHotkeyBinding,
  formatHotkey,
  HOTKEY_ACTIONS,
  isHotkeyEqual,
} from '@/lib/hotkeys';
import type { ExtensionHotkeys, HotkeyAction } from '@/types/settings';

const HOTKEY_LABEL_KEYS = {
  toggleGuides: 'options.hotkeys.toggleGuides',
  toggleInspect: 'options.hotkeys.toggleInspect',
  autoDetect: 'options.hotkeys.autoDetect',
  pickContainer: 'options.hotkeys.pickContainer',
  switchColumns: 'options.hotkeys.switchColumns',
  switchRows: 'options.hotkeys.switchRows',
  switchGrid: 'options.hotkeys.switchGrid',
} as const;

export interface HotkeysSettingsSectionProps {
  hotkeys: ExtensionHotkeys;
  onChange: (hotkeys: ExtensionHotkeys) => void;
}

export function HotkeysSettingsSection({
  hotkeys,
  onChange,
}: HotkeysSettingsSectionProps) {
  const [recordingAction, setRecordingAction] = useState<HotkeyAction | null>(
    null,
  );

  useEffect(() => {
    if (!recordingAction) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        setRecordingAction(null);
        return;
      }

      const binding = eventToHotkeyBinding(e);
      if (!binding) return;

      onChange({
        ...hotkeys,
        [recordingAction]: binding,
      });
      setRecordingAction(null);
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [hotkeys, onChange, recordingAction]);

  return (
    <section className="rounded-xl border bg-card p-6 shadow-xs">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Keyboard className="size-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">
              {i18n.t('options.hotkeys.title')}
            </h2>
            <p className="text-xs text-muted-foreground">
              {i18n.t('options.hotkeys.description')}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="xs"
          data-testid="reset-hotkeys"
          onClick={() => {
            setRecordingAction(null);
            onChange(DEFAULT_HOTKEYS);
          }}
        >
          <RotateCcw className="size-3" />
          {i18n.t('options.hotkeys.resetHotkeys')}
        </Button>
      </div>

      <div className="divide-y">
        <div className="flex items-center justify-between gap-4 pb-4">
          <div className="space-y-0.5">
            <div className="text-xs font-medium">
              {i18n.t('options.hotkeys.enableHotkeys')}
            </div>
            <div className="text-xs text-muted-foreground">
              {i18n.t('options.hotkeys.enableHotkeysDescription')}
            </div>
          </div>
          <Toggle
            size="sm"
            variant="outline"
            data-testid="toggle-hotkeys-enabled"
            pressed={hotkeys.enabled}
            onPressedChange={(enabled) => {
              setRecordingAction(null);
              onChange({
                ...hotkeys,
                enabled,
              });
            }}
            className="h-7 min-w-22 text-xs"
          >
            {hotkeys.enabled
              ? i18n.t('options.behavior.enabled')
              : i18n.t('options.behavior.disabled')}
          </Toggle>
        </div>

        {HOTKEY_ACTIONS.map((action) => {
          const binding = hotkeys[action];
          const defaultBinding = DEFAULT_HOTKEYS[action];
          const isRecording = recordingAction === action;
          const isModified = !isHotkeyEqual(binding, defaultBinding);

          return (
            <div
              key={action}
              className="flex items-center justify-between gap-4 py-3 last:pb-0"
            >
              <span className="text-xs font-medium">
                {i18n.t(HOTKEY_LABEL_KEYS[action])}
              </span>

              <div className="flex items-center gap-1.5">
                {isModified && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    data-testid={`reset-hotkey-${action}`}
                    onClick={() =>
                      onChange({
                        ...hotkeys,
                        [action]: defaultBinding,
                      })
                    }
                    aria-label={i18n.t('options.hotkeys.resetHotkeys')}
                  >
                    <RotateCcw className="size-3 text-muted-foreground" />
                  </Button>
                )}

                <Button
                  variant={isRecording ? 'default' : 'outline'}
                  size="sm"
                  disabled={!hotkeys.enabled}
                  data-testid={`hotkey-record-${action}`}
                  onClick={() =>
                    setRecordingAction(isRecording ? null : action)
                  }
                  className="h-7 min-w-28 font-mono text-xs"
                >
                  {isRecording
                    ? i18n.t('options.hotkeys.pressKeys')
                    : formatHotkey(binding)}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
