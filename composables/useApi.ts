interface EndpointRequest {
  url: string
  options?: {
    params?: Record<string, unknown>
  }
}

const endpointResolvers: Record<
  'search' | 'markets' | 'detail' | 'history',
  (payload: Record<string, unknown>) => EndpointRequest
> = {
  search: (payload: Record<string, unknown>) => ({
    url: '/api/coins/search',
    options: {
      params: payload
    }
  }),
  markets: (payload: Record<string, unknown>) => ({
    url: '/api/coins/markets',
    options: {
      params: payload
    }
  }),
  detail: (payload: Record<string, unknown>) => ({
    url: `/api/coins/${payload.id}`
  }),
  history: (payload: Record<string, unknown>) => ({
    url: `/api/coins/${payload.id}/history`,
    options: {
      params: {
        currency: payload.currency,
        days: payload.days
      }
    }
  })
}

export const useApi = () => {
  const fetcher = async <T>(type: keyof typeof endpointResolvers, payload: Record<string, unknown> = {}) => {
    const request = endpointResolvers[type](payload)
    return $fetch<T>(request.url, request.options)
  }

  return { fetcher }
}
