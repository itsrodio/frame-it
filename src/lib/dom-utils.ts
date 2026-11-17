const OVERLAY_HOST_TAG = 'FRAMEIT-OVERLAY';
const OVERLAY_ROOT_ID = 'frameit-root';

/**
 * Проверяет, принадлежит ли элемент самому оверлею FrameIt,
 * не блокируя при этом сторонние Web Components (Shadow DOM) на странице сайта.
 */
export function isOverlayElement(el: Element | null): boolean {
  if (!el) return true;
  if (el.id === OVERLAY_ROOT_ID || el.tagName === OVERLAY_HOST_TAG) {
    return true;
  }
  if (el.closest(OVERLAY_HOST_TAG.toLowerCase())) {
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
 * Проверяет, находится ли фокус в поле ввода (input, textarea, select, contenteditable),
 * чтобы глобальные хоткеи не перехватывали ввод текста.
 */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

/**
 * Формирует компактную читаемую метку DOM-элемента (например, `div#app` или `section.container.mx-auto`).
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
