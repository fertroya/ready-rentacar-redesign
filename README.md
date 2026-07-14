# Ready Rent-a-Car — redesign mocks

Navigable GitHub Pages prototypes for a Patagonia-first renewal of [readyrentacar.com.ar](https://www.readyrentacar.com.ar/en).

## Start here

- **[Merged full site (recommended)](./merged/)** — A+B hybrid, multi-page, EN/ES/PT, online quote
- [Direction A — Patagonia Editorial](./a-patagonia/) — atmosphere exploration
- [Direction B — Booking Precision](./b-precision/) — funnel exploration

## Merged site map

| Page | Purpose |
|------|---------|
| Home | Brand hero + search with **one-way fee on home** + winter banner |
| Fleet | Trip-fit filters · NEW / corporate badges |
| Stations | Airport hubs + nationwide return policy |
| Routes | Lakes · Bariloche→Calafate · Winter · Ushuaia |
| Why Ready | Personalization + roadside vs low-price desks |
| Corporate | Newer SUV/pickup/SW4 pitch |
| Quote | 5-step quote (trip → vehicle → extras → details → pay) + live AnyRent handoff |
| Extras / Promos | Accessories catalog + campaigns |
| FAQ / Contact | Policy + WhatsApp / Mercado Pago / AnyRent / Orillas |

## Backend (Jedeye / AnyRent)

See **[docs/ANYRENT-INTEGRATION.md](./docs/ANYRENT-INTEGRATION.md)**.

- Default prototype mode: **DEMO** (local indicative rates)
- Footer toggle **Engine: LIVE** (or `?engine=live`) hands search off to the public booking engine on `readyrentacar.com.ar`
- Admin credentials must **never** go in the frontend

## BFF (read-only quote)

Cloudflare Worker under **[`bff/`](./bff/)** proxies `stations` / `fleets` / `optionals` / `prices`.

Live: https://ready-rentacar-bff.ready-rentacar-ft.workers.dev  

Mock default engine = **BFF** (live prices, no bookings/payments). Footer toggles BFF ↔ DEMO. Docs: **[docs/BFF.md](./docs/BFF.md)**.

```bash
cd bff && npm install && cp .dev.vars.example .dev.vars
# set ANYRENT_API_KEY, then:
npm run dev   # Wrangler = Cloudflare Workers CLI
npm run ci    # typecheck + tests
```

GitHub Actions: **BFF CI** / **BFF Deploy** (Wrangler) + **Site CI** for `merged/`. Docs: [docs/BFF.md](./docs/BFF.md).

Logo retained from Ready.
