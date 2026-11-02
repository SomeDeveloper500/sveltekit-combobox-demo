import { describe, expect, it } from 'vitest';
import usersJson from '../../../../mocks/users.json';
import { createUserRepository, safeEqual } from './users';
import { DataValidationError } from './validate';

const repo = createUserRepository(usersJson);

describe('authenticate', () => {
	it.each([
		['admin@demo.test', 'admin'],
		['editor@demo.test', 'editor'],
		['viewer@demo.test', 'viewer']
	])('signs in %s with the demo password', (email, role) => {
		expect(repo.authenticate(email, 'demo1234')).toMatchObject({ email, role });
	});

	it('never returns the password', () => {
		const user = repo.authenticate('admin@demo.test', 'demo1234');
		expect(user).not.toBeNull();
		expect(user).not.toHaveProperty('password');
		expect(JSON.stringify(user)).not.toContain('demo1234');
	});

	it('ignores the case of the email and surrounding spaces', () => {
		expect(repo.authenticate('  ADMIN@Demo.Test ', 'demo1234')?.id).toBe('demo_admin');
	});

	it('rejects a wrong password, exactly', () => {
		expect(repo.authenticate('admin@demo.test', 'wrong')).toBeNull();
		expect(repo.authenticate('admin@demo.test', 'DEMO1234')).toBeNull();
		expect(repo.authenticate('admin@demo.test', 'demo12345')).toBeNull();
		expect(repo.authenticate('admin@demo.test', 'demo123')).toBeNull();
		expect(repo.authenticate('admin@demo.test', ' demo1234')).toBeNull();
	});

	it('rejects an empty password and an unknown email the same way', () => {
		expect(repo.authenticate('admin@demo.test', '')).toBeNull();
		expect(repo.authenticate('nobody@demo.test', 'demo1234')).toBeNull();
		expect(repo.authenticate('', '')).toBeNull();
	});

	it('does not let one user sign in with another one’s password', () => {
		const rows = [
			{ id: 'a', email: 'a@x.test', password: 'alpha', name: 'A', role: 'admin' },
			{ id: 'b', email: 'b@x.test', password: 'bravo', name: 'B', role: 'viewer' }
		];
		const two = createUserRepository(rows);
		expect(two.authenticate('a@x.test', 'bravo')).toBeNull();
		expect(two.authenticate('b@x.test', 'bravo')?.id).toBe('b');
	});

	it('cannot be signed into with the decoy password used for unknown emails', () => {
		expect(repo.authenticate('nobody@demo.test', '\u0000no-such-user\u0000')).toBeNull();
	});
});

describe('findById', () => {
	it('returns the current user without the password, or null', () => {
		expect(repo.findById('demo_editor')).toMatchObject({ role: 'editor' });
		expect(repo.findById('demo_editor')).not.toHaveProperty('password');
		expect(repo.findById('ghost')).toBeNull();
	});
});

describe('safeEqual', () => {
	it('is true only for identical strings', () => {
		expect(safeEqual('secret', 'secret')).toBe(true);
		expect(safeEqual('', '')).toBe(true);
		expect(safeEqual('secret', 'Secret')).toBe(false);
		expect(safeEqual('secret', 'secre')).toBe(false);
		expect(safeEqual('secret', 'secrets')).toBe(false);
		expect(safeEqual('', 'a')).toBe(false);
	});

	it('does not confuse a missing character with a NUL character', () => {
		expect(safeEqual('a', 'a\u0000')).toBe(false);
	});
});

describe('userRepository: bad data stops the boot with a clear error', () => {
	const user = { id: 'a', email: 'a@x.test', password: 'p', name: 'A', role: 'admin' };

	it('rejects an unknown role and names the file', () => {
		const run = () => createUserRepository([{ ...user, role: 'owner' }]);
		expect(run).toThrow(DataValidationError);
		expect(run).toThrow(/mocks\/users\.json/);
	});

	it('rejects emails that differ only in case', () => {
		expect(() => createUserRepository([user, { ...user, id: 'b', email: 'A@X.test' }])).toThrow(
			/duplicate email/
		);
	});
});
