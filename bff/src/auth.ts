import type { Env } from './types'

export const BFF_BROWSER_TOKEN_HEADER = 'X-Ready-Bff-Token'

/** Constant-time-ish string compare for Worker (no crypto.subtle dependency). */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

/**
 * Require browser token on AnyRent-backed routes.
 * Fail closed if secret is unset or header missing/wrong — never call upstream.
 */
export function assertBrowserToken(request: Request, env: Env): void {
  const expected = (env.BFF_BROWSER_TOKEN || '').trim()
  if (!expected) {
    throw new BrowserTokenError('BFF_BROWSER_TOKEN is not configured')
  }
  const got = (request.headers.get(BFF_BROWSER_TOKEN_HEADER) || '').trim()
  if (!got || !timingSafeEqual(got, expected)) {
    throw new BrowserTokenError('Missing or invalid X-Ready-Bff-Token')
  }
}

export class BrowserTokenError extends Error {
  readonly status = 401

  constructor(message: string) {
    super(message)
    this.name = 'BrowserTokenError'
  }
}
