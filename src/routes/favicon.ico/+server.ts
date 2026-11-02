import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Browsers and crawlers that ignore the `<link rel="icon">` still ask for `/favicon.ico`. The
 * icon is an SVG, so they are sent there instead of getting a 404.
 */
export const GET: RequestHandler = () => redirect(308, '/favicon.svg');
