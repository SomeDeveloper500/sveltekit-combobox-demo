import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import ItemStatusControlHarness from './ItemStatusControlHarness.svelte';

describe('ItemStatusControl, rendered on the server (what a page without JavaScript gets)', () => {
	const { body } = render(ItemStatusControlHarness, {
		props: { status: 'draft', canEdit: true }
	});

	it('has a form that posts, with a save button to submit it', () => {
		expect(body).toContain('method="post"');
		expect(body).toContain('action="/en/dashboard/items/item_1/status"');
		expect(body).toContain('type="submit"');
	});

	it('has the select enabled, with the current status chosen', () => {
		expect(body).not.toMatch(/<select[^>]*\sdisabled(=|\s|>)/);
		expect(body).toMatch(/<option[^>]*value="draft"[^>]*>Draft<\/option>/);
	});
});
