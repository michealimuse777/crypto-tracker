import type { MaybeRefOrGetter } from 'vue'
import type { Currency, MarketCoin, PollingSpeed } from '~/types'

export const useCoins = (
  ids: MaybeRefOrGetter<string[]>,
  options: {
    currency?: MaybeRefOrGetter<Currency>
    speed?: PollingSpeed
  } = {}
) => {
  const data = ref<MarketCoin[]>([])
  const pending = ref(false)
  const error = ref<Error | null>(null)
  const currency = options.currency ?? 'usd'
  const speed = options.speed ?? 'medium'

  const fetchPrices = async () => {
    const currentIds = [...new Set(toValue(ids).filter(Boolean))]

    if (!currentIds.length) {
      data.value = []
      return
    }

    pending.value = true

    try {
      data.value = await $fetch<MarketCoin[]>('/api/coins/markets', {
        params: {
          ids: currentIds.join(','),
          currency: toValue(currency)
        }
      })
      error.value = null
    } catch (caughtError) {
      error.value = caughtError as Error
    } finally {
      pending.value = false
    }
  }

  if (import.meta.client) {
    usePolling(fetchPrices, speed)
  }

  watch([() => toValue(ids).join(','), () => toValue(currency)], () => {
    void fetchPrices()
  })

  return {
    data,
    pending,
    error,
    refresh: fetchPrices,
    marketsById: computed(
      () => Object.fromEntries(data.value.map((market) => [market.id, market])) as Record<string, MarketCoin>
    )
  }
}
