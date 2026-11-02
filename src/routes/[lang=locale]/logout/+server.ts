import { localizePath } from '#lib/i18n/locale.js';
import { endSession } from '#lib/server/auth.js';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Only POST: a GET that signs you out could be triggered by any page that embeds an image or a
 * link to it. SvelteKit's origin check also rejects a cross-site form post.
 */
export const POST: RequestHandler = ({ cookies, locals }) => {
	endSession(cookies);
	redirect(303, localizePath(locals.lang));
};
