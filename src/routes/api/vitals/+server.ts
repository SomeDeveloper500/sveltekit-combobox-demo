import { receiveBeacon } from '#lib/server/rum.js';
import type { RequestHandler } from './$types';

/**
 * Where the page's beacon lands: Core Web Vitals (LCP, INP, CLS, TTFB) and client errors, in one
 * JSON batch. No cookies are read and nothing is stored; the events are logged (see
 * `lib/server/rum.ts`). Answers 204, because a beacon has nobody to read a body.
 */
export const POST: RequestHandler = async ({ request }) => {
	const { status } = await receiveBeacon(request);
	return new Response(null, { status, headers: { 'cache-control': 'no-store' } });
};
