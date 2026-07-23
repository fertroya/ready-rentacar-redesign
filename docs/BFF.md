# Ready Rent-a-Car — BFF

Cloudflare Worker that holds the AnyRent Cloud API key and exposes a **gated, read-only** API for the redesign.

```text
Browser (merged/) ──GET /api/* + X-Ready-Bff-Token──► BFF Worker ──X-Api-Key──► readyrac.api.anyrent.pt/v1
```

**Not exposed:** `/bookings`, `/customers`, payment secrets. Payments come in a later phase.

## Quota gate (scrapers / refreshes)

Public staging must **not** burn the shared AnyRent daily quota.

| Layer | Behavior |
|-------|----------|
| Frontend default | Engine **`demo`** (mock prices). Live AnyRent only with `?engine=bff` **and** a browser token. |
| Worker `/api/*` | Requires header **`X-Ready-Bff-Token`** matching secret `BFF_BROWSER_TOKEN`. Wrong/missing → **401**, zero upstream. |
| `/health` | Public (CI smoke). |

Enable BFF locally / controlled demos (never commit the token):

```js
localStorage.setItem('ready_bff_token', '<same value as BFF_BROWSER_TOKEN>')
localStorage.setItem('ready_engine', 'bff')
// or: ?engine=bff after setting the token
```

`curl` without the header must fail:

```bash
curl -sS 'https://ready-rentacar-bff.ready-rentacar-ft.workers.dev/api/stations?lang=es'
# {"error":"Missing or invalid X-Ready-Bff-Token"}
```

## Endpoints

| Method | Path | Upstream | Auth |
|--------|------|----------|------|
| `GET` | `/health` | — | none |
| `GET` | `/api/stations?lang=es` | `/stations` | `X-Ready-Bff-Token` |
| `GET` | `/api/fleets?lang=es` | `/fleets` | `X-Ready-Bff-Token` |
| `GET` | `/api/optionals?lang=es` | `/optionals` | `X-Ready-Bff-Token` |
| `GET` | `/api/prices?...` | `/prices` | `X-Ready-Bff-Token` |

### `/api/prices` query

| Param | Required | Notes |
|-------|----------|-------|
| `pickup_station` | yes | e.g. `bariloche` |
| `dropoff_station` | yes | e.g. `el-calafate` |
| `pickup_date` | yes | ISO (`2026-08-01T10:00:00Z`) **or** AnyRent (`20260801T100000Z`) |
| `dropoff_date` | yes | same |
| `lang` | no | `es` (default), `en`, `pt` |
| `rate` | no | empty → AnyRent default `WEBSITE` |
| `voucher_code` | no | |

Auth to AnyRent: header `X-Api-Key` only (never query `api_key` from this BFF).

## Local setup

```bash
cd bff
npm install
cp .dev.vars.example .dev.vars
# paste ANYRENT_API_KEY + BFF_BROWSER_TOKEN
npm run dev
```

Smoke:

```bash
TOKEN=…   # same as BFF_BROWSER_TOKEN
curl -s http://127.0.0.1:8787/health | jq .
curl -s -H "X-Ready-Bff-Token: $TOKEN" \
  'http://127.0.0.1:8787/api/stations?lang=es' | jq '.data | length'
curl -s -H "X-Ready-Bff-Token: $TOKEN" \
  'http://127.0.0.1:8787/api/prices?pickup_station=bariloche&dropoff_station=bariloche&pickup_date=2026-08-01T10:00:00Z&dropoff_date=2026-08-08T10:00:00Z&lang=es' \
  | jq '.query, (.data.fleets[0].groups | map({code, total: .rate.total_after_tax}))'
```

## Deploy

**Wrangler** is Cloudflare’s official CLI for Workers (build/dev/deploy/tail). Not a nickname we invented — see [developers.cloudflare.com/workers/wrangler](https://developers.cloudflare.com/workers/wrangler/).

Cuenta staging: subdominio `ready-rentacar-ft.workers.dev`.

```bash
npx wrangler secret put ANYRENT_API_KEY
npx wrangler secret put BFF_BROWSER_TOKEN
npm run deploy
```

URL staging:

`https://ready-rentacar-bff.ready-rentacar-ft.workers.dev`

Luego se puede apuntar `api.readyrentacar.com.ar` CNAME al worker (cutover / F6).

## CI / CD (GitHub Actions)

| Workflow | Trigger | What |
|----------|---------|------|
| `BFF CI` | PR / push `bff/**` | `npm ci` → typecheck + vitest |
| `BFF Deploy` | push `main` on `bff/**` (or manual) | CI + `wrangler deploy` + `/health` smoke |
| `Site CI` | PR / push `merged/**` | `node --check` on mock JS (Pages already publishes from `main`) |

Repo secrets (Settings → Secrets → Actions):

| Secret | Purpose |
|--------|---------|
| `CLOUDFLARE_API_TOKEN` | Token with **Account → Workers Scripts → Edit** (+ read account) |
| `CLOUDFLARE_ACCOUNT_ID` | `d612886b0f95fe3fc7adf0647e69dd40` (also in `wrangler.toml`) |

Optional: create GitHub Environment `bff-staging` later if you want approval gates.

`ANYRENT_API_KEY` and `BFF_BROWSER_TOKEN` stay as **Worker secrets** (`wrangler secret put`); Actions deploy does not rewrite them.

Workers Logs: `[observability] enabled = true` in `wrangler.toml` (dashboard → Worker → Observability).

## Frontend wire (read-only)

Default mock mode is **`demo`** (`merged/js`): no AnyRent calls until you opt into BFF with a token.

- **Safe:** catalog + prices only (no `POST /bookings`, no payment charge)
- **Pay step:** WhatsApp summary only until F4 + deposit
- **October handoff:** only with `?engine=live` (opt-in)
- Toggle footer: **BFF ↔ DEMO** (BFF still needs `ready_bff_token`)

Mock config: `READY_DATA.bff.baseUrl` in `merged/js/data.js`.

## Safety

- Never commit `.dev.vars` or `ready_bff_token` values
- Rotate `ANYRENT_API_KEY` if it was pasted in chat / October screenshots
- Rotate `BFF_BROWSER_TOKEN` if it was shared in chat or screenshots
- Do not proxy ops endpoints (`/bookings`, `/customers`) through this BFF
