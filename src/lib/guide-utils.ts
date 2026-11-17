import type {
	GridGuideSettings,
	LinearGuideSettings,
} from '@/types/layout-guides';

/**
 * Очищает HEX-строку от решетки и приводит к верхнему регистру,
 * а также возвращает валидный 6-значный CSS HEX с фоллбэком.
 */
export function normalizeHexColor(
	hex: string,
	fallback = '#FF0000',
): {
	cleanHex: string;
	validCssHex: string;
} {
	const cleanHex = hex.replace(/^#/, '').toUpperCase();
	const validCssHex = /^[0-9A-F]{6}$/i.test(cleanHex)
		? `#${cleanHex}`
		: fallback;
	return { cleanHex, validCssHex };
}

/**
 * Конвертация HEX цвета и прозрачности (0–100) в 8-значный CSS HEX (#RRGGBBAA).
 */
export function formatGuideColor(hex: string, opacity: number): string {
	const { validCssHex } = normalizeHexColor(hex);
	const clampedOpacity = Math.max(0, Math.min(100, opacity));
	const alpha = Math.round((clampedOpacity / 100) * 255)
		.toString(16)
		.padStart(2, '0');
	return `${validCssHex}${alpha}`;
}

export function isLinearModified(
	current: LinearGuideSettings,
	defaults: LinearGuideSettings,
): boolean {
	return (
		current.count !== defaults.count ||
		current.color.toUpperCase() !== defaults.color.toUpperCase() ||
		current.opacity !== defaults.opacity ||
		current.alignment !== defaults.alignment ||
		current.itemSize !== defaults.itemSize ||
		current.maxSize !== defaults.maxSize ||
		current.margin !== defaults.margin ||
		current.gutter !== defaults.gutter ||
		current.offset !== defaults.offset ||
		current.followScroll !== defaults.followScroll
	);
}

export function isGridModified(
	current: GridGuideSettings,
	defaults: GridGuideSettings,
): boolean {
	return (
		current.size !== defaults.size ||
		current.color.toUpperCase() !== defaults.color.toUpperCase() ||
		current.opacity !== defaults.opacity ||
		current.offsetX !== defaults.offsetX ||
		current.offsetY !== defaults.offsetY ||
		current.followScroll !== defaults.followScroll
	);
}
