import type { H3Event } from 'h3'
import type { CoinDetail } from '~/types'
import { coingeckoFetch } from '~/server/utils/coingecko'

const handler = async (event: H3Event): Promise<CoinDetail> => {
  const id = event.context.params?.id

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Coin id is required.'
    })
  }

  return coingeckoFetch<CoinDetail>(`/coins/${id}`, {
    params: {
      localization: false,
      tickers: false,
      community_data: false,
      developer_data: false,
      sparkline: false
    }
  })
}

export default cachedEventHandler(
  handler,
  {
    maxAge: 1_800
  }
)
