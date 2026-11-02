import type { z } from 'zod';

const MAX_LISTED = 5;

/**
 * Raised when a data file does not match its schema. It names the file and the first few broken
 * fields, so a bad file fails the boot with a message that says what to fix.
 */
export class DataValidationError extends Error {
	constructor(
		readonly file: string,
		readonly problems: readonly string[]
	) {
		const listed = problems.slice(0, MAX_LISTED).map((problem) => `  - ${problem}`);
		const rest = problems.length - listed.length;
		if (rest > 0) listed.push(`  …and ${rest} more`);
		super(`Invalid data in ${file} (${problems.length} problem(s)):\n${listed.join('\n')}`);
		this.name = 'DataValidationError';
	}
}

type UniqueKeys<Row> = Record<string, (row: Row) => string>;

/**
 * Validates a whole collection at the boundary: every row against `schema`, then the fields that
 * must be unique. Returns typed rows or throws a `DataValidationError`; never a partial result.
 */
export function parseCollection<Schema extends z.ZodType>(
	file: string,
	schema: Schema,
	raw: unknown,
	unique: UniqueKeys<z.output<Schema>> = {}
): z.output<Schema>[] {
	if (!Array.isArray(raw)) {
		throw new DataValidationError(file, [
			`expected an array, got ${raw === null ? 'null' : typeof raw}`
		]);
	}

	const problems: string[] = [];
	const rows: z.output<Schema>[] = [];
	raw.forEach((candidate, index) => {
		const result = schema.safeParse(candidate);
		if (result.success) {
			rows.push(result.data);
			return;
		}
		for (const issue of result.error.issues) {
			const path = issue.path.length > 0 ? `.${issue.path.join('.')}` : '';
			problems.push(`[${index}]${path}: ${issue.message}`);
		}
	});
	if (problems.length > 0) throw new DataValidationError(file, problems);

	for (const [field, keyOf] of Object.entries(unique)) {
		const seen = new Set<string>();
		for (const row of rows) {
			const key = keyOf(row);
			if (seen.has(key)) problems.push(`duplicate ${field}: ${JSON.stringify(key)}`);
			seen.add(key);
		}
	}
	if (problems.length > 0) throw new DataValidationError(file, problems);

	return rows;
}
