export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

export type OgCard = {
	title: string;
	/** Second line under the title, e.g. the author and the date. */
	byline: string;
	siteName: string;
	/** Background colour, `#rrggbb`. */
	background: string;
};

/** The shape satori renders: React-like elements without React. */
export type OgNode = {
	type: string;
	props: { style?: Record<string, string | number>; children?: OgNode[] | string };
};

function channel(hex: string, start: number): number {
	const value = parseInt(hex.slice(start, start + 2), 16) / 255;
	return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance of `#rrggbb`. */
export function luminance(hex: string): number {
	return 0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5);
}

/** White on dark backgrounds, near-black on light ones: whichever contrasts more. */
export function readableTextColor(background: string): string {
	const light = (luminance(background) + 0.05) / (0 + 0.05);
	const dark = (1 + 0.05) / (luminance(background) + 0.05);
	return dark >= light ? '#ffffff' : '#0b1220';
}

/** Long titles get a smaller size so three lines always fit the card. */
export function titleFontSize(title: string): number {
	if (title.length <= 40) return 76;
	if (title.length <= 70) return 64;
	return 52;
}

/** The layout of the card: site name on top, the title in the middle, the byline at the bottom. */
export function ogCardMarkup(card: OgCard): OgNode {
	const color = readableTextColor(card.background);
	return {
		type: 'div',
		props: {
			style: {
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'space-between',
				width: OG_WIDTH,
				height: OG_HEIGHT,
				// Without this the padding is added to the size and the bottom line falls off the canvas.
				boxSizing: 'border-box',
				padding: 72,
				backgroundColor: card.background,
				color,
				fontFamily: 'Inter, "Inter Ext"'
			},
			children: [
				{
					type: 'div',
					props: {
						style: { display: 'flex', fontSize: 32, fontWeight: 700 },
						children: card.siteName
					}
				},
				{
					type: 'div',
					props: {
						style: {
							display: 'flex',
							fontSize: titleFontSize(card.title),
							fontWeight: 700,
							lineHeight: 1.15
						},
						children: card.title
					}
				},
				{
					type: 'div',
					props: {
						style: { display: 'flex', fontSize: 30, fontWeight: 400 },
						children: card.byline
					}
				}
			]
		}
	};
}
