import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

/**
 * Catches every unknown path under a locale, so `/de/no-such-page` is a real 404 rendered inside
 * the localized layout (the shell, in German) instead of a bare framework error.
 */
export const load: PageLoad = () => error(404);
