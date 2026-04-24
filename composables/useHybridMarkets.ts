import type { MaybeRefOrGetter } from 'vue'
import type { Currency, MarketCoin, PollingSpeed, PortfolioAsset } from '~/types'
import { mergeMarketsWithLivePrices } from '~/utils/binance'

export const useHybridMarkets = (
  assets: MaybeRefOrGetter<PortfolioAsset[]>,
  options: {
    currency?: MaybeRefOrGetter<Currency>
    speed?: PollingSpeed
  } = {}
) => {
  const currency = options.currency ?? 'usd'
  const speed = options.speed ?? 'medium'

  const { data: polledMarkets, pending, error, refresh } = useCoins(
    computed(() => toValue(assets).map((asset) => asset.id)),
    {
      currency,
      speed
    }
  )

  const live = useBinanceLivePrices(assets, { currency })

  const data = computed(() => mergeMarketsWithLivePrices(polledMarkets.value, live.snapshotsById.value))
  const marketsById = computed(
    () => Object.fromEntries(data.value.map((market) => [market.id, market])) as Record<string, MarketCoin>
  )

  const liveStatus = computed(() => ({
    activeStreams: live.activeStreams.value,
    enabled: live.enabled.value,
    error: live.error.value,
    liveAssets: live.liveAssets.value,
    state: live.status.value,
    totalAssets: toValue(assets).length
  }))

  return {
    data,
    error,
    liveStatus,
    marketsById,
    pending,
    refresh
  }
}
