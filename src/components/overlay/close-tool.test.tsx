import { act } from 'react';
import ReactDOM from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CloseTool } from '@/components/overlay/close-tool';
import { TooltipProvider } from '@/components/ui/tooltip';

describe('CloseTool', () => {
  let container: HTMLDivElement;
  let root: ReactDOM.Root;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = ReactDOM.createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.useRealTimers();
  });

  it('does not call onClose if released before 450ms, and calls onClose after holding for 450ms', () => {
    const onClose = vi.fn();

    act(() => {
      root.render(
        <TooltipProvider>
          <CloseTool onClose={onClose} />
        </TooltipProvider>,
      );
    });

    const btn = container.querySelector(
      'button[aria-label="Hold to close FrameIt"]',
    ) as HTMLButtonElement;
    expect(btn).not.toBeNull();

    // Hold for 200ms then release via keyboard
    act(() => {
      btn.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
      );
    });
    act(() => {
      vi.advanceTimersByTime(200);
      btn.dispatchEvent(
        new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }),
      );
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onClose).not.toHaveBeenCalled();

    // Hold for full 450ms
    act(() => {
      btn.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
      );
    });
    act(() => {
      vi.advanceTimersByTime(450);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes immediately on single click when holdToClose is false', () => {
    const onClose = vi.fn();

    act(() => {
      root.render(
        <TooltipProvider>
          <CloseTool onClose={onClose} holdToClose={false} />
        </TooltipProvider>,
      );
    });

    const btn = container.querySelector(
      'button[aria-label="Close FrameIt"]',
    ) as HTMLButtonElement;
    expect(btn).not.toBeNull();

    act(() => {
      btn.click();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
