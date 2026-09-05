import "server-only";

export type RateLimitInfo = {
  count: number;
  lastReset: number;
};

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

export interface RateLimitBackend {
  check(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
}

const MEMORY_MAP_MAX_KEYS = 10_000;
const AI_RATE_LIMIT_KEY_PATTERN =
  /^(ai-advisor|planner-ai-advisor|planner-sketch-to-plan|filter|generate-alt|configurator-smart-wizard|nav-search|studio-ai-generate|studio-ai-suggest|studio-ai-restyle):/i;

/**
 * 10.1: when the distributed backend is configured but unavailable, non-AI
 * routes degrade to per-instance in-memory limiting (best effort). That is a
 * deliberate fail-open trade-off for availability — but it must be observable,
 * so emit a throttled warning (once per minute) in production.
 */
const DEGRADED_WARN_INTERVAL_MS = 60_000;
let lastDegradedWarnMs = 0;

function warnDistributedBackendDegraded(reason: string): void {
  if (process.env.NODE_ENV !== "production") {
    return;
  }
  const now = Date.now();
  if (now - lastDegradedWarnMs < DEGRADED_WARN_INTERVAL_MS) {
    return;
  }
  lastDegradedWarnMs = now;
  console.warn(
    `[rateLimit] distributed backend unavailable (${reason}) — degrading to per-instance in-memory limiting; on multi-instance deployments limits are per-instance until the backend recovers. AI-scoped keys still fail closed.`,
  );
}

const rateLimitMap = new Map<string, RateLimitInfo>();
let defaultBackendPromise: Promise<RateLimitBackend> | null = null;

export function hasDistributedRateLimit(): boolean {
  return Boolean(
    process.env.NEXT_ADMIN_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_ADMIN_SERVICE_ROLE_KEY?.trim(),
  );
}

export function isAiScopedRateLimitKey(key: string): boolean {
  return AI_RATE_LIMIT_KEY_PATTERN.test(key);
}

function evictMemoryEntriesIfNeeded(now: number, windowMs: number): void {
  if (rateLimitMap.size <= MEMORY_MAP_MAX_KEYS) {return;}

  for (const [entryKey, info] of rateLimitMap) {
    if (now - info.lastReset > windowMs) {
      rateLimitMap.delete(entryKey);
    }
  }

  while (rateLimitMap.size > MEMORY_MAP_MAX_KEYS) {
    const oldestKey = rateLimitMap.keys().next().value;
    if (!oldestKey) {break;}
    rateLimitMap.delete(oldestKey);
  }
}

function applyMemoryRateLimit(
  key: string,
  limit: number = 20,
  windowMs: number = 60000,
): RateLimitResult {
  const now = Date.now();
  evictMemoryEntriesIfNeeded(now, windowMs);

  const info = rateLimitMap.get(key) ?? { count: 0, lastReset: now };

  if (now - info.lastReset > windowMs) {
    info.count = 0;
    info.lastReset = now;
  }

  if (info.count >= limit) {
    return { success: false, limit, remaining: 0, reset: info.lastReset + windowMs };
  }

  info.count += 1;
  rateLimitMap.set(key, info);

  return {
    success: true,
    limit,
    remaining: limit - info.count,
    reset: info.lastReset + windowMs,
  };
}

function memoryRateLimitOrFailClosed(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  if (process.env.NODE_ENV === "production" && isAiScopedRateLimitKey(key)) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: Date.now() + windowMs,
    };
  }

  return applyMemoryRateLimit(key, limit, windowMs);
}

export async function rateLimit(
  key: string,
  limit: number = 20,
  windowMs: number = 60000,
  backend?: RateLimitBackend,
): Promise<RateLimitResult> {
  if (backend) {
    return backend.check(key, limit, windowMs);
  }

  if (hasDistributedRateLimit()) {
    defaultBackendPromise ??= createSupabaseRateLimitBackend();
    try {
      const distributedBackend = await defaultBackendPromise;
      return await distributedBackend.check(key, limit, windowMs);
    } catch (error) {
      // Setting up (or querying) the distributed backend failed — never let a
      // rate-limiter infra hiccup 500 the calling API route. Reset the cached
      // promise so a transient failure (e.g. a cold-start dynamic-import glitch)
      // doesn't permanently poison every future request, then fail open to the
      // in-memory limiter for this call (10.1: warn, throttled).
      defaultBackendPromise = null;
      warnDistributedBackendDegraded(
        error instanceof Error ? error.message : "setup/query failure",
      );
      return memoryRateLimitOrFailClosed(key, limit, windowMs);
    }
  }

  return memoryRateLimitOrFailClosed(key, limit, windowMs);
}

function memoryFallbackBackend(): RateLimitBackend {
  return {
    check(key, limit, windowMs) {
      return Promise.resolve(
        memoryRateLimitOrFailClosed(key, limit, windowMs),
      );
    },
  };
}

export async function createSupabaseRateLimitBackend(): Promise<RateLimitBackend> {
  // Admin project owns `consume_rate_limit`. Missing Admin env must not throw
  // into API routes — same fail-open / AI fail-closed path as a null client.
  if (!hasDistributedRateLimit()) {
    return memoryFallbackBackend();
  }

  try {
    const { createSupabaseAuthAdminClient } = await import(
      "@/platform/supabase/auth-admin"
    );
    const supabase = createSupabaseAuthAdminClient();

    return {
      async check(key, limit, windowMs) {
        try {
          // `consume_rate_limit` owns the whole reset/increment decision in one
          // database statement, so concurrent server instances cannot overwrite
          // one another's increments with a read-then-upsert race.
          const { data, error } = await supabase.rpc("consume_rate_limit", {
            p_key: key,
            p_limit: limit,
            p_window_ms: windowMs,
          });
          if (error) {
            warnDistributedBackendDegraded(error.message ?? "RPC error");
            return memoryRateLimitOrFailClosed(key, limit, windowMs);
          }

          const row = data?.[0];
          if (
            !row ||
            typeof row.allowed !== "boolean" ||
            typeof row.count !== "number" ||
            typeof row.window_start !== "number"
          ) {
            warnDistributedBackendDegraded("invalid RPC response");
            return memoryRateLimitOrFailClosed(key, limit, windowMs);
          }

          return {
            success: row.allowed,
            limit,
            remaining: Math.max(0, limit - row.count),
            reset: row.window_start + windowMs,
          };
        } catch {
          warnDistributedBackendDegraded("unexpected check failure");
          return memoryRateLimitOrFailClosed(key, limit, windowMs);
        }
      },
    };
  } catch (error) {
    warnDistributedBackendDegraded(
      error instanceof Error ? error.message : "admin client unavailable",
    );
    return memoryFallbackBackend();
  }
}
