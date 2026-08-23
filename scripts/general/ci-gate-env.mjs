/** Shared CI gate helpers — keep free of workstation/launch import cycles. */

/**
 * @param {NodeJS.ProcessEnv | Record<string, string | undefined>} [env]
 */
export function hasEnvValue(name, env = process.env) {
  return Boolean(env[name]?.trim());
}

/**
 * GitHub Actions PR workflows reference secrets that are empty when the repo
 * has not configured them. Fast gate should not hard-fail on missing local
 * workstation secrets in that case — full gate on main still expects secrets.
 *
 * @param {NodeJS.ProcessEnv | Record<string, string | undefined>} [env]
 */
export function isCiGateWithoutSecrets(env = process.env) {
  return env.CI === "true" && !hasEnvValue("SUPABASE_SERVICE_ROLE_KEY", env);
}
