import type { MaybeRefOrGetter } from 'vue'
import type { Currency, MarketCoin, PollingSpeed } from '~/types'

const retryDelayMs = 5_000

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
  let retryTimer: ReturnType<typeof setTimeout> | null = null

  const clearRetryTimer = () => {
    if (retryTimer) {
      clearTimeout(retryTimer)
      retryTimer = null
    }
  }

  const fetchPrices = async () => {
    const currentIds = [...new Set(toValue(ids).filter(Boolean))]

    if (!currentIds.length) {
      clearRetryTimer()
      data.value = []
      error.value = null
      return
    }

    clearRetryTimer()
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

      if (import.meta.client && !retryTimer) {
        retryTimer = setTimeout(() => {
          retryTimer = null
          void fetchPrices()
        }, retryDelayMs)
      }
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

  onBeforeUnmount(() => {
    clearRetryTimer()
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
