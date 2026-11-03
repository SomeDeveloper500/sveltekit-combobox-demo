// The beacon endpoint on Netlify's edge (Deno), in front of the app: `/api/vitals`.
//
// It lives at the edge because it suits it: it keeps no state, reads no cookies, touches no data,
// needs nothing but web APIs and one small validation, and gets a tiny request from every page of
// every visitor, wherever they are. The answer is a 204, so the visitor's browser never waits on
// the app's region. Everything else (rendering, sessions, the dashboard's data) stays on Node.
//
// The work is the same code the Node route uses (`src/routes/api/vitals/+server.ts`), imported
// relatively and with its extension, which is what Deno needs; `zod` comes from the import map
// next to this file. On any other host the SvelteKit route answers instead.
import { receiveBeacon } from '../../src/lib/server/rum.ts';

export default async function handler(request: Request): Promise<Response> {
	if (request.method !== 'POST') {
		return new Response(null, { status: 405, headers: { allow: 'POST' } });
	}
	const { status } = await receiveBeacon(request);
	return new Response(null, { status, headers: { 'cache-control': 'no-store' } });
}

export const config = { path: '/api/vitals' };
