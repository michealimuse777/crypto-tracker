# Crypto Tracker

Crypto Tracker is a Nuxt 3 portfolio dashboard for manually tracked crypto holdings. It combines cached CoinGecko market data with a Binance WebSocket overlay for faster USD price updates, while keeping portfolio state local in the browser.

## Features

- Portfolio dashboard with total value, 24h move, total PnL, allocation, and top gainers/losers
- Manual asset management with add, delete, and same-coin replace behavior
- Coin search backed by server-side CoinGecko routes
- Responsive holdings table with mobile card layout and mobile currency switching in the top bar
- Coin detail page with market stats, 30 day history, and user-specific holding PnL
- LocalStorage persistence for holdings and selected currency
- Server-side caching to reduce CoinGecko traffic
- Binance live overlay for supported USD assets

## Stack

- Nuxt 3
- Pinia
- Tailwind CSS
- Chart.js and vue-chartjs
- Nitro server routes and WebSockets

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Copy the example environment file and adjust values if needed:

```bash
cp .env.example .env
```

3. Start the dev server:

```bash
npm run dev
```

4. Run type checks before shipping changes:

```bash
npm run typecheck
```

## Environment

`env.example` includes the supported runtime variables:

```env
COINGECKO_BASE=https://api.coingecko.com/api/v3
COINGECKO_DEMO_KEY=
COINGECKO_PRO_KEY=
BINANCE_WS_BASE=wss://data-stream.binance.vision
NUXT_PUBLIC_DEFAULT_CURRENCY=usd
NUXT_PUBLIC_DEFAULT_POLL_SPEED=medium
```

Notes:

- Restart Nuxt after editing `.env`.
- `BINANCE_WS_BASE` should remain `wss://data-stream.binance.vision` unless the live provider is intentionally changed.
- Live Binance overlay is currently USD-only.

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run typecheck
```

## Architecture Overview

### Client state

- Portfolio state lives in `stores/portfolio.ts`
- Holdings and selected currency are persisted in `localStorage`
- `composables/usePortfolio.ts` is the main interface used by pages and components

### Server API layer

All CoinGecko access goes through Nuxt server routes. Components do not call CoinGecko directly.

- `GET /api/coins/search`
- `GET /api/coins/markets`
- `GET /api/coins/:id`
- `GET /api/coins/:id/history`

### Data flow

1. Portfolio holdings are stored in Pinia and persisted locally.
2. `useHybridMarkets` polls cached CoinGecko market routes every 60 to 120 seconds.
3. `useBinanceLivePrices` opens grouped Binance ticker streams for supported USD assets.
4. Binance ticker snapshots patch live price fields on top of the CoinGecko market snapshot.
5. Pages render KPI summaries, charts, tables, and coin detail views from the merged market data.

## Caching

Server-side cache durations currently follow the project brief:

- Search results: 10 minutes
- Market prices: 120 seconds
- Coin details: 30 minutes
- Historical data: 60 minutes

## Project Structure

```text
crypto-tracker/
  assets/
  components/
    charts/
    portfolio/
    ui/
  composables/
  layouts/
  pages/
  server/
    api/coins/
    utils/
  stores/
  types/
  utils/
```

## API Notes

- CoinGecko is the source of truth for search, market snapshots, coin detail data, and price history.
- Binance only overrides live market fields such as current price and related 24h ticker values for supported USD assets.
- If a coin does not map cleanly to a Binance `USDT` symbol, it falls back to CoinGecko polling only.

## Verification

The current workspace has been verified with:

- `npm run typecheck`
- `npm run build`

## Future Improvements

- Stronger Binance symbol mapping for edge-case assets
- Better futures-specific entry and leverage controls
- Broader live support for non-USD currencies
- Automated test coverage for portfolio calculations and save/replace flows
