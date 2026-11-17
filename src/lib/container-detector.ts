import { getElementLabel, isOverlayElement } from '@/lib/dom-utils';
import type {
	DetectedContainerInfo,
	GuideAlignment,
	LinearGuideSettings,
} from '@/types/layout-guides';

const IGNORED_TAGS = new Set([
	'SCRIPT',
	'STYLE',
	'NOSCRIPT',
	'SVG',
	'PATH',
	'IMG',
	'VIDEO',
	'CANVAS',
	'IFRAME',
	'LINK',
	'META',
	'HEAD',
	'HTML',
	'BR',
	'HR',
	'SPAN',
	'A',
	'BUTTON',
	'INPUT',
	'TEXTAREA',
	'SELECT',
	'LABEL',
	'P',
	'H1',
	'H2',
	'H3',
	'H4',
	'H5',
	'H6',
]);

const CONTAINER_CLASS_REGEX =
	/\b(container|wrapper|max-w-|layout|content|grid|page|main|shell|inner)\b/i;

function parsePx(value: string | null | undefined): number | null {
	if (!value || value === 'none' || value === 'normal' || value === 'auto') {
		return null;
	}
	if (value.endsWith('px')) {
		const num = Number.parseFloat(value);
		return Number.isFinite(num) ? Math.round(num) : null;
	}
	return null;
}

function parseGridColumns(
	style: CSSStyleDeclaration,
): { count: number; gap: number } | null {
	if (style.display !== 'grid' && style.display !== 'inline-grid') {
		return null;
	}
	const template = style.gridTemplateColumns;
	if (!template || template === 'none') {
		return null;
	}
	// Computed gridTemplateColumns returns resolved pixel tracks separated by spaces, e.g. "80px 80px 80px"
	const tracks = template
		.trim()
		.split(/\s+/)
		.filter((t) => t.endsWith('px'));
	if (tracks.length < 2 || tracks.length > 48) {
		return null;
	}
	const gap = parsePx(style.columnGap) ?? 0;
	return { count: tracks.length, gap };
}

/**
 * Рассчитывает адаптивное количество колонок и межколоночный отступ (gutter)
 * в зависимости от внутренней ширины контейнера (если у элемента нет явного CSS Grid):
 * - < 240px: 2 колонки, gutter 8px
 * - 240–479px (сайдбары, карточки, мобильные блоки): 4 колонки, gutter 12px
 * - 480–767px (средние панели, модалки): 6 колонок, gutter 16px
 * - 768–1023px (планшетные контейнеры, узкие статьи): 8 колонок, gutter 16px
 * - >= 1024px (основные десктопные контейнеры): 12 колонок, gutter 20px
 */
function suggestColumnsForWidth(innerWidth: number): {
	count: number;
	gap: number;
} {
	if (innerWidth < 240) {
		return { count: 2, gap: 8 };
	}
	if (innerWidth < 480) {
		return { count: 4, gap: 12 };
	}
	if (innerWidth < 768) {
		return { count: 6, gap: 16 };
	}
	if (innerWidth < 1024) {
		return { count: 8, gap: 16 };
	}
	return { count: 12, gap: 20 };
}

/**
 * Извлекает параметры сетки (ширину контейнера, внутренние отступы, смещение, колонки)
 * из конкретного DOM-элемента.
 */
export function extractContainerInfo(
	el: HTMLElement,
	precomputedRect?: DOMRect,
	precomputedStyle?: CSSStyleDeclaration,
): DetectedContainerInfo {
	const rect = precomputedRect ?? el.getBoundingClientRect();
	const style = precomputedStyle ?? window.getComputedStyle(el);
	const viewportWidth =
		document.documentElement.clientWidth || window.innerWidth;

	const paddingLeft = parsePx(style.paddingLeft) ?? 0;
	const paddingRight = parsePx(style.paddingRight) ?? 0;
	const paddingInline = Math.round((paddingLeft + paddingRight) / 2);

	const computedMaxWidth = parsePx(style.maxWidth);
	const roundedWidth = Math.round(rect.width);

	const isFullBleed = roundedWidth >= viewportWidth - 2;
	const maxWidth = isFullBleed
		? computedMaxWidth && computedMaxWidth < viewportWidth
			? computedMaxWidth
			: null
		: roundedWidth;

	const leftSpace = rect.left;
	const rightSpace = viewportWidth - rect.right;
	const centerDiff = Math.round(rect.left + rect.width / 2 - viewportWidth / 2);

	let alignment: GuideAlignment = 'stretch';
	let offset = 0;

	if (!isFullBleed) {
		if (Math.abs(leftSpace - rightSpace) <= 8) {
			// Контейнер отцентрирован относительно вьюпорта
			alignment = 'stretch';
			offset = 0;
		} else if (Math.abs(leftSpace) <= 4) {
			// Прижат к левому краю
			alignment = 'start';
			offset = Math.round(leftSpace);
		} else if (Math.abs(rightSpace) <= 4) {
			// Прижат к правому краю
			alignment = 'end';
			offset = -Math.round(rightSpace);
		} else {
			// Контейнер смещен (например, из-за бокового сайдбара)
			alignment = 'stretch';
			offset = centerDiff;
		}
	}

	// Проверяем сам элемент и его прямых потомков на наличие CSS Grid
	let gridInfo = parseGridColumns(style);
	if (!gridInfo) {
		for (const child of Array.from(el.children)) {
			if (child instanceof HTMLElement) {
				const childRect = child.getBoundingClientRect();
				if (
					Math.abs(
						childRect.width - (rect.width - paddingLeft - paddingRight),
					) <= 8
				) {
					const childGrid = parseGridColumns(window.getComputedStyle(child));
					if (childGrid) {
						gridInfo = childGrid;
						break;
					}
				}
			}
		}
	}

	const innerWidth = Math.max(0, roundedWidth - paddingLeft - paddingRight);
	const fallbackGrid = suggestColumnsForWidth(innerWidth);

	return {
		element: el,
		tagName: el.tagName.toLowerCase(),
		label: getElementLabel(el),
		rect,
		maxWidth,
		paddingInline,
		columnCount: gridInfo?.count ?? fallbackGrid.count,
		columnGap: gridInfo?.gap ?? fallbackGrid.gap,
		alignment,
		offset,
	};
}

/**
 * Конвертирует информацию о контейнере в настройки направляющих колонок.
 */
export function containerInfoToColumnsPatch(
	info: DetectedContainerInfo,
	current: LinearGuideSettings,
): Partial<LinearGuideSettings> {
	return {
		alignment: info.alignment,
		itemSize: info.alignment === 'stretch' ? null : current.itemSize,
		maxSize: info.maxWidth,
		margin: info.paddingInline,
		offset: info.offset,
		...(info.columnCount !== null ? { count: info.columnCount } : {}),
		...(info.columnGap !== null ? { gutter: info.columnGap } : {}),
	};
}

/**
 * Автоматически находит основной контентный контейнер на текущей странице
 * на основе анализа max-width, центровки, семантических тегов и площади.
 * Оптимизировано: кеширует DOMRect в один проход и вызывает полный расчет (с обходом детей)
 * только для одного элемента-победителя.
 */
export function autoDetectPageContainer(): DetectedContainerInfo | null {
	const viewportWidth =
		document.documentElement.clientWidth || window.innerWidth;
	const viewportHeight = window.innerHeight;
	const minCandidateWidth = Math.min(320, viewportWidth * 0.45);

	const elements = document.body.querySelectorAll<HTMLElement>('*');
	const widthFrequency = new Map<number, number>();
	const filtered: Array<{
		el: HTMLElement;
		rect: DOMRect;
		roundedW: number;
	}> = [];

	// Проход 1: отсеиваем неподходящие теги/размеры, кешируем DOMRect и собираем частоту ширин
	for (const el of elements) {
		if (IGNORED_TAGS.has(el.tagName) || isOverlayElement(el)) continue;

		const rect = el.getBoundingClientRect();
		if (
			rect.width < minCandidateWidth ||
			rect.height < 60 ||
			rect.bottom < 0 ||
			rect.top > viewportHeight * 2
		) {
			continue;
		}

		const roundedW = Math.round(rect.width);
		if (roundedW < viewportWidth - 8) {
			widthFrequency.set(roundedW, (widthFrequency.get(roundedW) ?? 0) + 1);
		}

		filtered.push({ el, rect, roundedW });
	}

	let bestCandidate: {
		el: HTMLElement;
		rect: DOMRect;
		style: CSSStyleDeclaration;
		score: number;
	} | null = null;

	// Проход 2: оцениваем только отфильтрованные видимые элементы
	for (const { el, rect, roundedW } of filtered) {
		const style = window.getComputedStyle(el);
		if (
			style.display === 'none' ||
			style.visibility === 'hidden' ||
			style.position === 'fixed'
		) {
			continue;
		}

		const isConstrained = roundedW < viewportWidth - 8;
		const computedMaxW = parsePx(style.maxWidth);
		const hasExplicitMaxW =
			computedMaxW !== null &&
			computedMaxW <= viewportWidth &&
			computedMaxW >= 480;

		const leftSpace = rect.left;
		const rightSpace = viewportWidth - rect.right;
		const isCentered =
			isConstrained && Math.abs(leftSpace - rightSpace) <= 12 && leftSpace > 4;

		const gridInfo = parseGridColumns(style);
		const paddingLeft = parsePx(style.paddingLeft) ?? 0;
		const paddingRight = parsePx(style.paddingRight) ?? 0;
		const hasSymmetricPadding =
			paddingLeft > 0 && Math.abs(paddingLeft - paddingRight) <= 4;

		// Если элемент просто растянут на весь экран без max-width, без grid и без симметричного паддинга — пропускаем
		if (
			!isConstrained &&
			!hasExplicitMaxW &&
			!gridInfo &&
			!hasSymmetricPadding
		) {
			continue;
		}

		let score = 0;

		// 1. Явный max-width в CSS — сильнейший сигнал контейнера
		if (hasExplicitMaxW) score += 45;

		// 2. Центрированный блок меньше ширины экрана
		if (isCentered) score += 35;
		else if (isConstrained) score += 15;

		// 3. Повторяющаяся на странице ширина контейнера (например, несколько секций по 1280px)
		if (isConstrained) {
			const freq = widthFrequency.get(roundedW) ?? 0;
			score += Math.min(30, freq * 6);
		}

		// 4. Семантические теги и имена классов
		const tag = el.tagName;
		if (tag === 'MAIN') score += 25;
		else if (tag === 'SECTION' || tag === 'HEADER' || tag === 'ARTICLE') {
			score += 10;
		}

		const classNameStr = typeof el.className === 'string' ? el.className : '';
		if (CONTAINER_CLASS_REGEX.test(classNameStr)) {
			score += 20;
		}

		// 5. Наличие CSS Grid с несколькими колонками
		if (gridInfo) {
			score += 30;
		}

		// 6. Симметричный внутренний padding (например, px-4, px-6, px-8)
		if (hasSymmetricPadding && paddingLeft <= 120) {
			score += 12;
		}

		// 7. Бонус за видимую высоту во вьюпорте
		const visibleTop = Math.max(0, rect.top);
		const visibleBottom = Math.min(viewportHeight, rect.bottom);
		const visibleHeight = Math.max(0, visibleBottom - visibleTop);
		score += Math.round((visibleHeight / viewportHeight) * 20);

		if (!bestCandidate || score > bestCandidate.score) {
			bestCandidate = { el, rect, style, score };
		}
	}

	if (!bestCandidate) {
		return null;
	}

	return extractContainerInfo(
		bestCandidate.el,
		bestCandidate.rect,
		bestCandidate.style,
	);
}
