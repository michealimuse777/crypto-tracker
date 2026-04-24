import type { H3Event } from 'h3'
import type { CoinSearchResponse, MarketCoin } from '~/types'
import { coingeckoFetch } from '~/server/utils/coingecko'

const createEmptySearchResponse = (): CoinSearchResponse => ({
  coins: [],
  exchanges: [],
  icos: [],
  categories: [],
  nfts: []
})

const handler = async (event: H3Event): Promise<CoinSearchResponse> => {
  const { query, currency: requestedCurrency } = getQuery(event)
  const searchQuery = typeof query === 'string' ? query.trim() : ''
  const currency = typeof requestedCurrency === 'string' ? requestedCurrency : 'usd'

  if (!searchQuery) {
    return createEmptySearchResponse()
  }

  const searchResponse = await coingeckoFetch<CoinSearchResponse>('/search', {
    params: {
      query: searchQuery
    }
  })

  const coinIds = searchResponse.coins
    .slice(0, 8)
    .map((coin) => coin.id)
    .filter(Boolean)

  if (!coinIds.length) {
    return searchResponse
  }

  try {
    const markets = await coingeckoFetch<Array<Pick<MarketCoin, 'id' | 'current_price'>>>('/coins/markets', {
      params: {
        vs_currency: currency,
        ids: coinIds.join(','),
        sparkline: false
      }
    })

    const priceById = Object.fromEntries(markets.map((market) => [market.id, market.current_price]))

    return {
      ...searchResponse,
      coins: searchResponse.coins.map((coin) => ({
        ...coin,
        current_price: priceById[coin.id] ?? null
      }))
    }
  } catch {
    return searchResponse
  }
}

export default cachedEventHandler(
  handler,
  {
    maxAge: 600
  }
)
