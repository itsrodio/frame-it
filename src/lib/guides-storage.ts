import {
	DEFAULT_COLUMNS_SETTINGS,
	DEFAULT_GRID_SETTINGS,
	DEFAULT_LAYOUT_GUIDES_STATE,
	DEFAULT_ROWS_SETTINGS,
	LAYOUT_GUIDES_STORAGE_KEY,
} from '@/components/overlay/layout-guides/constants';
import {
	autoDetectPageContainer,
	containerInfoToColumnsPatch,
} from '@/lib/container-detector';
import type { LayoutGuidesState } from '@/types/layout-guides';

const LEGACY_STORAGE_KEY = 'frameit:layout-guides';

export function runAutoDetectOrDefaults(): {
	state: LayoutGuidesState;
	trackedElement: HTMLElement | null;
	trackedElementLabel: string | null;
} {
	const detected = autoDetectPageContainer();
	if (detected) {
		return {
			state: {
				...DEFAULT_LAYOUT_GUIDES_STATE,
				columns: {
					...DEFAULT_COLUMNS_SETTINGS,
					...containerInfoToColumnsPatch(detected, DEFAULT_COLUMNS_SETTINGS),
				},
			},
			trackedElement: detected.element,
			trackedElementLabel: detected.label,
		};
	}

	return {
		state: DEFAULT_LAYOUT_GUIDES_STATE,
		trackedElement: null,
		trackedElementLabel: null,
	};
}

/**
 * При открытии на сайте:
 * 1. Если пользователь уже менял настройки на этом сайте (есть запись в localStorage),
 *    восстанавливаем его кастомные настройки и НЕ перезатираем их автодетектом.
 * 2. Если кастомных настроек для сайта нет (или был сделан Reset) —
 *    запускаем автодетект контейнера (с фоллбэком на дефолтные настройки).
 */
export function getInitialGuidesSetup(): {
	state: LayoutGuidesState;
	trackedElement: HTMLElement | null;
	trackedElementLabel: string | null;
	hasCustomSiteSettings: boolean;
} {
	try {
		window.localStorage.removeItem(LEGACY_STORAGE_KEY);

		const raw = window.localStorage.getItem(LAYOUT_GUIDES_STORAGE_KEY);
		if (raw) {
			const parsed = JSON.parse(raw) as Partial<LayoutGuidesState>;
			return {
				state: {
					enabled:
						typeof parsed.enabled === 'boolean'
							? parsed.enabled
							: DEFAULT_LAYOUT_GUIDES_STATE.enabled,
					type:
						parsed.type === 'columns' ||
						parsed.type === 'rows' ||
						parsed.type === 'grid'
							? parsed.type
							: DEFAULT_LAYOUT_GUIDES_STATE.type,
					columns: {
						...DEFAULT_COLUMNS_SETTINGS,
						...parsed.columns,
					},
					rows: {
						...DEFAULT_ROWS_SETTINGS,
						...parsed.rows,
					},
					grid: {
						...DEFAULT_GRID_SETTINGS,
						...parsed.grid,
					},
				},
				trackedElement: null,
				trackedElementLabel: null,
				hasCustomSiteSettings: true,
			};
		}
	} catch {
		// Ignore storage errors (e.g. sandboxed iframes or disabled cookies)
	}

	return {
		...runAutoDetectOrDefaults(),
		hasCustomSiteSettings: false,
	};
}

export function saveSiteCustomState(state: LayoutGuidesState): void {
	try {
		window.localStorage.setItem(
			LAYOUT_GUIDES_STORAGE_KEY,
			JSON.stringify(state),
		);
	} catch {
		// Ignore storage quota or security errors
	}
}

export function clearSiteCustomState(): void {
	try {
		window.localStorage.removeItem(LAYOUT_GUIDES_STORAGE_KEY);
	} catch {
		// Ignore storage errors
	}
}
