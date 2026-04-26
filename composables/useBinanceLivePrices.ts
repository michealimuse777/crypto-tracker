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
type TransportStrategy = {
  createSocketUrl: (groups: BinanceStreamGroup[], directBinanceBase: string) => string
  errorMessage: string
}
type ServerMessageHandlers = {
  [K in BinanceServerMessage['type']]: (
    payload: Extract<BinanceServerMessage, { type: K }>,
    groups: BinanceStreamGroup[]
  ) => void
}

const reconnectDelayMs = 3_000
const bridgeHosts = new Set(['localhost', '127.0.0.1'])
const fallbackDirectBinanceBases = [
  'wss://stream.binance.com:443',
  'wss://stream.binance.com:9443',
  'wss://data-stream.binance.vision'
]

const transportStrategies: Record<ConnectionTransport, TransportStrategy> = {
  bridge: {
    createSocketUrl: (groups) => {
      const url = new URL('/ws/binance', window.location.origin)
      url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
      url.searchParams.set('streams', groups.map((group) => group.stream).join(','))
      return String(url)
    },
    errorMessage: 'Binance live price bridge connection failed.'
  },
  direct: {
    createSocketUrl: (groups, directBinanceBase) =>
      `${directBinanceBase}/stream?streams=${groups.map((group) => group.stream).join('/')}`,
    errorMessage: 'Binance live price connection failed.'
  }
}

const parseServerMessage = (payload: string) => {
  try {
    const parsed = JSON.parse(payload) as {
      data?: unknown
      type?: unknown
    }

    if (
      (parsed.type !== 'ticker' && parsed.type !== 'status' && parsed.type !== 'error')
      || typeof parsed.data !== 'object'
      || parsed.data === null
    ) {
      return null
    }

    return parsed as BinanceServerMessage
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
  const directBinanceBases = computed(() => {
    const configuredBase = typeof config.public.binanceWsBase === 'string'
      ? config.public.binanceWsBase.trim()
      : ''

    return [...new Set([
      configuredBase,
      ...fallbackDirectBinanceBases
    ].filter(Boolean))]
  })

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

    return bridgeHosts.has(window.location.hostname) ? 'bridge' : 'direct'
  }

  const serverMessageHandlers: ServerMessageHandlers = {
    ticker: (payload, groups) => {
      applyTickerUpdate(groups, payload.data)
    },
    status: (payload) => {
      status.value = payload.data.state
    },
    error: (payload) => {
      error.value = new Error(payload.data.message)
      status.value = 'error'
    }
  }

  const handleServerMessage = (payload: BinanceServerMessage, groups: BinanceStreamGroup[]) => {
    const handler = serverMessageHandlers[payload.type] as (
      message: BinanceServerMessage,
      streamGroups: BinanceStreamGroup[]
    ) => void

    handler(payload, groups)
  }

  const connectSocket = (
    version: number,
    groups: BinanceStreamGroup[],
    transport: ConnectionTransport,
    directBaseIndex = 0
  ) => {
    const transportStrategy = transportStrategies[transport]
    const directBase = transport === 'direct'
      ? directBinanceBases.value[directBaseIndex] ?? fallbackDirectBinanceBases[0]
      : ''
    const nextSocket = new WebSocket(transportStrategy.createSocketUrl(groups, directBase))
    let opened = false

    socket.value = nextSocket

    const moveToNextDirectBase = () => {
      if (transport !== 'direct') {
        return false
      }

      const nextBaseIndex = directBaseIndex + 1

      if (nextBaseIndex >= directBinanceBases.value.length) {
        return false
      }

      if (connectionVersion.value !== version || socket.value !== nextSocket) {
        return true
      }

      socket.value = null

      if (nextSocket.readyState === WebSocket.OPEN || nextSocket.readyState === WebSocket.CONNECTING) {
        nextSocket.close(1000, 'Trying fallback Binance endpoint')
      }

      status.value = 'connecting'
      connectSocket(version, groups, transport, nextBaseIndex)
      return true
    }

    nextSocket.addEventListener('open', () => {
      if (connectionVersion.value !== version || socket.value !== nextSocket) {
        return
      }

      opened = true
      status.value = 'open'
    })

    nextSocket.addEventListener('message', (event) => {
      if (connectionVersion.value !== version || socket.value !== nextSocket || typeof event.data !== 'string') {
        return
      }

      const payload = parseServerMessage(event.data)

      if (payload) {
        handleServerMessage(payload, groups)
        return
      }

      const directSnapshot = parseBinanceCombinedStreamMessage(event.data)

      if (!directSnapshot) {
        return
      }

      applyTickerUpdate(groups, directSnapshot)
    })

    nextSocket.addEventListener('error', () => {
      if (connectionVersion.value !== version || socket.value !== nextSocket) {
        return
      }

      if (moveToNextDirectBase()) {
        return
      }

      error.value = new Error(transportStrategy.errorMessage)
      status.value = 'error'
    })

    nextSocket.addEventListener('close', () => {
      if (connectionVersion.value !== version || socket.value !== nextSocket) {
        return
      }

      socket.value = null

      if (!opened && moveToNextDirectBase()) {
        return
      }

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
    connectSocket(version, groups, transport)
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
