export default defineNuxtConfig({
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  components: [
    {
      path: '~/components',
      pathPrefix: false
    }
  ],
  modules: ['@pinia/nuxt'],
  nitro: {
    experimental: {
      websocket: true
    }
  },
  runtimeConfig: {
    coinGeckoBase: process.env.COINGECKO_BASE || 'https://api.coingecko.com/api/v3',
    coinGeckoDemoKey: process.env.COINGECKO_DEMO_KEY || '',
    coinGeckoProKey: process.env.COINGECKO_PRO_KEY || '',
    public: {
      binanceWsBase: process.env.NUXT_PUBLIC_BINANCE_WS_BASE || process.env.BINANCE_WS_BASE || 'wss://data-stream.binance.vision',
      defaultCurrency: process.env.NUXT_PUBLIC_DEFAULT_CURRENCY || 'usd',
      defaultPollSpeed: process.env.NUXT_PUBLIC_DEFAULT_POLL_SPEED || 'medium'
    }
  },
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {}
    }
  },
  typescript: {
    strict: true,
    typeCheck: false
  }
})
