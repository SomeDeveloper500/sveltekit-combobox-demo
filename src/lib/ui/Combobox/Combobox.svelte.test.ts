import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Combobox from './Combobox.svelte';

const options = [
	{ value: 'a11y', label: 'Accessibility' },
	{ value: 'perf', label: 'Performance' },
	{ value: 'legacy', label: 'Legacy', disabled: true },
	{ value: 'svelte', label: 'Svelte 5' },
	{ value: 'cafe', label: 'Café' }
];

function mount(props: Record<string, unknown> = {}) {
	render(Combobox, { label: 'Tag', options, name: 'tag', ...props });
	return page.getByRole('combobox', { name: 'Tag' });
}

const hiddenValue = () => document.querySelector<HTMLInputElement>('input[name="tag"]')?.value;
const input = (locator: ReturnType<typeof mount>) => locator.element() as HTMLInputElement;
const optionLabels = () =>
	[...document.querySelectorAll('[role="option"]')].map((option) => option.textContent?.trim());

describe('Combobox: roles and attributes', () => {
	it('is a closed combobox with list autocomplete', async () => {
		const combobox = mount();
		await expect.element(combobox).toHaveAttribute('aria-expanded', 'false');
		await expect.element(combobox).toHaveAttribute('aria-autocomplete', 'list');
		await expect.element(combobox).not.toHaveAttribute('aria-activedescendant');
	});

	it('opens a listbox on click and points aria-controls at it', async () => {
		const combobox = mount();
		await combobox.click();
		await expect.element(combobox).toHaveAttribute('aria-expanded', 'true');
		const listbox = page.getByRole('listbox');
		await expect.element(listbox).toBeInTheDocument();
		const controls = input(combobox).getAttribute('aria-controls');
		expect(listbox.element().id).toBe(controls);
		expect(optionLabels()).toEqual(options.map((option) => option.label));
	});

	it('shows its popup in the top layer, so no ancestor can clip or cover it', async () => {
		const combobox = mount();
		await combobox.click();
		const listbox = page.getByRole('listbox');
		await expect.element(listbox).toBeInTheDocument();
		const popup = listbox.element().closest('[popover]');
		expect(popup?.matches(':popover-open')).toBe(true);
		// Anchored to the input: it starts below it (width is CSS-dependent and not asserted here).
		const field = input(combobox).getBoundingClientRect();
		const box = popup!.getBoundingClientRect();
		expect(box.top).toBeGreaterThanOrEqual(field.bottom);
	});

	it('shows the selected option as the text and marks it aria-selected', async () => {
		const combobox = mount({ value: 'perf' });
		await expect.element(combobox).toHaveValue('Performance');
		await combobox.click();
		await expect
			.element(page.getByRole('option', { name: 'Performance' }))
			.toHaveAttribute('aria-selected', 'true');
		await expect
			.element(page.getByRole('option', { name: 'Accessibility' }))
			.toHaveAttribute('aria-selected', 'false');
	});

	it('is described by its hint and error', async () => {
		const combobox = mount({ hint: 'Pick one.', error: 'Required.' });
		await expect.element(combobox).toHaveAttribute('aria-invalid', 'true');
		await expect.element(combobox).toHaveAccessibleDescription('Required. Pick one.');
	});

	it('cannot be used when disabled', async () => {
		const combobox = mount({ disabled: true, value: 'a11y' });
		await expect.element(combobox).toBeDisabled();
		await expect.element(page.getByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
	});
});

describe('Combobox: filtering', () => {
	it('narrows the list as the user types and announces the count', async () => {
		const combobox = mount();
		await combobox.click();
		await userEvent.keyboard('er');
		expect(optionLabels()).toEqual(['Performance']);
		await expect.element(page.getByRole('status')).toHaveTextContent('1 result');
	});

	it('finds accented labels with plain letters', async () => {
		const combobox = mount();
		await combobox.click();
		await userEvent.keyboard('cafe');
		expect(optionLabels()).toEqual(['Café']);
	});

	it('highlights the first selectable option while typing', async () => {
		const combobox = mount();
		await combobox.click();
		await userEvent.keyboard('e');
		const active = input(combobox).getAttribute('aria-activedescendant');
		expect(active).toBeTruthy();
		expect(document.getElementById(active!)?.textContent?.trim()).toBe('Accessibility');
	});

	it('shows "No results" instead of an empty listbox', async () => {
		const combobox = mount();
		await combobox.click();
		await userEvent.keyboard('zzz');
		await expect.element(page.getByText('No results').first()).toBeInTheDocument();
		await expect.element(page.getByRole('listbox')).not.toBeInTheDocument();
		await expect.element(combobox).toHaveAttribute('aria-expanded', 'false');
		await expect.element(page.getByRole('status')).toHaveTextContent('No results');
	});

	it('uses custom labels for other locales', async () => {
		const combobox = mount({
			noResultsLabel: 'Keine Treffer',
			resultsLabel: (count: number) => `${count} Treffer`
		});
		await combobox.click();
		await userEvent.keyboard('s');
		await expect.element(page.getByRole('status')).toHaveTextContent(/\d+ Treffer/);
		await userEvent.keyboard('zzz');
		await expect.element(page.getByRole('status')).toHaveTextContent('Keine Treffer');
	});
});

describe('Combobox: keyboard', () => {
	it('opens with ArrowDown and moves the highlight, skipping disabled options', async () => {
		const combobox = mount();
		await combobox.click();
		await userEvent.keyboard('{ArrowDown}');
		const activeText = () =>
			document
				.getElementById(input(combobox).getAttribute('aria-activedescendant') ?? '')
				?.textContent?.trim();
		expect(activeText()).toBe('Accessibility');
		await userEvent.keyboard('{ArrowDown}{ArrowDown}');
		expect(activeText()).toBe('Svelte 5'); // Legacy is skipped
		await userEvent.keyboard('{ArrowUp}');
		expect(activeText()).toBe('Performance');
	});

	it('wraps from the last option to the first', async () => {
		const combobox = mount();
		await combobox.click();
		await userEvent.keyboard('{ArrowUp}');
		const activeText = document
			.getElementById(input(combobox).getAttribute('aria-activedescendant') ?? '')
			?.textContent?.trim();
		expect(activeText).toBe('Café');
		await userEvent.keyboard('{ArrowDown}');
		const wrapped = document
			.getElementById(input(combobox).getAttribute('aria-activedescendant') ?? '')
			?.textContent?.trim();
		expect(wrapped).toBe('Accessibility');
	});

	it('picks the highlighted option with Enter and closes the list', async () => {
		const combobox = mount();
		await combobox.click();
		await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
		await expect.element(combobox).toHaveValue('Performance');
		await expect.element(combobox).toHaveAttribute('aria-expanded', 'false');
		expect(hiddenValue()).toBe('perf');
	});

	it('does not let a disabled option be picked', async () => {
		const combobox = mount();
		await combobox.click();
		await userEvent.keyboard('leg{Enter}');
		expect(hiddenValue()).toBe('');
		await page.getByRole('option', { name: 'Legacy' }).click({ force: true });
		expect(hiddenValue()).toBe('');
	});

	it('closes with Escape, keeps the value and drops unfinished text', async () => {
		const combobox = mount({ value: 'perf' });
		await combobox.click();
		await userEvent.keyboard('{Control>}a{/Control}sve');
		await userEvent.keyboard('{Escape}');
		await expect.element(combobox).toHaveAttribute('aria-expanded', 'false');
		await expect.element(combobox).toHaveValue('Performance');
		expect(hiddenValue()).toBe('perf');
	});

	it('leaves a second Escape to the surrounding dialog and keeps the value', async () => {
		const outside = vi.fn();
		window.addEventListener('keydown', outside);
		const combobox = mount({ value: 'perf' });
		await combobox.click();
		await userEvent.keyboard('{Escape}');
		expect(outside).not.toHaveBeenCalled(); // the first one closed the list
		await userEvent.keyboard('{Escape}');
		window.removeEventListener('keydown', outside);
		expect(outside).toHaveBeenCalledOnce();
		await expect.element(combobox).toHaveValue('Performance');
		expect(hiddenValue()).toBe('perf');
	});

	it('never submits a value that differs from the displayed text', async () => {
		const combobox = mount();
		await combobox.click();
		await userEvent.keyboard('perfo{Escape}');
		await expect.element(combobox).toHaveValue('');
		expect(hiddenValue()).toBe('');
	});

	it('commits on blur when the text exactly matches an option, ignoring case and accents', async () => {
		const combobox = mount();
		await combobox.click();
		await userEvent.keyboard('CAFE{Tab}');
		await expect.element(combobox).toHaveValue('Café');
		expect(hiddenValue()).toBe('cafe');
	});

	it('does not commit a partial match on blur', async () => {
		const combobox = mount();
		await combobox.click();
		await userEvent.keyboard('perfo{Tab}');
		await expect.element(combobox).toHaveValue('');
		expect(hiddenValue()).toBe('');
	});

	it('ignores keys that belong to an IME composition', async () => {
		const combobox = mount();
		await combobox.click();
		await userEvent.keyboard('per');
		input(combobox).dispatchEvent(
			new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true })
		);
		expect(hiddenValue()).toBe('');
		await expect.element(combobox).toHaveAttribute('aria-expanded', 'true');
	});

	it('does not post a value that is not one of the options', async () => {
		mount({ value: 'unknown' });
		expect(hiddenValue()).toBe('');
	});

	it('keeps Escape for itself so a surrounding dialog does not close', async () => {
		const outside = vi.fn();
		window.addEventListener('keydown', outside);
		const combobox = mount();
		await combobox.click();
		await userEvent.keyboard('{Escape}');
		window.removeEventListener('keydown', outside);
		expect(outside).not.toHaveBeenCalled();
	});

	it('closes on Tab and reverts the text to the selected label', async () => {
		const combobox = mount({ value: 'perf' });
		await combobox.click();
		await userEvent.keyboard('{Control>}a{/Control}zzz');
		await expect.element(combobox).toHaveValue('zzz');
		await userEvent.keyboard('{Tab}');
		await expect.element(combobox).toHaveValue('Performance');
		await expect.element(combobox).toHaveAttribute('aria-expanded', 'false');
		expect(hiddenValue()).toBe('perf');
	});

	it('forgets the value once the text is emptied', async () => {
		const combobox = mount({ value: 'perf' });
		await combobox.click();
		await userEvent.keyboard('{Control>}a{/Control}{Backspace}');
		expect(hiddenValue()).toBe('');
	});
});

describe('Combobox: mouse', () => {
	it('selects an option by click and keeps focus in the input', async () => {
		const combobox = mount();
		await combobox.click();
		await page.getByRole('option', { name: 'Svelte 5' }).click();
		await expect.element(combobox).toHaveValue('Svelte 5');
		expect(hiddenValue()).toBe('svelte');
		expect(document.activeElement).toBe(input(combobox));
	});

	it('clears with the clear button and keeps focus in the input', async () => {
		const combobox = mount({ value: 'perf' });
		await page.getByRole('button', { name: 'Clear' }).click();
		await expect.element(combobox).toHaveValue('');
		expect(hiddenValue()).toBe('');
		expect(document.activeElement).toBe(input(combobox));
	});
});
