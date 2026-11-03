import { canEditItems } from '#lib/domain/permissions.js';
import { updateStatusSchema } from '#lib/schemas/item.js';
import { itemRepository } from '#lib/server/data/items.js';
import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

type Outcome = { status: number; body: Record<string, unknown> };

/**
 * The write: change a campaign's status. Scripts get JSON (the table updates optimistically and
 * has to tell the failures apart: each has its own status code); a plain HTML form gets a 303 back
 * to the list, which shows the truth either way.
 *
 *   401 not signed in · 403 signed in but read-only · 404 no such campaign
 *   409 that move is not allowed from the current status · 400/422 the request itself is wrong
 *
 * Who you are and what you may do are decided before the body is looked at, so a caller that may
 * not write learns nothing about the data. The repository checks again: no write goes through on
 * this endpoint's word alone.
 */
export const POST: RequestHandler = async ({ request, params, locals }) => {
	const isForm = !request.headers.get('content-type')?.includes('application/json');

	const outcome = async (): Promise<Outcome & { back?: unknown }> => {
		if (!locals.user) return { status: 401, body: { code: 'unauthenticated' } };
		if (!canEditItems(locals.user)) return { status: 403, body: { code: 'forbidden' } };

		let status: unknown;
		let back: unknown;
		try {
			if (isForm) {
				const form = await request.formData();
				status = form.get('status');
				back = form.get('redirectTo');
			} else {
				status = ((await request.json()) as { status?: unknown } | null)?.status;
			}
		} catch {
			return { status: 400, body: { code: 'invalid_json' } };
		}

		// The same schema the client form uses; the id comes from the URL, never from the body.
		const parsed = updateStatusSchema.safeParse({ id: params.id, status });
		if (!parsed.success) return { status: 422, body: { code: 'invalid' }, back };

		const result = itemRepository.updateStatus(parsed.data.id, parsed.data.status, locals.user);
		if (result.ok)
			return { status: 200, body: { item: result.item, changed: result.changed }, back };

		switch (result.code) {
			case 'unauthenticated':
				return { status: 401, body: { code: result.code }, back };
			case 'forbidden':
				return { status: 403, body: { code: result.code }, back };
			case 'not_found':
				return { status: 404, body: { code: result.code }, back };
			case 'bad_transition':
				return {
					status: 409,
					body: { code: result.code, from: result.from, to: result.to },
					back
				};
		}
	};

	const { status, body, back } = await outcome();
	if (!isForm) return json(body, { status });

	// A form has no way to show a status code; it goes back to the list as it now is. Only a path
	// inside this section is followed, so the field cannot turn this into an open redirect.
	const list = `/${params.lang}/dashboard/items`;
	const target =
		typeof back === 'string' && (back === list || back.startsWith(`${list}?`)) ? back : list;
	redirect(303, target);
};
