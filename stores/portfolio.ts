import { defineStore } from 'pinia'
import type { AssetType, Currency, PortfolioAsset } from '~/types'

interface PortfolioState {
  assets: PortfolioAsset[]
  currency: Currency
}

type BaseNormalizedAsset = Omit<PortfolioAsset, 'type' | 'entry' | 'leverage'>
type AssetNormalizer = (asset: Partial<PortfolioAsset>, baseAsset: BaseNormalizedAsset) => PortfolioAsset

const storageKeys = {
  assets: 'portfolio',
  currency: 'portfolio:currency'
}

const defaultPurchaseDate = () => new Date().toISOString().slice(0, 10)

const normalizeCurrency = (value: unknown): Currency => (
  value === 'eur' || value === 'ngn' || value === 'usd'
    ? value
    : 'usd'
)

const toFiniteNumber = (value: unknown, fallback = 0) => (
  typeof value === 'number' && Number.isFinite(value)
    ? value
    : fallback
)

const toOptionalFiniteNumber = (value: unknown) => (
  typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined
)

const normalizeAssetType = (value: unknown): AssetType => (value === 'futures' ? 'futures' : 'spot')

const assetNormalizers: Record<AssetType, AssetNormalizer> = {
  spot: (_asset, baseAsset) => ({
    ...baseAsset,
    type: 'spot'
  }),
  futures: (asset, baseAsset) => ({
    ...baseAsset,
    type: 'futures',
    entry: toOptionalFiniteNumber(asset.entry),
    leverage: toOptionalFiniteNumber(asset.leverage)
  })
}

const normalizeAsset = (asset: Partial<PortfolioAsset>): PortfolioAsset | null => {
  const id = typeof asset.id === 'string' ? asset.id.trim() : ''
  const name = typeof asset.name === 'string' ? asset.name.trim() : ''
  const symbol = typeof asset.symbol === 'string' ? asset.symbol.trim().toUpperCase() : ''

  if (!id || !name || !symbol) {
    return null
  }

  const type = normalizeAssetType(asset.type)
  const baseAsset: BaseNormalizedAsset = {
    id,
    name,
    symbol,
    quantity: toFiniteNumber(asset.quantity),
    avgBuy: toFiniteNumber(asset.avgBuy),
    purchaseDate: typeof asset.purchaseDate === 'string' && asset.purchaseDate
      ? asset.purchaseDate
      : defaultPurchaseDate(),
    image: typeof asset.image === 'string' ? asset.image : undefined
  }

  return assetNormalizers[type](asset, baseAsset)
}

export const usePortfolioStore = defineStore('portfolio', {
  state: (): PortfolioState => ({
    assets: [],
    currency: 'usd'
  }),
  getters: {
    assetIds: (state) => state.assets.map((asset) => asset.id)
  },
  actions: {
    load() {
      if (!import.meta.client) {
        return
      }

      try {
        const assets = localStorage.getItem(storageKeys.assets)
        const currency = localStorage.getItem(storageKeys.currency)

        if (assets) {
          const parsedAssets = JSON.parse(assets)

          if (Array.isArray(parsedAssets)) {
            this.assets = parsedAssets
              .map((asset) => normalizeAsset(asset))
              .filter((asset): asset is PortfolioAsset => Boolean(asset))
          }
        }

        if (currency) {
          this.currency = normalizeCurrency(JSON.parse(currency))
        }
      } catch (error) {
        console.error('Failed to load portfolio from localStorage.', error)
      }
    },
    save() {
      if (!import.meta.client) {
        return
      }

      localStorage.setItem(storageKeys.assets, JSON.stringify(this.assets))
      localStorage.setItem(storageKeys.currency, JSON.stringify(this.currency))
    },
    saveAsset(asset: PortfolioAsset, originalId = asset.id) {
      const normalizedAsset = normalizeAsset(asset)

      if (!normalizedAsset) {
        return
      }

      const nextAssets: PortfolioAsset[] = []
      let inserted = false

      for (const existing of this.assets) {
        if (existing.id === originalId || existing.id === normalizedAsset.id) {
          if (!inserted) {
            nextAssets.push(normalizedAsset)
            inserted = true
          }

          continue
        }

        nextAssets.push(existing)
      }

      if (!inserted) {
        nextAssets.push(normalizedAsset)
      }

      this.assets = nextAssets
      this.save()
    },
    upsert(asset: PortfolioAsset) {
      this.saveAsset(asset)
    },
    add(asset: PortfolioAsset) {
      this.upsert(asset)
    },
    replace(originalId: string, asset: PortfolioAsset) {
      this.saveAsset(asset, originalId)
    },
    remove(id: string) {
      this.assets = this.assets.filter((asset) => asset.id !== id)
      this.save()
    },
    setCurrency(currency: Currency) {
      this.currency = currency
      this.save()
    },
    clear() {
      this.assets = []
      this.save()
    }
  }
})
