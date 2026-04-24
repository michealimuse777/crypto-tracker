import type { PollingSpeed } from '~/types'

const pollingStrategies: Record<PollingSpeed, number> = {
  fast: 60_000,
  medium: 90_000,
  slow: 120_000
}

export const usePolling = (fn: () => Promise<void> | void, speed: PollingSpeed = 'medium') => {
  let intervalId: ReturnType<typeof setInterval> | null = null

  onMounted(() => {
    void fn()
    intervalId = setInterval(() => {
      void fn()
    }, pollingStrategies[speed])
  })

  onBeforeUnmount(() => {
    if (intervalId) {
      clearInterval(intervalId)
    }
  })
}
