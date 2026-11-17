import { describe, expect, it } from 'vitest';
import {
  getElementLabel,
  isEditableTarget,
  isOverlayElement,
} from '@/lib/dom-utils';

describe('isOverlayElement', () => {
  it('returns true for null', () => {
    expect(isOverlayElement(null)).toBe(true);
  });

  it('returns true when element has id "frameit-root"', () => {
    const el = document.createElement('div');
    el.id = 'frameit-root';
    expect(isOverlayElement(el)).toBe(true);
  });

  it('returns true when element tag is "frameit-overlay"', () => {
    const el = document.createElement('frameit-overlay');
    expect(isOverlayElement(el)).toBe(true);
  });

  it('returns true when element is inside "frameit-overlay"', () => {
    const host = document.createElement('frameit-overlay');
    const child = document.createElement('button');
    host.appendChild(child);
    expect(isOverlayElement(child)).toBe(true);
  });

  it('returns true when element is inside ShadowRoot of frameit-overlay', () => {
    const host = document.createElement('frameit-overlay');
    const shadow = host.attachShadow({ mode: 'open' });
    const inner = document.createElement('div');
    shadow.appendChild(inner);
    expect(isOverlayElement(inner)).toBe(true);
  });

  it('returns false for third-party Shadow DOM elements', () => {
    const customEl = document.createElement('custom-widget');
    const shadow = customEl.attachShadow({ mode: 'open' });
    const inner = document.createElement('div');
    shadow.appendChild(inner);
    expect(isOverlayElement(inner)).toBe(false);
  });

  it('returns false for regular page elements', () => {
    const div = document.createElement('div');
    div.className = 'page-container';
    expect(isOverlayElement(div)).toBe(false);
  });
});

describe('isEditableTarget', () => {
  it('returns false for null or non-HTMLElement targets', () => {
    expect(isEditableTarget(null)).toBe(false);
    expect(isEditableTarget(window)).toBe(false);
    expect(isEditableTarget(document)).toBe(false);
  });

  it.each(['input', 'textarea', 'select'])(
    'returns true for <%s> element',
    (tag) => {
      const el = document.createElement(tag);
      expect(isEditableTarget(el)).toBe(true);
    },
  );

  it('returns true for contenteditable element', () => {
    const div = document.createElement('div');
    div.contentEditable = 'true';
    expect(isEditableTarget(div)).toBe(true);
  });

  it('returns false for regular non-editable elements', () => {
    const div = document.createElement('div');
    const button = document.createElement('button');
    expect(isEditableTarget(div)).toBe(false);
    expect(isEditableTarget(button)).toBe(false);
  });
});

describe('getElementLabel', () => {
  it('returns tag#id when element has an id', () => {
    const el = document.createElement('main');
    el.id = 'app-content';
    el.className = 'container mx-auto';
    expect(getElementLabel(el)).toBe('main#app-content');
  });

  it('returns tag with up to 2 short non-pseudo classes when no id is present', () => {
    const el = document.createElement('section');
    el.className = 'hover:bg-red-500 container mx-auto px-4 py-8';
    expect(getElementLabel(el)).toBe('section.container.mx-auto');
  });

  it('filters out classes exceeding maxClassLength', () => {
    const el = document.createElement('div');
    el.className = 'very-long-class-name-that-exceeds-limit wrapper';
    expect(getElementLabel(el, 20)).toBe('div.wrapper');
  });

  it('returns plain tag name when no id or matching classes exist', () => {
    const el = document.createElement('article');
    el.className = 'md:flex lg:grid';
    expect(getElementLabel(el)).toBe('article');
  });
});
