import type { H3Event } from 'h3'
import type { CoinHistoryResponse } from '~/types'
import { coingeckoFetch } from '~/server/utils/coingecko'

const handler = async (event: H3Event): Promise<CoinHistoryResponse> => {
  const id = event.context.params?.id
  const query = getQuery(event)
  const currency = typeof query.currency === 'string' ? query.currency : 'usd'
  const days = typeof query.days === 'string' ? query.days : '30'

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Coin id is required.'
    })
  }

  return coingeckoFetch<CoinHistoryResponse>(`/coins/${id}/market_chart`, {
    params: {
      vs_currency: currency,
      days,
      interval: 'daily'
    }
  })
}

export default cachedEventHandler(
  handler,
  {
    maxAge: 3_600
  }
)
