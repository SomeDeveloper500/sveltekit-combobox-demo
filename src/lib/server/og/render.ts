import { OG_HEIGHT, OG_WIDTH, ogCardMarkup, type OgCard } from '#lib/seo/og.js';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const FONT_DIR = join(process.cwd(), 'src/lib/server/og/fonts');

let fonts:
	Promise<{ name: string; data: Buffer; weight: 400 | 700; style: 'normal' }[]> | undefined;

/**
 * Inter in two weights and two subsets: `latin` covers German and English, `latin-ext` the names
 * of authors with letters such as "ř". the extension is a separate family because satori only falls back along a `font-family` list, not between fonts of one name (see `fontFamily` in `ogCardMarkup`).
 */
function loadFonts() {
	fonts ??= Promise.all(
		(['latin', 'latin-ext'] as const).flatMap((subset) =>
			([400, 700] as const).map(async (weight) => ({
				name: subset === 'latin' ? 'Inter' : 'Inter Ext',
				data: await readFile(join(FONT_DIR, `inter-${subset}-${weight}-normal.woff`)),
				weight,
				style: 'normal' as const
			}))
		)
	);
	return fonts;
}

/**
 * Renders a card to a PNG. The two libraries are loaded here, on first use, so the server never
 * pays for them: the cards are rendered while the site is built (the routes are prerendered).
 */
export async function renderOgImage(card: OgCard): Promise<Uint8Array> {
	const [{ default: satori }, { Resvg }] = await Promise.all([
		import('satori'),
		import('@resvg/resvg-js')
	]);
	// satori accepts plain element objects; its type expects React nodes, which we do not use.
	const svg = await satori(ogCardMarkup(card) as never, {
		width: OG_WIDTH,
		height: OG_HEIGHT,
		fonts: await loadFonts()
	});
	return new Resvg(svg, { fitTo: { mode: 'width', value: OG_WIDTH } }).render().asPng();
}
