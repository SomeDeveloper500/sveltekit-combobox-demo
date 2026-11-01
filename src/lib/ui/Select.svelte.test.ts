import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Select from './Select.svelte';

const options = [
	{ value: 'new', label: 'Newest first' },
	{ value: 'old', label: 'Oldest first' },
	{ value: 'rated', label: 'Top rated', disabled: true }
];

describe('Select', () => {
	it('links the label to the select', async () => {
		render(Select, { label: 'Sort', options });
		await expect.element(page.getByLabelText('Sort')).toBeInTheDocument();
	});

	it('shows the placeholder instead of silently selecting the first option', async () => {
		render(Select, { label: 'Sort', options, placeholder: 'Choose order' });
		const select = page.getByLabelText('Sort').element() as HTMLSelectElement;
		expect(select.value).toBe('');
		expect(select.selectedOptions[0].textContent).toBe('Choose order');
	});

	it('does not offer the placeholder as a choice', async () => {
		render(Select, { label: 'Sort', options, placeholder: 'Choose order' });
		const select = page.getByLabelText('Sort').element() as HTMLSelectElement;
		const placeholder = select.options[0];
		expect(placeholder.disabled).toBe(true);
		expect(placeholder.hidden).toBe(true);
	});

	it('selects the option matching the value', async () => {
		render(Select, { label: 'Sort', options, value: 'old' });
		await expect.element(page.getByLabelText('Sort')).toHaveValue('old');
	});

	it('changes the selection', async () => {
		render(Select, { label: 'Sort', options, placeholder: 'Choose order' });
		const select = page.getByLabelText('Sort');
		await select.selectOptions('old');
		await expect.element(select).toHaveValue('old');
	});

	it('marks a single option as disabled', async () => {
		render(Select, { label: 'Sort', options });
		const select = page.getByLabelText('Sort').element() as HTMLSelectElement;
		const disabled = [...select.options].filter((option) => option.disabled);
		expect(disabled.map((option) => option.textContent)).toEqual(['Top rated']);
	});

	it('describes the select with its error and marks it invalid', async () => {
		render(Select, { label: 'Sort', options, error: 'Pick an order.' });
		const select = page.getByLabelText('Sort');
		await expect.element(select).toHaveAttribute('aria-invalid', 'true');
		await expect.element(select).toHaveAccessibleDescription('Pick an order.');
	});

	it('disables the whole control', async () => {
		render(Select, { label: 'Sort', options, disabled: true });
		await expect.element(page.getByLabelText('Sort')).toBeDisabled();
	});
});
