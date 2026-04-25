import type { MaybeRefOrGetter } from 'vue'
import type { Currency, PortfolioAsset } from '~/types'
import {
  type BinanceStreamGroup,
  type BinanceTickerSnapshot,
  type LiveConnectionState,
  buildBinanceStreamGroups,
  isBinanceLiveCurrency,
  parseBinanceCombinedStreamMessage
} from '~/utils/binance'

interface BinanceStatusMessage {
  type: 'status'
  data: {
    state: LiveConnectionState
    streams: string[]
  }
}

interface BinanceErrorMessage {
  type: 'error'
  data: {
    message: string
  }
}

interface BinanceTickerMessage {
  type: 'ticker'
  data: BinanceTickerSnapshot
}

type BinanceServerMessage = BinanceStatusMessage | BinanceErrorMessage | BinanceTickerMessage
type ConnectionTransport = 'bridge' | 'direct'

const reconnectDelayMs = 3_000

const parseServerMessage = (payload: string) => {
  try {
    return JSON.parse(payload) as BinanceServerMessage
  } catch {
    return null
  }
}

export const useBinanceLivePrices = (
  assets: MaybeRefOrGetter<PortfolioAsset[]>,
  options: {
    currency?: MaybeRefOrGetter<Currency>
  } = {}
) => {
  const currency = options.currency ?? 'usd'
  const config = useRuntimeConfig()
  const snapshotsById = ref<Record<string, BinanceTickerSnapshot>>({})
  const status = ref<LiveConnectionState>('idle')
  const error = ref<Error | null>(null)
  const socket = shallowRef<WebSocket | null>(null)
  const connectionVersion = ref(0)
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null

  const enabled = computed(() => isBinanceLiveCurrency(toValue(currency)))
  const streamGroups = computed(() => (enabled.value ? buildBinanceStreamGroups(toValue(assets)) : []))
  const streamSignature = computed(() => streamGroups.value.map((group) => group.stream).join(','))
  const activeStreams = computed(() => streamGroups.value.length)
  const liveAssets = computed(() => Object.keys(snapshotsById.value).length)
  const directBinanceBase = computed(() => config.public.binanceWsBase || 'wss://data-stream.binance.vision')

  const clearReconnectTimer = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  const closeSocket = (code = 1000, reason = 'Normal closure') => {
    clearReconnectTimer()

    if (!socket.value) {
      return
    }

    const currentSocket = socket.value
    socket.value = null

    if (currentSocket.readyState === WebSocket.OPEN || currentSocket.readyState === WebSocket.CONNECTING) {
      currentSocket.close(code, reason)
    }
  }

  const applyTickerUpdate = (groups: BinanceStreamGroup[], snapshot: BinanceTickerSnapshot) => {
    const matched = groups.find((group) => group.stream === snapshot.stream)

    if (!matched) {
      return
    }

    snapshotsById.value = matched.assetIds.reduce<Record<string, BinanceTickerSnapshot>>(
      (next, assetId) => {
        next[assetId] = snapshot
        return next
      },
      {
        ...snapshotsById.value
      }
    )
  }

  const scheduleReconnect = () => {
    if (reconnectTimer || !activeStreams.value) {
      return
    }

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      void connect()
    }, reconnectDelayMs)
  }

  const resolveTransport = (): ConnectionTransport => {
    if (import.meta.server) {
      return 'bridge'
    }

    const hostname = window.location.hostname

    return hostname === 'localhost' || hostname === '127.0.0.1'
      ? 'bridge'
      : 'direct'
  }

  const createSocketUrl = (transport: ConnectionTransport, groups: BinanceStreamGroup[]) => {
    if (transport === 'direct') {
      return `${directBinanceBase.value}/stream?streams=${groups.map((group) => group.stream).join('/')}`
    }

    const url = new URL('/ws/binance', window.location.origin)
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    url.searchParams.set('streams', groups.map((group) => group.stream).join(','))
    return String(url)
  }

  const connect = async () => {
    if (import.meta.server) {
      return
    }

    const groups = streamGroups.value

    if (!groups.length) {
      closeSocket(1000, 'Binance live overlay disabled')
      snapshotsById.value = {}
      status.value = 'idle'
      error.value = null
      return
    }

    const version = ++connectionVersion.value

    closeSocket(1000, 'Refreshing live streams')
    error.value = null
    status.value = 'connecting'
    const transport = resolveTransport()
    const nextSocket = new WebSocket(createSocketUrl(transport, groups))
    socket.value = nextSocket

    nextSocket.addEventListener('open', () => {
      if (connectionVersion.value !== version) {
        return
      }

      status.value = 'open'
    })

    nextSocket.addEventListener('message', (event) => {
      if (connectionVersion.value !== version || typeof event.data !== 'string') {
        return
      }

      const payload = parseServerMessage(event.data)

      if (payload?.type === 'ticker') {
        applyTickerUpdate(groups, payload.data)
        return
      }

      if (payload?.type === 'status') {
        status.value = payload.data.state
        return
      }

      if (payload?.type === 'error') {
        error.value = new Error(payload.data.message)
        status.value = 'error'
        return
      }

      const directSnapshot = parseBinanceCombinedStreamMessage(event.data)

      if (!directSnapshot) {
        return
      }

      applyTickerUpdate(groups, directSnapshot)
    })

    nextSocket.addEventListener('error', () => {
      if (connectionVersion.value !== version) {
        return
      }

      error.value = new Error(
        transport === 'bridge'
          ? 'Binance live price bridge connection failed.'
          : 'Binance live price connection failed.'
      )
      status.value = 'error'
    })

    nextSocket.addEventListener('close', () => {
      if (connectionVersion.value !== version) {
        return
      }

      socket.value = null

      if (!streamGroups.value.length) {
        status.value = 'idle'
        return
      }

      if (status.value !== 'error') {
        status.value = 'closed'
      }

      scheduleReconnect()
    })
  }

  watch(
    streamSignature,
    () => {
      snapshotsById.value = {}
      void connect()
    },
    { immediate: true }
  )

  onBeforeUnmount(() => {
    connectionVersion.value += 1
    closeSocket(1000, 'Binance live overlay disposed')
  })

  return {
    activeStreams,
    enabled,
    error,
    liveAssets,
    reconnect: connect,
    snapshotsById,
    status
  }
}
