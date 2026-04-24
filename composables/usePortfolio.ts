import { storeToRefs } from 'pinia'
import type { PortfolioAsset } from '~/types'

export const usePortfolio = () => {
  const store = usePortfolioStore()
  const { assets, currency } = storeToRefs(store)
  const hydrated = useState('portfolio:hydrated', () => false)

  if (import.meta.client && !hydrated.value) {
    store.load()
    hydrated.value = true
  }

  const addAsset = (asset: PortfolioAsset) => store.upsert(asset)
  const saveAsset = (asset: PortfolioAsset, originalId?: string) =>
    originalId ? store.replace(originalId, asset) : store.saveAsset(asset)
  const removeAsset = (id: string) => store.remove(id)
  const setCurrency = (value: typeof currency.value) => store.setCurrency(value)

  return {
    store,
    assets,
    currency,
    addAsset,
    saveAsset,
    removeAsset,
    setCurrency,
    clearPortfolio: store.clear
  }
}
