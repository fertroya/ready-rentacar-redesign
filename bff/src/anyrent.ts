import type { Env, Lang } from './types'

export class AnyRentError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message)
    this.name = 'AnyRentError'
  }
}

function baseUrl(env: Env): string {
  return (env.ANYRENT_API_BASE || 'https://readyrac.api.anyrent.pt/v1').replace(/\/$/, '')
}

async function anyrentFetch(
  env: Env,
  path: string,
  query: Record<string, string | undefined> = {},
): Promise<unknown> {
  if (!env.ANYRENT_API_KEY) {
    throw new AnyRentError('ANYRENT_API_KEY is not configured', 500)
  }

  const url = new URL(`${baseUrl(env)}${path.startsWith('/') ? path : `/${path}`}`)
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== '') {
      url.searchParams.set(k, v)
    }
  }

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'X-Api-Key': env.ANYRENT_API_KEY,
    },
  })

  const text = await res.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { raw: text }
    }
  }

  if (!res.ok) {
    throw new AnyRentError(`AnyRent ${path} failed`, res.status, data)
  }

  return data
}

export function getStations(env: Env, lang: Lang) {
  return anyrentFetch(env, '/stations', { lang })
}

export function getFleets(env: Env, lang: Lang) {
  return anyrentFetch(env, '/fleets', { lang })
}

export function getOptionals(env: Env, lang: Lang) {
  return anyrentFetch(env, '/optionals', { lang })
}

export interface PricesQuery {
  lang: Lang
  pickup_station: string
  dropoff_station: string
  pickup_date: string
  dropoff_date: string
  rate?: string
  voucher_code?: string
}

export function getPrices(env: Env, q: PricesQuery) {
  return anyrentFetch(env, '/prices', {
    lang: q.lang,
    pickup_station: q.pickup_station,
    dropoff_station: q.dropoff_station,
    pickup_date: q.pickup_date,
    dropoff_date: q.dropoff_date,
    rate: q.rate ?? '',
    voucher_code: q.voucher_code ?? '',
  })
}
