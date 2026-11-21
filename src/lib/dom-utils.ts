const OVERLAY_HOST_TAG = 'FRAMEIT-OVERLAY';
const OVERLAY_ROOT_ID = 'frameit-root';

/**
 * Checks whether an element belongs to the FrameIt overlay itself,
 * without blocking third-party Shadow DOM Web Components on the host page.
 */
export function isOverlayElement(el: Element | null): boolean {
  if (!el) return true;
  if (
    el.id === OVERLAY_ROOT_ID ||
    el.tagName === OVERLAY_HOST_TAG ||
    el.hasAttribute('data-frameit-design-overlay')
  ) {
    return true;
  }
  if (
    el.closest(OVERLAY_HOST_TAG.toLowerCase()) ||
    el.closest(`#${OVERLAY_ROOT_ID}`) ||
    el.closest('[data-frameit-design-overlay]')
  ) {
    return true;
  }
  const rootNode = el.getRootNode();
  if (rootNode instanceof ShadowRoot) {
    const host = rootNode.host;
    return (
      host.tagName === OVERLAY_HOST_TAG ||
      host.id === OVERLAY_ROOT_ID ||
      host.closest(OVERLAY_HOST_TAG.toLowerCase()) !== null
    );
  }
  return false;
}

/**
 * Checks whether focus is inside an editable field (input, textarea, select, contenteditable)
 * so global hotkeys do not intercept text typing.
 */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

/**
 * Builds a compact readable label for a DOM element (e.g., `div#app` or `section.container.mx-auto`).
 */
export function getElementLabel(el: HTMLElement, maxClassLength = 24): string {
  const tag = el.tagName.toLowerCase();
  if (el.id) {
    return `${tag}#${el.id}`;
  }
  const classes = Array.from(el.classList)
    .filter((c) => !c.includes(':') && c.length < maxClassLength)
    .slice(0, 2);
  if (classes.length > 0) {
    return `${tag}.${classes.join('.')}`;
  }
  return tag;
}

/**
 * Copies text to the system clipboard with a textarea execCommand fallback.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback to execCommand below
    }
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    textarea.remove();
    return ok;
  } catch {
    return false;
  }
}

/**
 * Copies a binary Blob (e.g. `image/png`) to the system clipboard.
 */
export async function copyBlobToClipboard(blob: Blob): Promise<boolean> {
  if (
    typeof navigator === 'undefined' ||
    !navigator.clipboard?.write ||
    typeof ClipboardItem === 'undefined'
  ) {
    return false;
  }

  try {
    await navigator.clipboard.write([
      new ClipboardItem({ [blob.type || 'image/png']: blob }),
    ]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Triggers a browser file download for a Blob payload.
 */
export function downloadBlobFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Triggers a browser file download for a text/SVG payload.
 */
export function downloadTextFile(
  content: string,
  filename: string,
  mimeType = 'image/svg+xml;charset=utf-8',
): void {
  downloadBlobFile(new Blob([content], { type: mimeType }), filename);
}
