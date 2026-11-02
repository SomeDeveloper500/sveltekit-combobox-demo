import { canEditItems } from '#lib/domain/permissions.js';
import { updateStatusSchema } from '#lib/schemas/item.js';
import { itemRepository } from '#lib/server/data/items.js';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * The write: change a campaign's status. A JSON endpoint (not a page action) because the table
 * updates optimistically and has to tell the failures apart: each has its own status code.
 *
 *   401 not signed in · 403 signed in but read-only · 404 no such campaign
 *   409 that move is not allowed from the current status · 400/422 the request itself is wrong
 *
 * Who you are and what you may do are decided before the body is looked at, so a caller that may
 * not write learns nothing about the data. The repository checks again: no write goes through on
 * this endpoint's word alone.
 */
export const POST: RequestHandler = async ({ request, params, locals }) => {
	if (!locals.user) return json({ code: 'unauthenticated' }, { status: 401 });
	if (!canEditItems(locals.user)) return json({ code: 'forbidden' }, { status: 403 });

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ code: 'invalid_json' }, { status: 400 });
	}

	// The same schema the client form uses; the id comes from the URL, never from the body.
	const parsed = updateStatusSchema.safeParse({
		id: params.id,
		status: (body as { status?: unknown } | null)?.status
	});
	if (!parsed.success) return json({ code: 'invalid' }, { status: 422 });

	const result = itemRepository.updateStatus(parsed.data.id, parsed.data.status, locals.user);
	if (result.ok) return json({ item: result.item, changed: result.changed });

	switch (result.code) {
		case 'unauthenticated':
			return json({ code: result.code }, { status: 401 });
		case 'forbidden':
			return json({ code: result.code }, { status: 403 });
		case 'not_found':
			return json({ code: result.code }, { status: 404 });
		case 'bad_transition':
			return json({ code: result.code, from: result.from, to: result.to }, { status: 409 });
	}
};
