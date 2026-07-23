export interface Env {
  ANYRENT_API_BASE: string
  ANYRENT_API_KEY: string
  /** Browser gate for /api/* (header X-Ready-Bff-Token). Not the AnyRent key. */
  BFF_BROWSER_TOKEN: string
  CORS_ORIGINS: string
}

export type Lang = 'es' | 'en' | 'pt'
