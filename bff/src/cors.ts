import type { Env } from './types'

/** Parse CORS allow-list from comma-separated env. */
export function allowedOrigins(env: Env): string[] {
  return (env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function corsHeaders(request: Request, env: Env): HeadersInit {
  const origin = request.headers.get('Origin') || ''
  const allow = allowedOrigins(env)
  const ok = origin && allow.includes(origin)
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept, X-Ready-Bff-Token',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
  if (ok) {
    headers['Access-Control-Allow-Origin'] = origin
  }
  return headers
}

export function withCors(response: Response, request: Request, env: Env): Response {
  const headers = new Headers(response.headers)
  const extra = corsHeaders(request, env)
  for (const [k, v] of Object.entries(extra)) {
    headers.set(k, v)
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
