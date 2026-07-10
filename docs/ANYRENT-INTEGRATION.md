# AnyRent / Jedeye — how to adapt the redesign

## Security first

The URL you shared (`/backend/jedeye/anyrent/reservations`) is the **staff admin panel**, not a public booking API.

- **Do not** put `ivana.pirles` / password in the GitHub Pages frontend, `data.js`, or any client bundle.
- **Rotate that password** — it was pasted in chat.
- Admin login is for ops (reservations, fleet, extras). Public quotes must use either:
  1. the **public booking flow** already on `readyrentacar.com.ar`, or
  2. Jedeye’s **documented XML/JSON API** with a dedicated API user / key (ask Jedeye for docs + credentials).

## What the live site already does

Ready’s public site is OctoberCMS + Jedeye AnyRent plugin:

| Piece | Live behavior |
| --- | --- |
| Search form | `POST` to `/en` with handler `reservationComponent::onMainFormPost` |
| Fields | `pickup_station`, `pickup_date`, `pickup_time`, `dropoff_station`, `dropoff_date`, `dropoff_time`, `driver_age` |
| Date/time | `M/D/YYYY` + `g:i A` (e.g. `7/31/2026`, `10:00 AM`) |
| Success | JSON `{ "X_OCTOBER_REDIRECT": ".../en/booking/step2" }` then session continues on step 2 (vehicles → extras → pay) |
| Fleet groups | `1__suvat`, `1__GFAM`, `1__XXAR`, `1__van`, `1__PICKUPMT`, `1__FQBD`, `1__OFBD` |
| Stations | `bariloche`, `san-martin-de-los-andes`, `esquel`, `el-calafate`, `ushuaia`, `mendoza-aeropuerto` |

Scripts on live:

- `/plugins/jedeye/anyrent/assets/js/reservation.min.js`
- `/plugins/jedeye/anyrent/assets/js/groupreservation.module.min.js`

## Three integration paths

### Path A — Handoff (recommended next step, days)

Keep our Patagonia UI for marketing + search. On **Cotizar**, open/post into the live AnyRent booking (`/en` → `/booking/step2`) so **prices, extras, insurance, Mercado Pago** stay authoritative in Jedeye.

- Pros: real rates & inventory, no API key in the browser, fastest to production.
- Cons: step 2+ still looks like the current engine until we restyle that theme or replace it later.

Prototype support: `merged/js/jedeye.js` + `?engine=live` on the merged site.

### Path B — BFF + AnyRent API (best long-term UX, weeks)

Small backend (Cloudflare Worker / Node / PHP on Ready’s host) that:

1. Holds API credentials **server-side only**
2. Exposes safe endpoints: `GET /stations`, `POST /quote`, `GET /extras`, `POST /reservation`
3. Our redesign calls the BFF; never talks to admin or raw API keys

Ask Jedeye for: API base URL, auth method, OTA/XML vs JSON, extras catalog IDs, one-way fee rules, payment webhooks (Mercado Pago / Stripe).

### Path C — Embed booking engine

AnyRent can embed their booking portal in a page. Fast, but harder to keep the expedition look on every step. Use if handoff styling is unacceptable and API access is delayed.

## ID map (redesign ↔ live)

| Our id | Live station slug |
| --- | --- |
| `brc` | `bariloche` |
| `cpc` | `san-martin-de-los-andes` |
| `eqs` | `esquel` |
| `fte` | `el-calafate` |
| `ush` | `ushuaia` |
| `mdz` | `mendoza-aeropuerto` |

| Our car id | Live fleet gid |
| --- | --- |
| `tracker` | `1__suvat` |
| `cross` | `1__GFAM` |
| `spin` | `1__XXAR` |
| `hiace` | `1__van` |
| `hiluxm` | `1__PICKUPMT` |
| `hilux` | `1__FQBD` |
| `sw4` | `1__OFBD` |

Extras (chains, child seats, etc.) live inside the AnyRent reservation modal after vehicle select — confirm exact extra codes in admin under tariffs/optionals, then map them in the BFF.

## Suggested rollout

1. **Now:** Path A handoff from our search (demo mode remains default on GitHub Pages).
2. **With Ivana / Jedeye:** export extras + one-way fee tables; request API access.
3. **Then:** Path B BFF; keep Path A as fallback.
4. **Theme:** optionally restyle October `/booking/*` to match the expedition UI so handoff feels continuous.

## How to try live handoff on the prototype

Open:

`https://fertroya.github.io/ready-rentacar-redesign/merged/?engine=live`

or locally `merged/index.html?engine=live` — Cotizar posts into the live Ready booking engine.

## Plan B — no theme access in October admin

Jedeye often hides **CMS → Themes**. If you only have Contenido / Configuración (SEO, admins, mail, languages), you cannot activate a new front-end theme from the UI.

### What DNS alone cannot do

NIC.ar / DNS maps **hostnames → IPs**. It cannot say:

- `/` → GitHub Pages  
- `/backend` → October  

Path-based split needs a **reverse proxy** (Cloudflare, nginx, CDN worker), not an A/CNAME record.

### Plan B options (best → fallback)

| Option | How | Keeps AnyRent? | Notes |
| --- | --- | --- | --- |
| **B1 · FTP/cPanel theme upload** | Ask Towebs/Jedeye for filesystem access; drop `themes/ready-patagonia` and set active theme in DB/config | Yes, same origin | Best if they won’t give Themes UI |
| **B2 · Cloudflare (or similar) path proxy** | Point `www` DNS to Cloudflare; Worker/Rules: `/backend*`, `/plugins*`, `/modules*`, `/booking*` → origin October; everything else → GH Pages / static host | Yes | Real “root new UI + backend old” |
| **B3 · Subdomain split** | `www` or `app` = new UI (Pages); `admin.ready…` or keep `ready…/backend` on October; booking handoff to live `/booking` | Yes via handoff | Simplest DNS; two hosts |
| **B4 · Apex → Pages only** | Point whole domain to GH Pages | **No** unless you also proxy booking | Breaks admin & live booking — avoid |

### Cloudflare Worker sketch (B2)

```text
readyrentacar.com.ar  →  Cloudflare
  /backend/*  /plugins/*  /modules/*  /booking/*  /storage/*
       →  origin 185.12.116.101 (October + AnyRent)
  everything else
       →  GitHub Pages (or another static host with our UI)
```

Search on the new UI keeps using **live handoff** (`POST` to `/en` on the October origin) or same-origin `/en` if you also proxy the October front booking routes.

### What to request from Jedeye / Towebs (in order)

1. Permission **Manage themes** / show **CMS → Themes**, **or**
2. SFTP/cPanel to `themes/` + how they set `cms.active_theme`, **or**
3. Approval to put the domain behind Cloudflare for path routing (B2), **or**
4. **API credentials + scopes** for Path L (long path / BFF) below

### NIC.ar

Useful for changing nameservers / records (e.g. to Cloudflare). **Not** sufficient by itself for `/` vs `/backend` split.

---

## Path L — long path: Cloud API + BFF (full custom UI)

Ready already has a **Jedeye cloud API tenant** separate from the October host:

| Piece | Where |
| --- | --- |
| Marketing + booking UI + staff admin | `readyrentacar.com.ar` (October self-hosted, PT hosting) |
| JSON API | `https://readyrac.api.anyrent.pt/v1` (AnyRent cloud, `x-api-cloud-node`) |

Auth: header **`X-Api-Key: <token>`** (Bearer does **not** work).

**Never put the API key in the browser or GitHub Pages.** Use a small BFF (Cloudflare Worker / Node on Ready’s host / serverless) that holds the key and exposes only safe public endpoints.

### Endpoints confirmed (read)

| Method | Path | Status with current key | Use for redesign |
| --- | --- | --- | --- |
| `GET` | `/stations` | ✅ 8 stations | Populate search selects (includes `el-chalten`) |
| `GET` | `/fleets` | ✅ 1 fleet, 6 groups | Category cards / SIPP codes |
| `GET` | `/vehicles` | ✅ 46 units | Inventory counts by `group_code` |
| `GET` | `/optionals` | ✅ extras + taxes + insurances | Chains, child seats, one-way taxes, CDW/PCDW |
| `GET` | **`/prices`** | ✅ **live quote** (this is the one from “Testear webservices”) | Step 2 of our funnel |
| `GET` | `/availability` | ⚠️ exists, rate-limited | Optional; `/prices` already returns `status: AVAILABLE` |
| `GET` | `/rates/search` | ❌ needs scope **`rates:read`** | Alternate/older path — prefer `/prices` |
| `GET` | `/bookings` | ✅ (ops data; 1000+ rows) | Admin/ops only — not for public UI |
| `GET` | `/customers` | ✅ | Admin/ops only — PII |
| `POST` | `/bookings` | ✅ endpoint accepts JSON | Create reservation after quote (need correct body + likely write scope) |

### `GET /prices` — request shape (from AnyRent tester)

```http
GET /v1/prices
  ?api_key=***          # or header X-Api-Key (prefer header in BFF)
  &lang=es
  &pickup_station=bariloche
  &dropoff_station=bariloche
  &pickup_date=20260801T100000Z   # format: Ymd\THis\Z  (NOT ISO with dashes)
  &dropoff_date=20260808T100000Z
  &rate=                          # optional rate group code; empty = default WEBSITE
  &voucher_code=
```

Auth works with **query `api_key`** (as in the tester) or **`X-Api-Key` header** (better for BFF — avoids keys in access logs).

Successful response (simplified):

```json
{
  "fleets": [{
    "code": "vehiculos",
    "groups": [{
      "code": "suvat",
      "name": "C SUV AT",
      "brand": "CHEVROLET",
      "model": "TRACKER",
      "status": "AVAILABLE",
      "rate": {
        "code": "WEBSITE",
        "rate_charge_type": "daily",
        "time_units": 7,
        "total_after_tax": 700000,
        "currency": "ARS",
        "tax_rate": 21,
        "excess_value": 1900000,
        "security_deposit_value": 600000,
        "insurances": [ /* CDW required, etc. */ ]
      },
      "optionals_rates": {
        "extras": { "1": { "code": "silla-nino", "price_after_tax": 9000, ... } },
        "taxes": { /* one-way fees when applicable */ },
        "insurances": { /* PCDW, SEGURO TOTAL upgrades */ }
      }
    }]
  }]
}
```

Example live totals (BRC→BRC, 7 days from 2026-08-01, ARS after tax):  
`suvat` 700k · `GFAM` 910k · `XXAR` 1.05M · `FQBD` 1.75M · `van` 1.96M  

Error `40` / “no groups/rates available” = criteria with no allotment/rate (dates too soon, station closed, or no rate calendar for that window) — not a bad endpoint.

### Where prices are configured in AnyRent UI (not on the car card)

You won’t see a “price” field on each vehicle plate. AnyRent prices **rate plans × fleet groups**, then `/prices` calculates for a trip.

Look under the top menu **ANYRENT** (not Contenido / Configuración), typically something like:

| Area (names vary ES/PT) | What it holds |
| --- | --- |
| **Tarifas / Rates / Rate groups** | Rate code e.g. `WEBSITE` — daily/weekly tables **per group** (`suvat`, `GFAM`, …) |
| **Temporadas / Seasons** | Date ranges that switch which rate row applies |
| **Grupos de flota / Fleet groups** | Category definition (Tracker, Cross…) — not the $ amount |
| **Vehículos** | Individual units / plates assigned to a group |
| **Extras / Optionals / Seguros** | `silla-nino`, `cadenas-de-nieve`, CDW/PCDW prices |
| **Taxes / One-way** | `bariloche-calafate`, airport fee, etc. |

So: **vehicle → belongs to group → group priced inside a rate (`WEBSITE`)**.  
If `/prices` returns empty for some dates, check that the `WEBSITE` rate has seasons/allotments covering those dates for Bariloche (and that the group is bookable online).

In “Testear webservices”, leave `rate=` empty unless you know another rate code; the API returned `rate.code: "WEBSITE"` when empty.

### Live catalog mapped to our mock

**Stations** (`code`): `bariloche`, `el-calafate`, `san-martin-de-los-andes`, `esquel`, `ushuaia`, `mendoza-aeropuerto`, `bariloche-aeropuerto`, `el-chalten`

**Fleet groups** (`code` → product):

| API `group_code` | Name / model | Our mock id |
| --- | --- | --- |
| `suvat` | C SUV AT · Tracker | `tracker` |
| `GFAM` | D SUV PREMIUN · Corolla Cross | `cross` |
| `XXAR` | E MINIVAN · Spin 7 | `spin` |
| `van` | G VAN · Hiace 9 | `hiace` |
| `FQBD` | I Doble Cabina AT 4x4 · Hilux | `hilux` |
| `OFBD` | F LUJO · SW4 | `sw4` |
| `PICKUPMT` | (present on vehicles, not in `/fleets` groups list) | `hiluxm` |

**Extras** (exactly the accessories we surfaced in the mock):

| API code | Name | Notes |
| --- | --- | --- |
| `silla-nino` | SILLA NIÑO | qty up to 2, charged per day |
| `silla-bebe` | SILLA BEBE | qty up to 2, charged per day |
| `cadenas-de-nieve` | CADENAS DE NIEVE | qty 1, not per-day flag |
| `fuera-de-horario` | FUERA DE HORARIO | after-hours fee |

**One-way / fees** appear under `optionals.taxes` (e.g. `bariloche-calafate`, `bariloche-ushuaia`, …) plus required `tasa-aeroportuaria`.

**Insurances:** `CDW` (required), `PCDW` (Premium / lower excess), `SEGURO TOTAL` (zero excess).

### What the current API key can do today

Enough to power a **full live quote UI** via BFF (no demo hardcoding for catalog or prices):

1. `GET /stations`, `/fleets`, `/optionals` → search + extras + insurance catalogs  
2. `GET /prices` → live group prices, deposits, excess, optional line prices  
3. Map `group.code` → our cards (`suvat`→Tracker, etc.)  
4. Still hand off to October `/booking` for payment **or** continue to `POST /bookings` once body/docs are confirmed  

Remaining gaps:

- Official `POST /bookings` body + payment URL / Mercado Pago flow  
- `/availability` rate limits (optional if `/prices` status is enough)  
- Prefer `X-Api-Key` header in BFF; avoid `api_key` in query strings (logs)  
- Rotate any key pasted in chat / tester URLs  

### Ask Jedeye for Path L

1. Confirm `POST /bookings` schema + how payment (MP/Stripe) is returned  
2. Docs for rate codes beyond `WEBSITE` (partners, corporate)  
3. Rotate API key; store only in BFF secrets  
4. Optional: allotment/season tips when `/prices` returns error `40`  
5. Theme/FTP access if we also want October front restyle (Plan B1)  

### Target architecture

```text
Browser (our UI on theme / Pages / Cloudflare)
        │  no API key
        ▼
BFF (Worker / Node)  ──X-Api-Key──►  readyrac.api.anyrent.pt/v1
        │                              stations, fleets, optionals,
        │                              rates/search, availability,
        │                              POST bookings
        ▼
Optional: still use October /backend for staff ops
```

### Suggested build order (long path)

1. **BFF skeleton** — proxy `GET /stations`, `/fleets`, `/optionals` (works with current key)  
2. Replace mock `data.js` catalogs with BFF responses  
3. Unlock **`rates:read`** → wire quote step 2 to live prices  
4. Wire extras/insurance selection to API codes (`silla-nino`, `cadenas-de-nieve`, `PCDW`, …)  
5. `POST /bookings` + payment handoff  
6. Deprecate demo rates and October search handoff for the public funnel  

Until steps 3–5 land, keep **Path A handoff** as production-safe fallback.
