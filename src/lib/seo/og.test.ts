import { describe, expect, it } from 'vitest';
import {
	OG_HEIGHT,
	OG_WIDTH,
	luminance,
	ogCardMarkup,
	readableTextColor,
	titleFontSize
} from './og.js';

describe('luminance', () => {
	it('is 0 for black and 1 for white', () => {
		expect(luminance('#000000')).toBeCloseTo(0, 5);
		expect(luminance('#ffffff')).toBeCloseTo(1, 5);
	});
});

describe('readableTextColor', () => {
	it('is white on dark backgrounds', () => {
		expect(readableTextColor('#1e293b')).toBe('#ffffff');
		expect(readableTextColor('#1d4ed8')).toBe('#ffffff');
	});

	it('is dark on light backgrounds', () => {
		expect(readableTextColor('#fde68a')).toBe('#0b1220');
		expect(readableTextColor('#ffffff')).toBe('#0b1220');
	});
});

describe('titleFontSize', () => {
	it('shrinks as the title grows, never below a readable size', () => {
		const sizes = ['a'.repeat(30), 'a'.repeat(60), 'a'.repeat(120)].map(titleFontSize);
		expect(sizes[0]).toBeGreaterThan(sizes[1]);
		expect(sizes[1]).toBeGreaterThan(sizes[2]);
		expect(sizes[2]).toBeGreaterThanOrEqual(48);
	});
});

describe('ogCardMarkup', () => {
	const card = {
		title: 'Fast pages',
		byline: 'Omar, May 31',
		siteName: 'Demo',
		background: '#1e293b'
	};
	const root = ogCardMarkup(card);

	it('has the size of an Open Graph image', () => {
		expect(root.props.style).toMatchObject({ width: OG_WIDTH, height: OG_HEIGHT });
		expect([OG_WIDTH, OG_HEIGHT]).toEqual([1200, 630]);
	});

	it('falls back to the extended Latin font for letters such as the r with a caron', () => {
		expect(String(root.props.style?.fontFamily)).toContain('Inter Ext');
	});

	it('keeps the padding inside the image size', () => {
		expect(root.props.style).toMatchObject({ boxSizing: 'border-box' });
	});

	it('uses the given background and a readable text colour', () => {
		expect(root.props.style).toMatchObject({ backgroundColor: '#1e293b', color: '#ffffff' });
	});

	it('shows the site name, the title and the byline, in that order', () => {
		const texts = (root.props.children as { props: { children: string } }[]).map(
			(child) => child.props.children
		);
		expect(texts).toEqual(['Demo', 'Fast pages', 'Omar, May 31']);
	});
});
