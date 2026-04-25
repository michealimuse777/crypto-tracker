import type { Peer } from 'crossws'
import { parseBinanceCombinedStreamMessage, type BinanceTickerSnapshot, type LiveConnectionState } from '~/utils/binance'

interface PeerContext {
  namespaceKey: string
  streams: string[]
}

interface UpstreamConnection {
  disposed: boolean
  namespaceKey: string
  peers: Set<Peer>
  reconnectTimer: ReturnType<typeof setTimeout> | null
  socket: WebSocket | null
  state: LiveConnectionState
  streams: string[]
}

type BinanceServerMessage =
  | {
      type: 'status'
      data: {
        state: LiveConnectionState
        streams: string[]
      }
    }
  | {
      type: 'error'
      data: {
        message: string
      }
    }
  | {
      type: 'ticker'
      data: BinanceTickerSnapshot
    }

const reconnectDelayMs = 3_000
const streamPattern = /^[a-z0-9]+@ticker$/
const upstreamConnections = new Map<string, UpstreamConnection>()

const getBinanceWsBase = () => process.env.BINANCE_WS_BASE || 'wss://data-stream.binance.vision'

const serializeMessage = (payload: BinanceServerMessage) => JSON.stringify(payload)

const sendToPeers = (connection: UpstreamConnection, payload: BinanceServerMessage) => {
  const message = serializeMessage(payload)

  for (const peer of connection.peers) {
    peer.send(message)
  }
}

const parseRequestedStreams = (request: { url: string }) => {
  const url = new URL(request.url)
  const rawValue = url.searchParams.get('streams') || ''

  return [...new Set(rawValue
    .split(',')
    .flatMap((value) => value.split('/'))
    .map((value) => value.trim().toLowerCase())
    .filter((value) => streamPattern.test(value)))].sort()
}

const closeUpstreamConnection = (connection: UpstreamConnection) => {
  connection.disposed = true

  if (connection.reconnectTimer) {
    clearTimeout(connection.reconnectTimer)
    connection.reconnectTimer = null
  }

  if (connection.socket) {
    const currentSocket = connection.socket
    connection.socket = null

    if (currentSocket.readyState === WebSocket.OPEN || currentSocket.readyState === WebSocket.CONNECTING) {
      currentSocket.close(1000, 'No active peers')
    }
  }

  connection.peers.clear()
  upstreamConnections.delete(connection.namespaceKey)
}

const scheduleReconnect = (connection: UpstreamConnection) => {
  if (connection.reconnectTimer || connection.disposed || !connection.peers.size) {
    return
  }

  connection.state = 'reconnecting'
  sendToPeers(connection, {
    type: 'status',
    data: {
      state: connection.state,
      streams: connection.streams
    }
  })

  connection.reconnectTimer = setTimeout(() => {
    connection.reconnectTimer = null
    connectUpstream(connection)
  }, reconnectDelayMs)
}

const connectUpstream = (connection: UpstreamConnection) => {
  if (connection.disposed || !connection.streams.length || !connection.peers.size) {
    return
  }

  if (connection.socket) {
    const existingSocket = connection.socket
    connection.socket = null

    if (existingSocket.readyState === WebSocket.OPEN || existingSocket.readyState === WebSocket.CONNECTING) {
      existingSocket.close(1000, 'Refreshing Binance upstream')
    }
  }

  connection.state = connection.state === 'reconnecting' ? 'reconnecting' : 'connecting'
  sendToPeers(connection, {
    type: 'status',
    data: {
      state: connection.state,
      streams: connection.streams
    }
  })

  const upstreamUrl = `${getBinanceWsBase()}/stream?streams=${connection.streams.join('/')}`
  const upstreamSocket = new WebSocket(upstreamUrl)
  connection.socket = upstreamSocket

  upstreamSocket.addEventListener('open', () => {
    if (connection.socket !== upstreamSocket) {
      return
    }

    connection.state = 'open'
    sendToPeers(connection, {
      type: 'status',
      data: {
        state: connection.state,
        streams: connection.streams
      }
    })
  })

  upstreamSocket.addEventListener('message', (event) => {
    if (connection.socket !== upstreamSocket || typeof event.data !== 'string') {
      return
    }

    const snapshot = parseBinanceCombinedStreamMessage(event.data)

    if (!snapshot) {
      return
    }

    sendToPeers(connection, {
      type: 'ticker',
      data: snapshot
    })
  })

  upstreamSocket.addEventListener('error', () => {
    if (connection.socket !== upstreamSocket) {
      return
    }

    connection.state = 'error'
    sendToPeers(connection, {
      type: 'error',
      data: {
        message: 'Binance upstream connection failed.'
      }
    })
  })

  upstreamSocket.addEventListener('close', () => {
    if (connection.socket !== upstreamSocket) {
      return
    }

    connection.socket = null
    connection.state = 'closed'

    if (!connection.peers.size || connection.disposed) {
      return
    }

    scheduleReconnect(connection)
  })
}

const getOrCreateConnection = (namespaceKey: string, streams: string[]) => {
  const existing = upstreamConnections.get(namespaceKey)

  if (existing) {
    return existing
  }

  const connection: UpstreamConnection = {
    disposed: false,
    namespaceKey,
    peers: new Set(),
    reconnectTimer: null,
    socket: null,
    state: 'connecting',
    streams
  }

  upstreamConnections.set(namespaceKey, connection)

  return connection
}

export default defineWebSocketHandler({
  upgrade(request) {
    const streams = parseRequestedStreams(request)

    if (!streams.length) {
      throw new Response('At least one valid Binance ticker stream is required.', { status: 400 })
    }

    const namespaceKey = `binance:${streams.join('|')}`
    Object.assign(request.context, {
      namespaceKey,
      streams
    })
  },
  open(peer) {
    const context = peer.context as unknown as PeerContext
    const connection = getOrCreateConnection(context.namespaceKey, context.streams)

    connection.peers.add(peer)

    sendToPeers(connection, {
      type: 'status',
      data: {
        state: connection.state,
        streams: connection.streams
      }
    })

    if (!connection.socket && !connection.reconnectTimer) {
      connectUpstream(connection)
    }
  },
  close(peer) {
    const context = peer.context as unknown as PeerContext
    const connection = upstreamConnections.get(context.namespaceKey)

    if (!connection) {
      return
    }

    connection.peers.delete(peer)

    if (!connection.peers.size) {
      closeUpstreamConnection(connection)
    }
  }
})
