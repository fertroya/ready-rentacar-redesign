# Ready Rent-a-Car — BFF

Cloudflare Worker that holds the AnyRent Cloud API key and exposes a **public, read-only** API for the redesign.

```text
Browser (merged/ later) ──GET /api/*──► BFF Worker ──X-Api-Key──► readyrac.api.anyrent.pt/v1
```

**Not exposed:** `/bookings`, `/customers`, payment secrets. Payments come in a later phase.

## Endpoints

| Method | Path | Upstream |
|--------|------|----------|
| `GET` | `/health` | — |
| `GET` | `/api/stations?lang=es` | `/stations` |
| `GET` | `/api/fleets?lang=es` | `/fleets` |
| `GET` | `/api/optionals?lang=es` | `/optionals` |
| `GET` | `/api/prices?...` | `/prices` |

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
# paste key from October → ANYRENT → Configuraciónes → AnyRent API
npm run dev
```

Smoke:

```bash
curl -s http://127.0.0.1:8787/health | jq .
curl -s 'http://127.0.0.1:8787/api/stations?lang=es' | jq '.data | length'
curl -s 'http://127.0.0.1:8787/api/prices?pickup_station=bariloche&dropoff_station=bariloche&pickup_date=2026-08-01T10:00:00Z&dropoff_date=2026-08-08T10:00:00Z&lang=es' \
  | jq '.query, (.data.fleets[0].groups | map({code, total: .rate.total_after_tax}))'
```

## Deploy

Cuenta usada para staging: Cloudflare de desarrollo (subdominio `ready-rentacar-ft.workers.dev`).

```bash
npx wrangler secret put ANYRENT_API_KEY
npm run deploy
```

URL staging actual:

`https://ready-rentacar-bff.ready-rentacar-ft.workers.dev`

Luego se puede apuntar `api.readyrentacar.com.ar` CNAME al worker (cutover / F6).

## Frontend wire (read-only)

Default mock mode is **`bff`** (`merged/js`): quote step loads `/api/prices` from the Worker.

- **Safe:** catalog + prices only (no `POST /bookings`, no payment charge)
- **Pay step:** WhatsApp summary only until F4 + deposit
- **October handoff:** only with `?engine=live` (opt-in)
- Toggle footer: **BFF ↔ DEMO**

Mock config: `READY_DATA.bff.baseUrl` in `merged/js/data.js`.

## Safety

- Never commit `.dev.vars`
- Rotate `ANYRENT_API_KEY` if it was pasted in chat / October screenshots
- Do not proxy ops endpoints (`/bookings`, `/customers`) through this public BFF
