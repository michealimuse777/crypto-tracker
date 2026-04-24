type FetchOptions = Exclude<Parameters<typeof $fetch>[1], undefined>

const headerStrategies = {
  none: () => ({}),
  demo: (key: string) => ({
    'x-cg-demo-api-key': key
  }),
  pro: (key: string) => ({
    'x-cg-pro-api-key': key
  })
}

const baseStrategies = {
  none: 'https://api.coingecko.com/api/v3',
  demo: 'https://api.coingecko.com/api/v3',
  pro: 'https://pro-api.coingecko.com/api/v3'
}

type ApiMode = keyof typeof headerStrategies

export const getCoinGeckoClient = () => {
  const config = useRuntimeConfig()
  const mode: ApiMode = config.coinGeckoProKey
    ? 'pro'
    : config.coinGeckoDemoKey
      ? 'demo'
      : 'none'
  const key = mode === 'pro' ? config.coinGeckoProKey : mode === 'demo' ? config.coinGeckoDemoKey : ''

  return {
    base: config.coinGeckoBase || baseStrategies[mode],
    headers: key ? headerStrategies[mode](key) : headerStrategies.none()
  }
}

export const coingeckoFetch = async <T>(path: string, options: FetchOptions = {}): Promise<T> => {
  const client = getCoinGeckoClient()

  const response = await $fetch<T>(`${client.base}${path}`, {
    ...options,
    headers: {
      ...client.headers,
      ...(options.headers ?? {})
    }
  })

  return response as T
}
