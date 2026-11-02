import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import DialogHarness from './DialogHarness.svelte';

type Controls = { open: () => void; remove: () => void };

function mount(props: Record<string, unknown> = {}) {
	let controls!: Controls;
	render(DialogHarness, { ...props, onready: (c: Controls) => (controls = c) });
	return controls;
}

const opener = () => page.getByRole('button', { name: 'Open' });
const dialog = () => page.getByRole('dialog');

async function openDialog(props: Record<string, unknown> = {}) {
	const controls = mount(props);
	await opener().click();
	await expect.element(page.getByText('Body text')).toBeInTheDocument();
	return controls;
}

const dialogElement = () => document.querySelector('dialog') as HTMLDialogElement;

describe('Dialog: semantics', () => {
	it('renders nothing visible while closed', async () => {
		mount();
		await expect.element(dialog()).not.toBeInTheDocument();
		expect(dialogElement().open).toBe(false);
		expect(dialogElement().textContent?.trim()).toBe('');
	});

	it('is a modal dialog named by its title and described by its description', async () => {
		await openDialog();
		await expect.element(dialog()).toHaveAccessibleName('Confirm');
		await expect.element(dialog()).toHaveAccessibleDescription('Are you sure?');
		expect(dialogElement().matches(':modal')).toBe(true);
	});

	it('accepts role="alertdialog" for destructive confirmations', async () => {
		await openDialog({ role: 'alertdialog' });
		await expect.element(page.getByRole('alertdialog')).toHaveAccessibleName('Confirm');
	});

	it('labels the close button with closeLabel', async () => {
		await openDialog();
		await expect.element(page.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument();
	});
});

describe('Dialog: closing and focus', () => {
	it('closes with Escape and returns focus to the opener', async () => {
		const onclose = vi.fn();
		await openDialog({ onclose });
		await userEvent.keyboard('{Escape}');
		await expect.element(dialog()).not.toBeInTheDocument();
		expect(onclose).toHaveBeenCalledOnce();
		expect(document.activeElement).toBe(opener().element());
	});

	it('closes with the close button', async () => {
		await openDialog();
		await page.getByRole('button', { name: 'Close dialog' }).click();
		await expect.element(dialog()).not.toBeInTheDocument();
	});

	it('closes from the footer through the close() it is handed', async () => {
		const onclose = vi.fn();
		await openDialog({ onclose });
		await page.getByRole('button', { name: 'Done' }).click();
		await expect.element(dialog()).not.toBeInTheDocument();
		expect(onclose).toHaveBeenCalledOnce();
	});

	it('closes on a click that starts and ends on the backdrop', async () => {
		await openDialog();
		const element = dialogElement();
		element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
		element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await expect.element(dialog()).not.toBeInTheDocument();
	});

	it('stays open when a press starts inside and is released over the backdrop', async () => {
		await openDialog();
		page
			.getByText('Body text')
			.element()
			.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
		dialogElement().dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await expect.element(dialog()).toBeInTheDocument();
	});

	it('closes itself, running onclose, when it is destroyed while open', async () => {
		const onclose = vi.fn();
		const controls = await openDialog({ onclose });
		controls.remove();
		await expect.element(page.getByText('Body text')).not.toBeInTheDocument();
		// The native `close` event is queued as a task, so it arrives after the removal.
		await vi.waitFor(() => expect(onclose).toHaveBeenCalledOnce());
	});
});

describe('Dialog: not dismissible', () => {
	it('has no close button', async () => {
		await openDialog({ dismissible: false });
		await expect
			.element(page.getByRole('button', { name: 'Close dialog' }))
			.not.toBeInTheDocument();
	});

	it('ignores Escape, repeatedly, and a backdrop click', async () => {
		await openDialog({ dismissible: false });
		await userEvent.keyboard('{Escape}{Escape}{Escape}');
		const element = dialogElement();
		element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
		element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await expect.element(dialog()).toBeInTheDocument();
	});

	it('still closes from the footer', async () => {
		await openDialog({ dismissible: false });
		await page.getByRole('button', { name: 'Done' }).click();
		await expect.element(dialog()).not.toBeInTheDocument();
	});
});

describe('Dialog: focus management', () => {
	it('focuses the element marked autofocus when opened on the client', async () => {
		await openDialog();
		expect(document.activeElement).toBe(page.getByRole('button', { name: 'Safe' }).element());
	});

	it('does not start on the close button', async () => {
		await openDialog();
		expect(document.activeElement).not.toBe(
			page.getByRole('button', { name: 'Close dialog' }).element()
		);
	});

	// The browser may let Tab reach its own UI (then focus is on `body`), which is fine; what must
	// never happen is focus landing on the page behind the dialog.
	it.each([
		['Tab', '{Tab}'],
		['Shift+Tab', '{Shift>}{Tab}{/Shift}']
	])('never lets %s reach the page behind the dialog', async (_name, keys) => {
		await openDialog({ withInput: true });
		for (let press = 0; press < 8; press++) {
			await userEvent.keyboard(keys);
			expect(document.activeElement).not.toBe(opener().element());
		}
	});

	it('reaches every control inside the dialog with Tab', async () => {
		await openDialog({ withInput: true });
		const seen = new Set<string>();
		for (let press = 0; press < 8; press++) {
			await userEvent.keyboard('{Tab}');
			const active = document.activeElement;
			if (active && dialogElement().contains(active)) {
				seen.add(active.getAttribute('aria-label') ?? active.textContent?.trim() ?? '');
			}
		}
		expect(seen).toEqual(new Set(['Name', 'Done', 'Safe', 'Close dialog']));
	});
});

describe('Dialog with a Combobox inside', () => {
	it('lets the first Escape close the list and the second close the dialog', async () => {
		await openDialog({ withCombobox: true });
		const combobox = page.getByRole('combobox', { name: 'Letter' });
		await combobox.click();
		await userEvent.keyboard('{ArrowDown}');
		await expect.element(combobox).toHaveAttribute('aria-expanded', 'true');
		await userEvent.keyboard('{Escape}');
		await expect.element(combobox).toHaveAttribute('aria-expanded', 'false');
		await expect.element(dialog()).toBeInTheDocument();
		await userEvent.keyboard('{Escape}');
		await expect.element(dialog()).not.toBeInTheDocument();
	});
});
