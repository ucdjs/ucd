import { getOwnProperty } from "@luxass/utils";

/**
 * Validates that required environment variables are present and returns a typed environment object.
 *
 * This function ensures that specified environment variables exist in the provided environment object.
 * If any required keys are missing, it throws an error. Otherwise, it returns the environment object
 * with proper typing where required keys are guaranteed to be present.
 *
 * @template {object} Env - The type of the environment object
 * @template {keyof Env} Keys - The keys from Env that are required to be present
 * @param {Env} env - The environment object to validate
 * @param {Keys[]} requiredKeys - Array of keys that must be present in the environment object
 * @returns {Required<Pick<Env, Keys>> & Partial<Omit<Env, Keys>>} The environment object with required keys typed as non-nullable and optional keys as partial
 * @throws {Error} When any of the required environment variables are missing
 *
 * @example
 * ```typescript
 * import { requiredEnv } from "@ucdjs/env";
 * const env = { DATABASE_URL: "...", API_KEY: "...", OPTIONAL_VAR: undefined };
 * const validatedEnv = requiredEnv(env, ["DATABASE_URL", "API_KEY"]);
 * // validatedEnv.DATABASE_URL and validatedEnv.API_KEY are guaranteed to be present
 * // validatedEnv.OPTIONAL_VAR remains optional
 * ```
 */
export function requiredEnv<Env extends object, Keys extends keyof Env>(
  env: Env,
  requiredKeys: Keys[],
): Required<Pick<Env, Keys>> & Partial<Omit<Env, Keys>> {
  for (const key of requiredKeys) {
    if (getOwnProperty(env, key as string) == null) {
      throw new Error(`Missing required env var: ${key as string}`);
    }
  }

  return env as any;
}
