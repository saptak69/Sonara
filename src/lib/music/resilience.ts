/** Timeouts and a per-provider circuit breaker, so one slow or failing API can't stall a page. */

export class ProviderError extends Error {
  readonly provider: string;
  readonly kind: "timeout" | "rate-limited" | "unavailable" | "upstream";
  constructor(provider: string, kind: ProviderError["kind"], message: string) {
    super(`${provider}: ${message}`);
    this.provider = provider;
    this.kind = kind;
  }
}

export async function withTimeout<T>(
  provider: string,
  ms: number,
  run: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new ProviderError(provider, "timeout", `no answer in ${ms} ms`));
    }, ms);
  });
  try {
    return await Promise.race([run(controller.signal), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * After `threshold` failures in a row a provider is skipped for `cooldownMs`, then
 * tried again. Kept in memory, so each server instance learns on its own.
 */
export function createCircuitBreaker({ threshold = 3, cooldownMs = 30_000 } = {}) {
  const state = new Map<string, { failures: number; openUntil: number }>();
  return {
    isOpen(provider: string, now = Date.now()): boolean {
      const s = state.get(provider);
      return Boolean(s && s.openUntil > now);
    },
    success(provider: string) {
      state.delete(provider);
    },
    failure(provider: string, now = Date.now()) {
      const s = state.get(provider) ?? { failures: 0, openUntil: 0 };
      s.failures += 1;
      if (s.failures >= threshold) {
        s.openUntil = now + cooldownMs;
        s.failures = 0;
      }
      state.set(provider, s);
    },
  };
}

export async function fetchJson<T>(provider: string, url: string, signal: AbortSignal, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, { ...init, signal });
  if (res.status === 429) throw new ProviderError(provider, "rate-limited", "rate limited");
  if (!res.ok) throw new ProviderError(provider, "upstream", `HTTP ${res.status}`);
  return (await res.json()) as T;
}
