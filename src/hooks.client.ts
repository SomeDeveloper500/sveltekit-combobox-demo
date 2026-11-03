import { dev } from '$app/env';
import { RUM_SAMPLE_RATE } from '$app/env/public';
import { reportError, startRum } from '#lib/rum/client.js';
import type { ClientInit, HandleClientError } from '@sveltejs/kit/hooks';

/**
 * Starts the beacon before the app hydrates, so an error during hydration is caught too.
 * Development samples every load, so the wiring can be seen working; production uses
 * `RUM_SAMPLE_RATE` (see `src/env.ts`).
 */
export const init: ClientInit = () => {
	startRum({ endpoint: '/api/vitals', sampleRate: dev ? 1 : RUM_SAMPLE_RATE });
};

/** A short reference a visitor can quote; the same one goes to the report. */
const shortId = () => crypto.randomUUID().slice(0, 8);

/**
 * Unexpected errors on the client (a failed navigation, a crashed load). Reported, and given a
 * reference that the error page shows, like the server's. Expected ones (`error(404)`, a route
 * that does not exist, framework errors) are normal traffic and are not reports.
 */
export const handleError: HandleClientError = ({ error, kind }) => {
	if (kind !== 'unknown') return undefined;
	const id = shortId();
	reportError(error, 'hook', id);
	return { id };
};
