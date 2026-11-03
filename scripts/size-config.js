/**
 * Writes `.size-limit.json`: for each route, the JavaScript the browser must fetch before the page
 * is interactive, as a list of files for `size-limit` to weigh (gzip, like the budget in the brief).
 *
 * "Initial" means what the page itself asks for up front: the client entry, the nodes of the
 * route (root layout, language layout, the page) and everything those import statically.
 * Chunks loaded later on demand (`import()`, such as the web-vitals observers) are not counted.
 * The numbers describe the production build, so run this after `npm run build`.
 *
 * Two kinds of route are told apart by how the page is delivered:
 *  - a prerendered page names its own files in `<link rel="modulepreload">`, which is read as is;
 *  - a server-rendered page is worked out from the build's route table and module graph.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const CLIENT = 'build/client';
const OUTPUT = '.svelte-kit/output';

/**
 * The public surface is held to 80 KB (gzip), the brief's number: its heaviest page is about 70.
 * The signed-in dashboard is held to 100 KB, under the brief's 150: its heaviest page is about
 * 75, and a budget far above the real size would let a large regression through unnoticed.
 */
const PUBLIC_LIMIT = '80 kB';
const DASHBOARD_LIMIT = '100 kB';

const POST = 'sub-second-lcp-on-a-content-site';

/** What to weigh: [name, how it is delivered, where to look it up, limit]. */
const ROUTES = [
	['public: home', 'prerendered', 'en', PUBLIC_LIMIT],
	['public: post', 'prerendered', `en/blog/${POST}`, PUBLIC_LIMIT],
	['public: blog list', 'rendered', '/[lang=locale]/blog', PUBLIC_LIMIT],
	['public: search', 'rendered', '/[lang=locale]/search', PUBLIC_LIMIT],
	['public: sign in', 'rendered', '/[lang=locale]/login', PUBLIC_LIMIT],
	['dashboard: overview', 'rendered', '/[lang=locale]/dashboard', DASHBOARD_LIMIT],
	['dashboard: campaigns', 'rendered', '/[lang=locale]/dashboard/items', DASHBOARD_LIMIT]
];

const viteManifest = JSON.parse(readFileSync(`${OUTPUT}/client/.vite/manifest.json`, 'utf8'));
const byFile = new Map(Object.entries(viteManifest).map(([key, entry]) => [entry.file, key]));

/** Every file reachable from these files through static imports, themselves included. */
export function closure(files) {
	const seen = new Set();
	const visit = (file) => {
		if (seen.has(file)) return;
		seen.add(file);
		const entry = viteManifest[byFile.get(file)];
		for (const key of entry?.imports ?? []) visit(viteManifest[key].file);
	};
	files.forEach(visit);
	return seen;
}

const nodeFile = (index) =>
	viteManifest[`.svelte-kit/generated/build/client-optimized/nodes/${index}.js`].file;

/** The files a prerendered page preloads: the page says so itself. */
export function prerenderedFiles(page) {
	const html = readFileSync(`build/prerendered/${page}.html`, 'utf8');
	// The prefix is `./`, `../../` and so on, depending on how deep the page lives.
	const hrefs = [
		...html.matchAll(/<link href="(?:\.\.?\/)+([^"]+\.js)" rel="modulepreload">/g)
	].map((match) => match[1]);
	return closure(hrefs);
}

/** The files a server-rendered route needs: the client entry plus its layouts and page. */
export async function renderedFiles(routeId) {
	const { manifest } = await import(pathToFileURL(`${OUTPUT}/server/manifest.js`).href);
	const route = manifest.routes.find((candidate) => candidate.id === routeId && candidate.page);
	if (!route) throw new Error(`No page route ${routeId} in the build`);
	const { layouts, leaf } = route.page;
	// The route table counts positions in the list of server nodes, which leaves out the nodes
	// of prerendered pages. The list wraps each import in a closure, so the file names are read
	// from the source of the manifest: position 0 is the first name, and so on.
	const source = readFileSync(`${OUTPUT}/server/manifest.js`, 'utf8');
	const list = source.slice(source.indexOf('nodes: ['), source.indexOf('remotes:'));
	const fileNumbers = [...list.matchAll(/\/nodes\/(\d+)\.js/g)].map((match) => Number(match[1]));
	const nodes = [...layouts, leaf].map((position) => {
		if (fileNumbers[position] === undefined) throw new Error(`No server node at ${position}`);
		return nodeFile(fileNumbers[position]);
	});
	return closure([
		manifest.client.start,
		manifest.client.app,
		...manifest.client.imports,
		...nodes
	]);
}

async function main() {
	const config = [];
	for (const [name, kind, where, limit] of ROUTES) {
		const files = kind === 'prerendered' ? prerenderedFiles(where) : await renderedFiles(where);
		config.push({
			name,
			path: [...files].sort().map((file) => `${CLIENT}/${file}`),
			limit,
			gzip: true
		});
	}
	writeFileSync('.size-limit.json', `${JSON.stringify(config, null, '\t')}\n`);
	for (const { name, path } of config) console.log(`${name}: ${path.length} files`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
