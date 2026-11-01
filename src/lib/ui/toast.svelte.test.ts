import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import ToastHarness from './testing/ToastHarness.svelte';
import { ToastStore, getToasts } from './toast.svelte.js';

function mount() {
	let store!: ToastStore;
	render(ToastHarness, { onready: (s: ToastStore) => (store = s) });
	return store;
}

describe('ToastStore', () => {
	it('adds toasts with defaults and returns distinct ids', () => {
		const store = new ToastStore();
		const a = store.add({ message: 'One' });
		const b = store.add({ message: 'Two', tone: 'danger', duration: 0 });
		expect(a).not.toBe(b);
		expect(store.items[0]).toMatchObject({ tone: 'info', duration: 5000 });
		expect(store.items[1]).toMatchObject({ tone: 'danger', duration: 0 });
	});

	it('keeps only the newest five', () => {
		const store = new ToastStore();
		for (let i = 1; i <= 7; i++) store.add({ message: `Toast ${i}` });
		expect(store.items).toHaveLength(5);
		expect(store.items[0].message).toBe('Toast 3');
	});

	it('dismisses one toast and clears all', () => {
		const store = new ToastStore();
		const id = store.add({ message: 'One' });
		store.add({ message: 'Two' });
		store.dismiss(id);
		expect(store.items.map((toast) => toast.message)).toEqual(['Two']);
		store.clear();
		expect(store.items).toEqual([]);
	});

	it('refuses to be read without a provider', () => {
		expect(() => getToasts()).toThrow(/provideToasts/);
	});
});

describe('Toaster', () => {
	it('renders both live regions before any toast exists', async () => {
		mount();
		await expect.element(page.getByRole('status')).toBeInTheDocument();
		await expect.element(page.getByRole('alert')).toBeInTheDocument();
	});

	it('shows a toast with its title and message', async () => {
		const store = mount();
		store.add({ tone: 'success', title: 'Saved', message: 'Your changes are live.', duration: 0 });
		await expect.element(page.getByText('Saved')).toBeInTheDocument();
		await expect.element(page.getByText('Your changes are live.')).toBeInTheDocument();
	});

	it('puts errors in the assertive region and the rest in the polite one', async () => {
		const store = mount();
		store.add({ tone: 'danger', message: 'It failed.', duration: 0 });
		store.add({ tone: 'info', message: 'FYI.', duration: 0 });
		await expect.element(page.getByRole('alert')).toHaveTextContent('It failed.');
		await expect.element(page.getByRole('status')).toHaveTextContent('FYI.');
		await expect.element(page.getByRole('status')).not.toHaveTextContent('It failed.');
	});

	it('closes with the dismiss button', async () => {
		const store = mount();
		store.add({ message: 'Close me.', duration: 0 });
		await page.getByRole('button', { name: 'Dismiss' }).click();
		await expect.element(page.getByText('Close me.')).not.toBeInTheDocument();
	});

	it('closes on its own after the duration', async () => {
		const store = mount();
		store.add({ message: 'Short lived.', duration: 100 });
		await expect.element(page.getByText('Short lived.')).toBeInTheDocument();
		await expect.element(page.getByText('Short lived.')).not.toBeInTheDocument();
	});

	it('keeps a sticky toast (duration 0)', async () => {
		const store = mount();
		store.add({ message: 'Sticky.', duration: 0 });
		await new Promise((resolve) => setTimeout(resolve, 400));
		await expect.element(page.getByText('Sticky.')).toBeInTheDocument();
	});
});
