import { act } from 'react';
import ReactDOM from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ScrubbableNumberField } from '@/components/overlay/layout-guides/scrubbable-number-field';

describe('ScrubbableNumberField', () => {
  let container: HTMLDivElement;
  let root: ReactDOM.Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = ReactDOM.createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('increments and decrements with ArrowUp/ArrowDown and 10x with Shift', () => {
    const onChange = vi.fn();

    act(() => {
      root.render(
        <ScrubbableNumberField
          id="test-num"
          label="Gutter"
          value={16}
          min={0}
          max={100}
          onChange={onChange}
        />,
      );
    });

    const input = container.querySelector('#test-num') as HTMLInputElement;
    expect(input).not.toBeNull();

    act(() => {
      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }),
      );
    });
    expect(onChange).toHaveBeenLastCalledWith(17);

    act(() => {
      input.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'ArrowDown',
          shiftKey: true,
          bubbles: true,
        }),
      );
    });
    expect(onChange).toHaveBeenLastCalledWith(6);
  });

  it('scrubs value horizontally when dragging the label and clamps within [min, max]', () => {
    const onChange = vi.fn();

    act(() => {
      root.render(
        <ScrubbableNumberField
          id="test-scrub"
          label="Count"
          value={12}
          min={1}
          max={24}
          onChange={onChange}
        />,
      );
    });

    const label = container.querySelector('label') as HTMLLabelElement;
    expect(label).not.toBeNull();

    act(() => {
      label.dispatchEvent(
        new MouseEvent('mousedown', { button: 0, clientX: 100, bubbles: true }),
      );
    });

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 110 }));
    });
    // deltaX = 10 -> deltaSteps = 5 -> 12 + 5 = 17
    expect(onChange).toHaveBeenLastCalledWith(17);

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200 }));
    });
    // Clamped to max 24
    expect(onChange).toHaveBeenLastCalledWith(24);

    act(() => {
      window.dispatchEvent(new MouseEvent('mouseup'));
    });
  });
});
