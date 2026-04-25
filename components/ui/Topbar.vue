<script setup lang="ts">
import type { Currency } from '~/types'

const route = useRoute()
const { assets, currency, setCurrency } = usePortfolio()
const isSidebarOpen = useState('ui:sidebar-open', () => false)

const pageMeta = computed(() => {
  if (route.path.startsWith('/coins/')) {
    return {
      title: 'Coin Detail',
      subtitle: 'Market breakdown',
      icon: 'coin'
    }
  }

  return {
    '/': {
      title: 'Dashboard',
      subtitle: 'Portfolio overview',
      icon: 'dashboard'
    },
    '/portfolio': {
      title: 'Portfolio',
      subtitle: 'Manage your holdings',
      icon: 'portfolio'
    }
  }[route.path] ?? {
    title: 'CryptoTrack',
    subtitle: 'Portfolio tracker',
    icon: 'dashboard'
  }
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
  <header class="sticky top-0 z-30 bg-bg/65 px-3 py-3 backdrop-blur-xl sm:px-5 lg:px-8">
    <div class="mr-auto w-full max-w-[1500px]">
      <div class="panel-shell flex items-center justify-between gap-3 px-3 py-3 sm:px-4 sm:py-3.5">
        <div class="flex min-w-0 items-center gap-3">
          <button
            class="control-shell h-11 w-11 shrink-0 justify-center px-0 lg:hidden"
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

          <div class="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent sm:flex">
            <svg
              v-if="pageMeta.icon === 'dashboard'"
              class="h-5 w-5"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            >
              <path d="M4 12.5L8.5 8L11.5 11L16 6.5" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M12.5 6.5H16V10" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <svg
              v-else-if="pageMeta.icon === 'portfolio'"
              class="h-5 w-5"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            >
              <path d="M6 7.5H14" stroke-linecap="round" />
              <path d="M5.5 7.5H4.75C4.336 7.5 4 7.836 4 8.25V13.5C4 13.914 4.336 14.25 4.75 14.25H15.25C15.664 14.25 16 13.914 16 13.5V8.25C16 7.836 15.664 7.5 15.25 7.5H14.5" stroke-linecap="round" />
              <path d="M7.25 7.5V6.5C7.25 5.948 7.698 5.5 8.25 5.5H11.75C12.302 5.5 12.75 5.948 12.75 6.5V7.5" stroke-linecap="round" />
            </svg>
            <svg
              v-else
              class="h-5 w-5"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            >
              <circle cx="10" cy="10" r="5.5" />
              <path d="M10 4.5V15.5" stroke-linecap="round" />
              <path d="M4.5 10H15.5" stroke-linecap="round" />
            </svg>
          </div>

          <div class="min-w-0">
            <h2 class="truncate text-base font-semibold sm:text-[1.75rem] sm:leading-none">{{ pageMeta.title }}</h2>
            <p class="mt-1 truncate text-xs text-muted sm:text-sm">{{ pageMeta.subtitle }}</p>
          </div>
        </div>

        <div class="flex items-center gap-2 sm:gap-3">
          <div class="hidden rounded-full border border-border/70 px-3 py-1.5 text-xs uppercase tracking-[0.24em] text-muted md:block">
            {{ assets.length }} {{ assets.length === 1 ? 'asset' : 'assets' }}
          </div>

          <label class="control-shell relative gap-0 pr-8">
            <span class="sr-only">Currency</span>
            <select
              :value="currency"
              class="appearance-none bg-transparent pr-2 text-sm font-semibold uppercase text-text outline-none"
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
            <svg
              class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            >
              <path d="M5.5 7.5L10 12L14.5 7.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </label>

          <button
            v-if="showRefresh"
            class="control-shell h-11 w-11 justify-center px-0 text-accent hover:border-accent/30"
            type="button"
            aria-label="Refresh market data"
            @click="refreshMarkets"
          >
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M15.5 8A5.5 5.5 0 0 0 5.9 5.25" stroke-linecap="round" />
              <path d="M4.5 8V4.75H7.75" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M4.5 12A5.5 5.5 0 0 0 14.1 14.75" stroke-linecap="round" />
              <path d="M15.5 12V15.25H12.25" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
