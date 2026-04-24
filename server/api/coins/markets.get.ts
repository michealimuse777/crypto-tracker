import type { H3Event } from 'h3'
import type { MarketCoin } from '~/types'
import { coingeckoFetch } from '~/server/utils/coingecko'

const handler = async (event: H3Event): Promise<MarketCoin[]> => {
  const query = getQuery(event)
  const ids = typeof query.ids === 'string' ? query.ids : ''
  const currency = typeof query.currency === 'string' ? query.currency : 'usd'

  if (!ids) {
    return []
  }

  return coingeckoFetch<MarketCoin[]>('/coins/markets', {
    params: {
      vs_currency: currency,
      ids,
      sparkline: true,
      price_change_percentage: '24h'
    }
  })
}

export default cachedEventHandler(
  handler,
  {
    maxAge: 120
  }
)
