import { AnyRentError, getFleets, getOptionals, getPrices, getStations } from './anyrent'
import { assertBrowserToken, BrowserTokenError } from './auth'
import { withCors } from './cors'
import { toAnyRentDate } from './dates'
import type { Env, Lang } from './types'

const PUBLIC_PATHS = new Set([
  '/health',
  '/api/stations',
  '/api/fleets',
  '/api/optionals',
  '/api/prices',
])

function json(data: unknown, status = 200, extra: HeadersInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': status === 200 ? 'public, max-age=60' : 'no-store',
      ...extra,
    },
  })
}

function errorJson(message: string, status: number, detail?: unknown): Response {
  return json(
    {
      error: message,
      ...(detail !== undefined ? { detail } : {}),
    },
    status,
    { 'Cache-Control': 'no-store' },
  )
}

function parseLang(raw: string | null): Lang {
  const v = (raw || 'es').toLowerCase()
  if (v === 'en' || v === 'pt' || v === 'es') return v
  return 'es'
}

function requireParam(url: URL, name: string): string {
  const v = url.searchParams.get(name)?.trim()
  if (!v) throw new AnyRentError(`Missing query param: ${name}`, 400)
  return v
}

async function handle(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const path = url.pathname.replace(/\/$/, '') || '/'

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204 })
  }

  if (request.method !== 'GET') {
    return errorJson('Method not allowed', 405)
  }

  if (path === '/' || path === '/health') {
    return json({
      ok: true,
      service: 'ready-rentacar-bff',
      version: '0.1.0',
      endpoints: [...PUBLIC_PATHS].filter((p) => p.startsWith('/api')),
    })
  }

  if (!PUBLIC_PATHS.has(path)) {
    return errorJson('Not found', 404)
  }

  // Gate AnyRent-backed routes: no token → 401, zero upstream calls.
  if (path.startsWith('/api/')) {
    try {
      assertBrowserToken(request, env)
    } catch (err) {
      if (err instanceof BrowserTokenError) {
        return errorJson(err.message, err.status)
      }
      throw err
    }
  }

  const lang = parseLang(url.searchParams.get('lang'))

  try {
    switch (path) {
      case '/api/stations':
        return json({ lang, data: await getStations(env, lang) })
      case '/api/fleets':
        return json({ lang, data: await getFleets(env, lang) })
      case '/api/optionals':
        return json({ lang, data: await getOptionals(env, lang) })
      case '/api/prices': {
        const pickup_station = requireParam(url, 'pickup_station')
        const dropoff_station = requireParam(url, 'dropoff_station')
        let pickup_date: string
        let dropoff_date: string
        try {
          pickup_date = toAnyRentDate(requireParam(url, 'pickup_date'))
          dropoff_date = toAnyRentDate(requireParam(url, 'dropoff_date'))
        } catch (e) {
          return errorJson((e as Error).message, 400)
        }
        const data = await getPrices(env, {
          lang,
          pickup_station,
          dropoff_station,
          pickup_date,
          dropoff_date,
          rate: url.searchParams.get('rate') ?? undefined,
          voucher_code: url.searchParams.get('voucher_code') ?? undefined,
        })
        return json(
          {
            lang,
            query: {
              pickup_station,
              dropoff_station,
              pickup_date,
              dropoff_date,
              rate: url.searchParams.get('rate') || null,
              voucher_code: url.searchParams.get('voucher_code') || null,
            },
            data,
          },
          200,
          { 'Cache-Control': 'private, max-age=30' },
        )
      }
      default:
        return errorJson('Not found', 404)
    }
  } catch (err) {
    if (err instanceof AnyRentError) {
      return errorJson(err.message, err.status >= 400 && err.status < 600 ? err.status : 502, err.body)
    }
    console.error(err)
    return errorJson('Internal error', 500)
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const res = await handle(request, env)
    return withCors(res, request, env)
  },
}
