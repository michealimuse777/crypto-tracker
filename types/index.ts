export type Currency = 'usd' | 'ngn' | 'eur'
export type PollingSpeed = 'fast' | 'medium' | 'slow'
export type AssetType = 'spot' | 'futures'

export interface PortfolioAsset {
  id: string
  name: string
  symbol: string
  quantity: number
  avgBuy: number
  purchaseDate?: string
  type: AssetType
  image?: string
  entry?: number
  leverage?: number
}

export interface CoinSearchResult {
  id: string
  name: string
  symbol: string
  api_symbol?: string
  market_cap_rank?: number | null
  current_price?: number | null
  thumb?: string
  large?: string
}

export interface CoinSearchResponse {
  coins: CoinSearchResult[]
  exchanges: unknown[]
  icos: unknown[]
  categories: unknown[]
  nfts: unknown[]
}

export interface MarketCoin {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  market_cap: number
  total_volume: number
  market_cap_rank: number | null
  price_change_percentage_24h: number | null
  high_24h: number | null
  low_24h: number | null
  sparkline_in_7d?: {
    price: number[]
  }
}

export interface CoinDetail {
  id: string
  symbol: string
  name: string
  hashing_algorithm?: string | null
  market_cap_rank?: number | null
  description?: {
    en?: string
  }
  image?: {
    thumb?: string
    small?: string
    large?: string
  }
  market_data?: {
    current_price?: Record<string, number>
    market_cap?: Record<string, number>
    total_volume?: Record<string, number>
    high_24h?: Record<string, number>
    low_24h?: Record<string, number>
    price_change_percentage_24h?: number | null
  }
}

export interface CoinHistoryResponse {
  prices: [number, number][]
  market_caps: [number, number][]
  total_volumes: [number, number][]
}

export interface PnlResult {
  currentValue: number
  costBasis: number
  pnl: number
  pnlPercent: number
}

export interface PortfolioRow extends PortfolioAsset {
  currentPrice: number
  holdingsValue: number
  costBasis: number
  pnl: number
  pnlPercent: number
  dailyChangeValue: number
  dailyChangePercent: number
  market?: MarketCoin
}

export interface ChartPoint {
  label: string
  value: number
}
