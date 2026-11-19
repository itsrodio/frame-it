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
      window.dispatchEvent(
        new MouseEvent('mousemove', { clientX: 114, shiftKey: true }),
      );
    });
    // deltaX = 14 -> round(14/2)=7 * 10 = 70 -> clamped to max 24
    expect(onChange).toHaveBeenLastCalledWith(24);

    act(() => {
      window.dispatchEvent(new MouseEvent('mouseup'));
    });
  });

  it('ignores non-left click and disabled state for scrubbing and keyboard', () => {
    const onChange = vi.fn();

    act(() => {
      root.render(
        <ScrubbableNumberField
          id="test-disabled"
          label="Disabled"
          value={10}
          disabled={true}
          displayValue="Auto"
          onChange={onChange}
        />,
      );
    });

    const label = container.querySelector('label') as HTMLLabelElement;
    const input = container.querySelector('#test-disabled') as HTMLInputElement;
    expect(input.type).toBe('text');
    expect(input.value).toBe('Auto');

    act(() => {
      label.dispatchEvent(
        new MouseEvent('mousedown', { button: 0, clientX: 100, bubbles: true }),
      );
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 150 }));
      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }),
      );
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('handles typing, draft commit on blur/Enter, clamping out-of-bounds draft, and Escape cancel', () => {
    const onChange = vi.fn();
    const setNativeValue = (el: HTMLInputElement, val: string) => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value',
      )?.set;
      setter?.call(el, val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };

    act(() => {
      root.render(
        <ScrubbableNumberField
          id="test-draft"
          label="Margin"
          value={20}
          min={5}
          max={100}
          onChange={onChange}
        />,
      );
    });

    const input = container.querySelector('#test-draft') as HTMLInputElement;

    // Focus and type an in-range value -> immediate onChange
    act(() => {
      input.focus();
      setNativeValue(input, '45');
    });
    expect(onChange).toHaveBeenLastCalledWith(45);

    // Type an out-of-range value -> does not trigger onChange until blur clamps it
    onChange.mockClear();
    act(() => {
      setNativeValue(input, '250');
    });
    expect(onChange).not.toHaveBeenCalled();

    // Press Enter -> blurs and commits clamped value (100)
    act(() => {
      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
      );
      input.blur();
    });
    expect(onChange).toHaveBeenLastCalledWith(100);

    // Type empty or '-' and blur -> discards draft without calling onChange
    onChange.mockClear();
    act(() => {
      input.focus();
      setNativeValue(input, '-');
      input.blur();
    });
    expect(onChange).not.toHaveBeenCalled();

    // Type draft and press Escape -> resets draft state
    onChange.mockClear();
    act(() => {
      setNativeValue(input, '999');
    });
    act(() => {
      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      );
    });
    expect(input.value).toBe('20');
  });
});
