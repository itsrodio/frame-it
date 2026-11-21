import { useEffect } from 'react';
import { isEditableTarget } from '@/lib/dom-utils';
import { matchesHotkey } from '@/lib/hotkeys';
import type { GuideType } from '@/types/layout-guides';
import type { ExtensionHotkeys } from '@/types/settings';

export interface UseGlobalHotkeysOptions {
  hotkeys: ExtensionHotkeys;
  portalContainer: HTMLElement;
  onToggleGuides: () => void;
  onToggleInspect: () => void;
  onAutoDetect: () => void;
  onTogglePickContainer: () => void;
  onSwitchGuideType: (type: GuideType) => void;
  onToggleDesignOverlay?: () => void;
  onToggleDesignOverlayLock?: () => void;
}

export function useGlobalHotkeys({
  hotkeys,
  portalContainer,
  onToggleGuides,
  onToggleInspect,
  onAutoDetect,
  onTogglePickContainer,
  onSwitchGuideType,
  onToggleDesignOverlay,
  onToggleDesignOverlayLock,
}: UseGlobalHotkeysOptions) {
  useEffect(() => {
    if (!hotkeys.enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const shadowActive =
        portalContainer.getRootNode() instanceof ShadowRoot
          ? (portalContainer.getRootNode() as ShadowRoot).activeElement
          : null;
      if (isEditableTarget(e.target) || isEditableTarget(shadowActive)) {
        return;
      }

      // Shift+G (or custom binding) or Ctrl+; (Figma-style) toggles layout guides.
      if (
        matchesHotkey(e, hotkeys.toggleGuides) ||
        ((e.ctrlKey || e.metaKey) &&
          !e.shiftKey &&
          !e.altKey &&
          e.code === 'Semicolon')
      ) {
        e.preventDefault();
        onToggleGuides();
        return;
      }

      if (matchesHotkey(e, hotkeys.toggleInspect)) {
        e.preventDefault();
        onToggleInspect();
        return;
      }

      if (matchesHotkey(e, hotkeys.autoDetect)) {
        e.preventDefault();
        onAutoDetect();
        return;
      }

      if (matchesHotkey(e, hotkeys.pickContainer)) {
        e.preventDefault();
        onTogglePickContainer();
        return;
      }

      if (
        onToggleDesignOverlay &&
        matchesHotkey(e, hotkeys.toggleDesignOverlay)
      ) {
        e.preventDefault();
        onToggleDesignOverlay();
        return;
      }

      if (
        onToggleDesignOverlayLock &&
        matchesHotkey(e, hotkeys.toggleDesignOverlayLock)
      ) {
        e.preventDefault();
        onToggleDesignOverlayLock();
        return;
      }

      if (matchesHotkey(e, hotkeys.switchColumns)) {
        e.preventDefault();
        onSwitchGuideType('columns');
      } else if (matchesHotkey(e, hotkeys.switchRows)) {
        e.preventDefault();
        onSwitchGuideType('rows');
      } else if (matchesHotkey(e, hotkeys.switchGrid)) {
        e.preventDefault();
        onSwitchGuideType('grid');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    hotkeys,
    onAutoDetect,
    onSwitchGuideType,
    onToggleDesignOverlay,
    onToggleDesignOverlayLock,
    onToggleGuides,
    onToggleInspect,
    onTogglePickContainer,
    portalContainer,
  ]);
}
