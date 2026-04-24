import type { ChartPoint, CoinHistoryResponse, MarketCoin, PortfolioAsset, PortfolioRow } from '~/types'
import { calculatePnL } from '~/utils/pnlStrategies'

export const mapMarketsById = (markets: MarketCoin[] = []) =>
  Object.fromEntries(markets.map((market) => [market.id, market])) as Record<string, MarketCoin>

const getPreviousValueFromDailyChange = (currentValue: number, dailyChangePercent: number) => {
  if (!Number.isFinite(currentValue) || !Number.isFinite(dailyChangePercent)) {
    return currentValue
  }

  const changeRatio = 1 + dailyChangePercent / 100

  if (changeRatio <= 0) {
    return 0
  }

  return currentValue / changeRatio
}

export const calculateDailyChangeValue = (currentValue: number, dailyChangePercent: number) => {
  const previousValue = getPreviousValueFromDailyChange(currentValue, dailyChangePercent)
  return currentValue - previousValue
}

export const buildPortfolioRows = (assets: PortfolioAsset[] = [], markets: MarketCoin[] = []) => {
  const marketMap = mapMarketsById(markets)

  return assets.map<PortfolioRow>((asset) => {
    const market = marketMap[asset.id]
    const currentPrice = market?.current_price ?? 0
    const pnl = calculatePnL(asset, currentPrice)
    const dailyChangePercent = market?.price_change_percentage_24h ?? 0
    const dailyChangeValue = calculateDailyChangeValue(pnl.currentValue, dailyChangePercent)

    return {
      ...asset,
      currentPrice,
      holdingsValue: pnl.currentValue,
      costBasis: pnl.costBasis,
      pnl: pnl.pnl,
      pnlPercent: pnl.pnlPercent,
      dailyChangeValue,
      dailyChangePercent,
      market
    }
  })
}

export const summarizePortfolio = (rows: PortfolioRow[] = []) => {
  const totals = rows.reduce(
    (summary, row) => {
      const previousValue = Math.max(row.holdingsValue - row.dailyChangeValue, 0)

      return {
        totalValue: summary.totalValue + row.holdingsValue,
        totalCostBasis: summary.totalCostBasis + row.costBasis,
        totalPreviousValue: summary.totalPreviousValue + previousValue,
        dailyChangeValue: summary.dailyChangeValue + row.dailyChangeValue
      }
    },
    {
      totalValue: 0,
      totalCostBasis: 0,
      totalPreviousValue: 0,
      dailyChangeValue: 0
    }
  )

  const totalPnl = totals.totalValue - totals.totalCostBasis
  const totalPnlPercent = totals.totalCostBasis ? (totalPnl / totals.totalCostBasis) * 100 : 0
  const dailyChangePercent = totals.totalPreviousValue
    ? (totals.dailyChangeValue / totals.totalPreviousValue) * 100
    : 0

  return {
    ...totals,
    totalPnl,
    totalPnlPercent,
    dailyChangePercent
  }
}

export const buildPortfolioTrend = (rows: PortfolioRow[] = []): ChartPoint[] => {
  const longestSeries = rows.reduce(
    (longest, row) => Math.max(longest, row.market?.sparkline_in_7d?.price.length ?? 0),
    0
  )

  if (!longestSeries) {
    return rows.map((row) => ({
      label: row.symbol.toUpperCase(),
      value: row.holdingsValue
    }))
  }

  return Array.from({ length: longestSeries }, (_, index) => {
    const daysBack = longestSeries - index - 1
    const label = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric'
      }
    )

    const value = rows.reduce((total, row) => {
      const sampledPrice = row.market?.sparkline_in_7d?.price[index] ?? row.currentPrice
      return total + sampledPrice * row.quantity
    }, 0)

    return {
      label,
      value
    }
  })
}

export const buildHistoryPoints = (history?: CoinHistoryResponse | null): ChartPoint[] =>
  history?.prices.map(([timestamp, price]) => ({
    label: new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    }),
    value: price
  })) ?? []
