<script setup lang="ts">
import type { Currency } from '~/types'

const route = useRoute()
const { assets, currency, setCurrency } = usePortfolio()
const isSidebarOpen = useState('ui:sidebar-open', () => false)

const pageTitle = computed(() => {
  if (route.path.startsWith('/coins/')) {
    return 'Coin Detail'
  }

  return (
    {
      '/': 'Dashboard',
      '/portfolio': 'Portfolio'
    }[route.path] ?? 'CryptoTrack'
  )
})

const pageKicker = computed(() => {
  if (route.path.startsWith('/coins/')) {
    return 'Market Detail'
  }

  return route.path === '/portfolio' ? 'Portfolio Workspace' : 'Portfolio Overview'
})

const currencyOptions: Currency[] = ['usd', 'ngn', 'eur']
const showRefresh = computed(() => route.path === '/' || route.path === '/portfolio')

const onCurrencyChange = (event: Event) => {
  setCurrency((event.target as HTMLSelectElement).value as Currency)
}

const refreshMarkets = () => {
  if (!import.meta.client) {
    return
  }

  window.dispatchEvent(new CustomEvent('crypto-tracker:refresh-markets'))
}
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-border/80 bg-bg/70 backdrop-blur-xl">
    <div class="mr-auto flex min-h-[72px] w-full max-w-[1500px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
      <div class="flex min-w-0 items-center gap-3">
        <button
          class="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border/80 bg-slate-950/60 text-muted transition hover:border-border hover:text-text lg:hidden"
          type="button"
          aria-label="Open navigation"
          @click="isSidebarOpen = true"
        >
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M3.5 5.5H16.5" stroke-linecap="round" />
            <path d="M3.5 10H16.5" stroke-linecap="round" />
            <path d="M3.5 14.5H12.5" stroke-linecap="round" />
          </svg>
        </button>

        <div class="min-w-0">
          <p class="text-[11px] uppercase tracking-[0.3em] text-muted">{{ pageKicker }}</p>
          <h2 class="truncate text-lg font-semibold sm:text-2xl">{{ pageTitle }}</h2>
        </div>
      </div>

      <div class="flex items-center gap-2 sm:gap-3">
        <div class="hidden text-sm text-muted md:block">
          {{ assets.length }} {{ assets.length === 1 ? 'asset' : 'assets' }}
        </div>

        <label class="flex items-center rounded-full border border-border/80 bg-slate-950/60 px-3 py-2 text-xs sm:hidden">
          <span class="sr-only">Currency</span>
          <select
            :value="currency"
            class="bg-transparent font-medium uppercase text-text outline-none"
            aria-label="Change currency"
            @change="onCurrencyChange"
          >
            <option
              v-for="option in currencyOptions"
              :key="option"
              :value="option"
              class="bg-card text-text"
            >
              {{ option }}
            </option>
          </select>
        </label>

        <label class="hidden items-center gap-2 rounded-full border border-border/80 bg-slate-950/60 px-3 py-2 text-sm sm:flex">
          <span class="text-muted">Currency</span>
          <select
            :value="currency"
            class="bg-transparent font-medium uppercase text-text outline-none"
            @change="onCurrencyChange"
          >
            <option
              v-for="option in currencyOptions"
              :key="option"
              :value="option"
              class="bg-card text-text"
            >
              {{ option }}
            </option>
          </select>
        </label>

        <button
          v-if="showRefresh"
          class="inline-flex rounded-xl bg-accent px-3 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
          type="button"
          @click="refreshMarkets"
        >
          Refresh
        </button>
      </div>
    </div>
  </header>
</template>
