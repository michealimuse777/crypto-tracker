import type { Currency, MarketCoin, PortfolioAsset } from '~/types'

export type LiveConnectionState = 'idle' | 'connecting' | 'reconnecting' | 'open' | 'closed' | 'error'

export interface BinanceTickerSnapshot {
  stream: string
  symbol: string
  currentPrice: number
  high24h: number | null
  low24h: number | null
  priceChangePercent24h: number | null
  eventTime: number
}

export interface BinanceStreamGroup {
  assetIds: string[]
  stream: string
  symbol: string
}

const binanceBaseOverrides: Record<string, string> = {
  'bitcoin-cash': 'BCH',
  'internet-computer': 'ICP',
  'render-token': 'RENDER',
  'the-open-network': 'TON',
  'wrapped-bitcoin': 'WBTC'
}

const sanitizeBinanceBase = (value: string) => value.replace(/[^a-z0-9]/gi, '').toUpperCase()

const resolveBinanceBase = (asset: Pick<PortfolioAsset, 'id' | 'symbol'>) => {
  const candidate = binanceBaseOverrides[asset.id] || asset.symbol
  const normalized = sanitizeBinanceBase(candidate)

  return normalized || null
}

export const isBinanceLiveCurrency = (currency: Currency) => currency === 'usd'

export const buildBinanceStreamGroups = (assets: PortfolioAsset[] = []): BinanceStreamGroup[] => {
  const groups = new Map<string, BinanceStreamGroup>()

  for (const asset of assets) {
    const base = resolveBinanceBase(asset)

    if (!base) {
      continue
    }

    const symbol = `${base}USDT`
    const stream = `${symbol.toLowerCase()}@ticker`
    const existing = groups.get(stream)

    if (existing) {
      if (!existing.assetIds.includes(asset.id)) {
        existing.assetIds.push(asset.id)
      }

      continue
    }

    groups.set(stream, {
      assetIds: [asset.id],
      stream,
      symbol
    })
  }

  return [...groups.values()].sort((left, right) => left.stream.localeCompare(right.stream))
}

export const parseBinanceCombinedStreamMessage = (payload: string): BinanceTickerSnapshot | null => {
  try {
    const parsed = JSON.parse(payload) as {
      data?: Record<string, unknown>
      stream?: string
    }

    if (!parsed.stream || !parsed.data) {
      return null
    }

    return {
      currentPrice: Number(parsed.data.c ?? 0),
      eventTime: Number(parsed.data.E ?? Date.now()),
      high24h: parsed.data.h ? Number(parsed.data.h) : null,
      low24h: parsed.data.l ? Number(parsed.data.l) : null,
      priceChangePercent24h: parsed.data.P ? Number(parsed.data.P) : null,
      stream: parsed.stream,
      symbol: String(parsed.data.s ?? '')
    }
  } catch {
    return null
  }
}

export const mergeMarketsWithLivePrices = (
  markets: MarketCoin[] = [],
  snapshotsById: Record<string, BinanceTickerSnapshot> = {}
) =>
  markets.map((market) => {
    const snapshot = snapshotsById[market.id]

    if (!snapshot) {
      return market
    }

    return {
      ...market,
      current_price: snapshot.currentPrice,
      high_24h: snapshot.high24h ?? market.high_24h,
      low_24h: snapshot.low24h ?? market.low_24h,
      price_change_percentage_24h: snapshot.priceChangePercent24h ?? market.price_change_percentage_24h
    }
  })
