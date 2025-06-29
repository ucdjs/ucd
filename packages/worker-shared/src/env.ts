import { getOwnProperty } from "@luxass/utils/object"

/**
 * Validates that required environment variables are present and not undefined.
 *
 * This function takes an environment object and a keys specification object,
 * then ensures all specified keys exist and are not undefined in the environment.
 * If any required key is missing or undefined, it throws an error.
 *
 * @template {object} T - The type of the environment object
 * @param {T} env - The environment object to validate
 * @param {object} keys - An object specifying which keys are required (all values should be `true`)
 * @returns {{ [K in keyof T]-?: NonNullable<T[K]> }} A type-safe version of the environment object where all specified keys are guaranteed to be non-nullable
 * @throws {Error} When a required environment variable is missing or undefined
 *
 * @example
 * ```typescript
 * const env = { API_KEY: "abc123", PORT: "3000", DEBUG: undefined };
 * const validatedEnv = requiredEnv(env, { API_KEY: true, PORT: true });
 * // validatedEnv.API_KEY and validatedEnv.PORT are guaranteed to be non-null
 * // Would throw if DEBUG was specified as required
 * ```
 */
export function requiredEnv<T extends object>(
	env: T,
	keys: { [K in keyof T]: true }
): { [K in keyof T]-?: NonNullable<T[K]> } {
	for (const key of Object.keys(keys)) {
		if (getOwnProperty(env, key) === undefined) {
			throw new Error(`Missing required env var: ${key}`)
		}
	}
	return env as any
}
