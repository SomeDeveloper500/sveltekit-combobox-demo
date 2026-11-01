import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Input from './Input.svelte';

describe('Input', () => {
	it('links the label to the input', async () => {
		render(Input, { label: 'Email', type: 'email' });
		const input = page.getByLabelText('Email');
		await expect.element(input).toHaveAttribute('type', 'email');
	});

	it('describes the input with its hint', async () => {
		render(Input, { label: 'Email', hint: 'We never share it.' });
		await expect
			.element(page.getByLabelText('Email'))
			.toHaveAccessibleDescription('We never share it.');
	});

	it('marks the input invalid and describes it with the error', async () => {
		render(Input, { label: 'Email', error: 'Enter a valid email.' });
		const input = page.getByLabelText('Email');
		await expect.element(input).toHaveAttribute('aria-invalid', 'true');
		await expect.element(input).toHaveAccessibleDescription('Enter a valid email.');
		await expect.element(page.getByRole('alert')).toHaveTextContent('Enter a valid email.');
	});

	it('puts the error before the hint in the description', async () => {
		render(Input, { label: 'Email', hint: 'A hint.', error: 'An error.' });
		await expect
			.element(page.getByLabelText('Email'))
			.toHaveAccessibleDescription('An error. A hint.');
	});

	it('keeps a caller aria-describedby next to the Field wiring', async () => {
		render(Input, {
			label: 'Password',
			hint: 'Hint.',
			'aria-describedby': 'rules'
		});
		const input = page.getByLabelText('Password');
		const describedBy = (await input.element().getAttribute('aria-describedby')) ?? '';
		expect(describedBy.split(' ')).toContain('rules');
		expect(describedBy.split(' ')).toHaveLength(2);
	});

	it('takes required from Field: the control is required and the label shows an asterisk', async () => {
		render(Input, { label: 'Email', required: true });
		await expect.element(page.getByLabelText('Email')).toBeRequired();
		await expect.element(page.getByText('*')).toHaveAttribute('aria-hidden', 'true');
	});

	it('does not set aria-invalid without an error', async () => {
		render(Input, { label: 'Email' });
		await expect.element(page.getByLabelText('Email')).not.toHaveAttribute('aria-invalid');
	});

	it('hides the label visually but keeps it for assistive tech', async () => {
		render(Input, { label: 'Search', hideLabel: true });
		await expect.element(page.getByLabelText('Search')).toBeInTheDocument();
	});
});
