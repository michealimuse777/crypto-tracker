import type { PnlResult, PortfolioAsset } from '~/types'

type PnlStrategy = (asset: PortfolioAsset, price: number) => PnlResult

const safePercent = (numerator: number, denominator: number) => {
  if (!denominator) {
    return 0
  }

  return (numerator / denominator) * 100
}

const strategies: Record<PortfolioAsset['type'], PnlStrategy> = {
  spot: (asset, price) => {
    const currentValue = asset.quantity * price
    const costBasis = asset.quantity * asset.avgBuy
    const pnl = currentValue - costBasis

    return {
      currentValue,
      costBasis,
      pnl,
      pnlPercent: safePercent(pnl, costBasis)
    }
  },
  futures: (asset, price) => {
    const entry = asset.entry ?? asset.avgBuy
    const leverage = asset.leverage ?? 1
    const currentValue = asset.quantity * price
    const costBasis = asset.quantity * entry
    const pnl = (price - entry) * asset.quantity * leverage

    return {
      currentValue,
      costBasis,
      pnl,
      pnlPercent: safePercent(pnl, costBasis)
    }
  }
}

export const calculatePnL = (asset: PortfolioAsset, price: number) =>
  (strategies[asset.type] ?? strategies.spot)(asset, price)
