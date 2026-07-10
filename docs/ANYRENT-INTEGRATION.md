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
