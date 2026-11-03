import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { goto } from '$app/navigation';
import ItemStatusControlHarness from './ItemStatusControlHarness.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

const optionLabels = () =>
	[...document.querySelectorAll('select option')].map((option) => option.textContent);

describe('ItemStatusControl', () => {
	it('shows a read-only person the status as a badge, with nothing to change', async () => {
		render(ItemStatusControlHarness, { status: 'draft', canEdit: false });
		await expect.element(page.getByText('Draft')).toBeInTheDocument();
		expect(document.querySelector('select')).toBeNull();
		expect(document.querySelector('form')).toBeNull();
	});

	it('offers an editor the current status and only the moves the lifecycle allows', async () => {
		render(ItemStatusControlHarness, { status: 'active', canEdit: true });
		expect(optionLabels()).toEqual(['Active', 'Paused', 'Completed']);
		await expect
			.element(page.getByRole('combobox', { name: 'Status of Spring sale' }))
			.toHaveValue('active');
	});

	it('leaves a status with no way out as a badge, even for an editor', async () => {
		render(ItemStatusControlHarness, { status: 'archived', canEdit: true });
		await expect.element(page.getByText('Archived')).toBeInTheDocument();
		expect(document.querySelector('select')).toBeNull();
	});

	it('is a plain form that posts the choice and returns to the same list view', () => {
		render(ItemStatusControlHarness, { status: 'draft', canEdit: true });
		const form = document.querySelector('form')!;
		expect(form.method).toBe('post');
		expect(form.getAttribute('action')).toBe('/en/dashboard/items/item_1/status');
		expect(form.querySelector<HTMLInputElement>('[name="redirectTo"]')!.value).toBe(
			'/en/dashboard/items?status=active'
		);
		expect(form.querySelector('select')!.name).toBe('status');
	});

	it('speaks the page language', async () => {
		render(ItemStatusControlHarness, { lang: 'de', status: 'draft', canEdit: true });
		expect(optionLabels()).toEqual(['Entwurf', 'Geplant', 'Archiviert']);
		await expect
			.element(page.getByRole('combobox', { name: 'Status von Spring sale' }))
			.toBeInTheDocument();
	});
});

const combobox = (name = 'Status of Spring sale') => page.getByRole('combobox', { name });
const answer = (status: number, body: unknown) =>
	vi.fn<typeof fetch>(async () => new Response(JSON.stringify(body), { status }));

describe('ItemStatusControl, with JavaScript', () => {
	it('hides the save button once it can send the change itself', async () => {
		render(ItemStatusControlHarness, { status: 'draft', canEdit: true });
		await expect.poll(() => document.querySelector('button[type="submit"]')).toBeNull();
	});

	it('shows the pick at once, locks the select while it is sent, then keeps it', async () => {
		let release!: (response: Response) => void;
		const fetcher = vi.fn<typeof fetch>(() => new Promise((resolve) => (release = resolve)));
		render(ItemStatusControlHarness, { status: 'draft', canEdit: true, fetcher });
		await combobox().selectOptions('scheduled');

		await expect.element(combobox()).toHaveValue('scheduled');
		await expect.element(combobox()).toBeDisabled();
		expect(fetcher).toHaveBeenCalledOnce();

		release(new Response(JSON.stringify({ item: { status: 'scheduled' }, changed: true })));
		await expect.element(combobox()).toBeEnabled();
		await expect.element(combobox()).toHaveValue('scheduled');
		// The moves now start from the new status.
		expect(optionLabels()).toEqual(['Scheduled', 'Draft', 'Active', 'Archived']);
		await expect
			.element(page.getByRole('status'))
			.toHaveTextContent('“Spring sale” is now Scheduled.');
		await expect.element(page.getByRole('alert')).toHaveTextContent('');
	});

	it('sends the picked status as JSON to this campaign’s endpoint', async () => {
		const fetcher = answer(200, { item: { status: 'scheduled' }, changed: true });
		render(ItemStatusControlHarness, { status: 'draft', canEdit: true, fetcher });
		await combobox().selectOptions('scheduled');
		await expect.element(combobox()).toBeEnabled();
		const [url, init] = fetcher.mock.calls[0];
		expect(url).toBe('/en/dashboard/items/item_1/status');
		expect(JSON.parse(init?.body as string)).toEqual({ status: 'scheduled' });
	});

	it.each([
		[409, 'That move is not allowed from the current status. The status was reset.'],
		[403, 'You are not allowed to change this status.'],
		[404, 'This campaign no longer exists.'],
		[500, 'Something went wrong on our side. The status was not changed.']
	])('rolls back and says why when the server answers %i', async (status, message) => {
		render(ItemStatusControlHarness, {
			status: 'draft',
			canEdit: true,
			fetcher: answer(status, { code: 'x' })
		});
		await combobox().selectOptions('scheduled');
		await expect.element(page.getByRole('alert')).toHaveTextContent(message);
		await expect.element(combobox()).toHaveValue('draft');
		await expect.element(combobox()).toBeEnabled();
		expect(optionLabels()).toEqual(['Draft', 'Scheduled', 'Archived']);
	});

	it('rolls back when there is no answer at all', async () => {
		const fetcher = vi.fn<typeof fetch>(async () => {
			throw new TypeError('Failed to fetch');
		});
		render(ItemStatusControlHarness, { status: 'draft', canEdit: true, fetcher });
		await combobox().selectOptions('scheduled');
		await expect.element(page.getByRole('alert')).toHaveTextContent('Could not reach the server');
		await expect.element(combobox()).toHaveValue('draft');
	});

	it('lets a retry after a failure succeed', async () => {
		const fetcher = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(new Response('{}', { status: 500 }))
			.mockResolvedValueOnce(
				new Response(JSON.stringify({ item: { status: 'scheduled' }, changed: true }))
			);
		render(ItemStatusControlHarness, { status: 'draft', canEdit: true, fetcher });
		await combobox().selectOptions('scheduled');
		await expect.element(page.getByRole('alert')).toHaveTextContent('Status not changed');
		await combobox().selectOptions('scheduled');
		await expect.element(combobox()).toHaveValue('scheduled');
		await expect.element(page.getByRole('status')).toHaveTextContent('is now Scheduled');
	});

	it('sends a signed-out person to sign in, coming back to this list view', async () => {
		render(ItemStatusControlHarness, {
			status: 'draft',
			canEdit: true,
			fetcher: answer(401, { code: 'unauthenticated' })
		});
		await combobox().selectOptions('scheduled');
		await expect.element(page.getByRole('alert')).toHaveTextContent('Sign in again');
		await expect.element(combobox()).toHaveValue('draft');
		expect(goto).toHaveBeenCalledWith(
			'/en/login?next=' + encodeURIComponent('/en/dashboard/items?status=active')
		);
	});

	it('does not send anything when the pick is the status it already has', async () => {
		const fetcher = answer(200, {});
		render(ItemStatusControlHarness, { status: 'draft', canEdit: true, fetcher });
		await combobox().selectOptions('draft');
		expect(fetcher).not.toHaveBeenCalled();
	});

	it('asks before an irreversible move, and does not send anything yet', async () => {
		const fetcher = answer(200, { item: { status: 'archived' }, changed: true });
		render(ItemStatusControlHarness, { status: 'draft', canEdit: true, fetcher });
		await combobox().selectOptions('archived');
		const dialog = page.getByRole('alertdialog', { name: 'Change status to Archived?' });
		await expect.element(dialog).toBeVisible();
		await expect.element(dialog).toHaveTextContent('This cannot be undone');
		expect(fetcher).not.toHaveBeenCalled();
	});

	it('puts the select back when the person cancels', async () => {
		const fetcher = answer(200, {});
		render(ItemStatusControlHarness, { status: 'draft', canEdit: true, fetcher });
		await combobox().selectOptions('archived');
		await page.getByRole('button', { name: 'Cancel' }).click();
		await expect.element(page.getByRole('alertdialog')).not.toBeInTheDocument();
		await expect.element(combobox()).toHaveValue('draft');
		expect(fetcher).not.toHaveBeenCalled();
	});

	it('treats Escape as a no, and puts the select back', async () => {
		const fetcher = answer(200, {});
		render(ItemStatusControlHarness, { status: 'draft', canEdit: true, fetcher });
		await combobox().selectOptions('archived');
		await expect.element(page.getByRole('alertdialog')).toBeVisible();
		await userEvent.keyboard('{Escape}');
		await expect.element(page.getByRole('alertdialog')).not.toBeInTheDocument();
		await expect.element(combobox()).toHaveValue('draft');
		expect(fetcher).not.toHaveBeenCalled();
	});

	it('focuses the safe choice first', async () => {
		render(ItemStatusControlHarness, { status: 'draft', canEdit: true });
		await combobox().selectOptions('archived');
		await expect.element(page.getByRole('button', { name: 'Cancel' })).toHaveFocus();
	});

	it('sends the move once it is confirmed, and says so', async () => {
		const fetcher = answer(200, { item: { status: 'archived' }, changed: true });
		render(ItemStatusControlHarness, { status: 'draft', canEdit: true, fetcher });
		await combobox().selectOptions('archived');
		await page.getByRole('button', { name: 'Change to Archived' }).click();
		await expect
			.element(page.getByRole('status'))
			.toHaveTextContent('“Spring sale” is now Archived.');
		expect(fetcher).toHaveBeenCalledOnce();
		// Nowhere left to go from archived: the select gives way to a badge.
		expect(document.querySelector('select')).toBeNull();
	});

	it('rolls back a confirmed move the server then refuses', async () => {
		render(ItemStatusControlHarness, {
			status: 'draft',
			canEdit: true,
			fetcher: answer(409, { code: 'bad_transition' })
		});
		await combobox().selectOptions('archived');
		await page.getByRole('button', { name: 'Change to Archived' }).click();
		await expect.element(page.getByRole('alert')).toHaveTextContent('The status was reset');
		await expect.element(combobox()).toHaveValue('draft');
	});

	it('does not ask for a reversible move', async () => {
		render(ItemStatusControlHarness, {
			status: 'draft',
			canEdit: true,
			fetcher: answer(200, { item: { status: 'scheduled' }, changed: true })
		});
		await combobox().selectOptions('scheduled');
		expect(document.querySelector('dialog[open]')).toBeNull();
	});

	it('tells the page how each change ended, so it can refresh what is stale', async () => {
		const onsettled = vi.fn();
		render(ItemStatusControlHarness, {
			status: 'draft',
			canEdit: true,
			fetcher: answer(200, { item: { status: 'scheduled' }, changed: true }),
			onsettled
		});
		await combobox().selectOptions('scheduled');
		await expect
			.poll(() => onsettled.mock.calls)
			.toEqual([[{ ok: true, status: 'scheduled', changed: true }]]);
	});

	it('tells the page about a refusal too', async () => {
		const onsettled = vi.fn();
		render(ItemStatusControlHarness, {
			status: 'draft',
			canEdit: true,
			fetcher: answer(409, { code: 'bad_transition' }),
			onsettled
		});
		await combobox().selectOptions('scheduled');
		await expect.poll(() => onsettled.mock.calls).toEqual([[{ ok: false, kind: 'conflict' }]]);
	});

	it('says nothing while the person is still being asked to confirm', async () => {
		const onsettled = vi.fn();
		render(ItemStatusControlHarness, { status: 'draft', canEdit: true, onsettled });
		await combobox().selectOptions('archived');
		await expect.element(page.getByRole('alertdialog')).toBeVisible();
		expect(onsettled).not.toHaveBeenCalled();
	});
});
