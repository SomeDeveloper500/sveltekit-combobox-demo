/**
 * Runs Lighthouse CI for one target: `node lighthouse/run.mjs public` or `... dashboard`.
 *
 * A wrapper rather than a bare `lhci` call for two reasons. The dashboard needs a signed-in
 * visitor, and a session cookie has to be signed (Web Crypto, asynchronous) with the same code and
 * secret the server uses, which a static config file cannot do. And the settings the server and the
 * config share are set here, in Node, so the same command works in every shell.
 */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const target = process.argv[2];
if (target !== 'public' && target !== 'dashboard') {
	console.error('Usage: node lighthouse/run.mjs <public|dashboard>');
	process.exit(2);
}

const SECRET = 'lighthouse-only-secret-not-for-real-use';
const env = {
	...process.env,
	PORT: '4174',
	SESSION_SECRET: SECRET,
	RUM_SAMPLE_RATE: '0',
	LIGHTHOUSE_TARGET: target
};

if (target === 'dashboard') {
	const { createSessions } = await import('../src/lib/server/session.ts');
	const token = await createSessions({ secret: SECRET }).sign('demo_viewer');
	// The name the production server reads (`__Host-` needs HTTPS, which the cookie header ignores).
	env.LIGHTHOUSE_COOKIE = `__Host-session=${token}`;
}

const lhci = createRequire(import.meta.url).resolve('@lhci/cli/src/cli.js');
const { status } = spawnSync(
	process.execPath,
	[lhci, 'autorun', '--config=lighthouse/lighthouserc.cjs'],
	{ env, stdio: 'inherit' }
);
process.exit(status ?? 1);
