import { describe, expect, it } from 'vitest'
import { allowedOrigins, corsHeaders } from './cors'
import type { Env } from './types'

const env = (origins: string): Env => ({
  ANYRENT_API_BASE: 'https://example.test/v1',
  ANYRENT_API_KEY: 'test',
  CORS_ORIGINS: origins,
})

describe('cors', () => {
  it('parses comma-separated origins', () => {
    expect(allowedOrigins(env(' https://a.example ,http://localhost:5500 '))).toEqual([
      'https://a.example',
      'http://localhost:5500',
    ])
  })

  it('reflects allowed Origin', () => {
    const req = new Request('https://bff.test/health', {
      headers: { Origin: 'https://fertroya.github.io' },
    })
    const h = corsHeaders(req, env('https://fertroya.github.io,http://localhost:8080')) as Record<
      string,
      string
    >
    expect(h['Access-Control-Allow-Origin']).toBe('https://fertroya.github.io')
    expect(h['Access-Control-Allow-Methods']).toContain('GET')
  })

  it('omits Allow-Origin for unknown Origin', () => {
    const req = new Request('https://bff.test/health', {
      headers: { Origin: 'https://evil.example' },
    })
    const h = corsHeaders(req, env('https://fertroya.github.io')) as Record<string, string>
    expect(h['Access-Control-Allow-Origin']).toBeUndefined()
  })
})
