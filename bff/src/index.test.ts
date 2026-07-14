import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from './index'
import type { Env } from './types'

const env: Env = {
  ANYRENT_API_BASE: 'https://anyrent.test/v1',
  ANYRENT_API_KEY: 'k-test',
  CORS_ORIGINS: 'https://fertroya.github.io',
}

describe('worker fetch', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns health payload', async () => {
    const res = await worker.fetch(new Request('https://bff.test/health'), env)
    expect(res.status).toBe(200)
    const body = (await res.json()) as { ok: boolean; service: string }
    expect(body.ok).toBe(true)
    expect(body.service).toBe('ready-rentacar-bff')
  })

  it('rejects non-GET', async () => {
    const res = await worker.fetch(
      new Request('https://bff.test/api/stations', { method: 'POST' }),
      env,
    )
    expect(res.status).toBe(405)
  })

  it('requires prices params', async () => {
    const res = await worker.fetch(new Request('https://bff.test/api/prices'), env)
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string }
    expect(String(body.error)).toMatch(/pickup_station/)
  })

  it('proxies stations with X-Api-Key', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json([{ code: 'bariloche' }], { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const res = await worker.fetch(
      new Request('https://bff.test/api/stations?lang=es', {
        headers: { Origin: 'https://fertroya.github.io' },
      }),
      env,
    )
    expect(res.status).toBe(200)
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://fertroya.github.io')
    const body = (await res.json()) as { data: unknown }
    expect(body.data).toEqual([{ code: 'bariloche' }])

    expect(fetchMock).toHaveBeenCalled()
    const [called, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(called).toContain('https://anyrent.test/v1/stations')
    expect(called).toContain('lang=es')
    expect((init.headers as Record<string, string>)['X-Api-Key']).toBe('k-test')
  })
})
