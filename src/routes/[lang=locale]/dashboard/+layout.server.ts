import type { LayoutServerLoad } from './$types';

/**
 * The signed-in user, loaded for the dashboard itself. The root layout also returns it, but SvelteKit
 * keeps that copy while a visitor moves between pages, and a visitor who signs in on a prerendered
 * page (where it is `null`) would arrive here with the stale one. The guard in `hooks.server.ts`
 * lets only signed-in users in.
 */
export const load: LayoutServerLoad = ({ locals }) => ({ user: locals.user });
