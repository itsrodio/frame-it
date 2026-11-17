import { describe, expect, it } from 'vitest';
import {
	formatGuideColor,
	isGridModified,
	isLinearModified,
	normalizeHexColor,
} from '@/lib/guide-utils';
import type {
	GridGuideSettings,
	LinearGuideSettings,
} from '@/types/layout-guides';

describe('normalizeHexColor', () => {
	it('strips # and uppercases a valid HEX string', () => {
		expect(normalizeHexColor('#ff00aa')).toEqual({
			cleanHex: 'FF00AA',
			validCssHex: '#FF00AA',
		});
	});

	it('returns fallback when an invalid HEX string is provided', () => {
		expect(normalizeHexColor('xyz', '#123456')).toEqual({
			cleanHex: 'XYZ',
			validCssHex: '#123456',
		});
	});
});

describe('formatGuideColor', () => {
	it('converts color and opacity (0-100) to 8-digit HEX (#RRGGBBAA)', () => {
		expect(formatGuideColor('#ff0000', 100)).toBe('#FF0000ff');
		expect(formatGuideColor('#ff0000', 0)).toBe('#FF000000');
		expect(formatGuideColor('#ff0000', 10)).toBe('#FF00001a');
	});

	it('clamps opacity between 0 and 100', () => {
		expect(formatGuideColor('#00ff00', 150)).toBe('#00FF00ff');
		expect(formatGuideColor('#00ff00', -20)).toBe('#00FF0000');
	});
});

describe('isLinearModified', () => {
	const defaultSettings: LinearGuideSettings = {
		color: '#00FF00',
		opacity: 10,
		count: 12,
		alignment: 'stretch',
		itemSize: null,
		maxSize: null,
		margin: 40,
		gutter: 20,
		offset: 0,
		followScroll: true,
	};

	it('returns false when settings match defaults', () => {
		expect(isLinearModified({ ...defaultSettings }, defaultSettings)).toBe(
			false,
		);
	});

	it('ignores color case differences', () => {
		expect(
			isLinearModified(
				{ ...defaultSettings, color: '#00ff00' },
				defaultSettings,
			),
		).toBe(false);
	});

	it.each([
		{ count: 6 },
		{ color: '#FF0000' },
		{ opacity: 50 },
		{ alignment: 'center' as const },
		{ itemSize: 100 },
		{ maxSize: 1200 },
		{ margin: 16 },
		{ gutter: 8 },
		{ offset: 10 },
		{ followScroll: false },
	])('returns true when %o changes', (override) => {
		expect(
			isLinearModified({ ...defaultSettings, ...override }, defaultSettings),
		).toBe(true);
	});
});

describe('isGridModified', () => {
	const defaultSettings: GridGuideSettings = {
		color: '#00FF00',
		opacity: 20,
		size: 10,
		offsetX: 0,
		offsetY: 0,
		followScroll: false,
	};

	it('returns false when settings match defaults', () => {
		expect(isGridModified({ ...defaultSettings }, defaultSettings)).toBe(false);
	});

	it('ignores color case differences', () => {
		expect(
			isGridModified({ ...defaultSettings, color: '#00ff00' }, defaultSettings),
		).toBe(false);
	});

	it.each([
		{ color: '#FF0000' },
		{ opacity: 10 },
		{ size: 256 },
		{ offsetX: 10 },
		{ offsetY: 10 },
		{ followScroll: true },
	])('returns true when %o changes', (override) => {
		expect(
			isGridModified({ ...defaultSettings, ...override }, defaultSettings),
		).toBe(true);
	});
});
