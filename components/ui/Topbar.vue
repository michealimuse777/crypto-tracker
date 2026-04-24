<script setup lang="ts">
import type { Currency } from '~/types'

const route = useRoute()
const { assets, currency, setCurrency } = usePortfolio()

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

const currencyOptions: Currency[] = ['usd', 'ngn', 'eur']

const navClass = (path: string) =>
  route.path === path
    ? 'border-accent bg-accent/10 text-text'
    : 'border-border text-muted hover:border-accent hover:text-text'

const onCurrencyChange = (event: Event) => {
  setCurrency((event.target as HTMLSelectElement).value as Currency)
}
</script>

<template>
  <header class="border-b border-border bg-card/80 backdrop-blur">
    <div class="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
      <div>
        <p class="text-xs uppercase tracking-[0.32em] text-muted">Portfolio Intelligence</p>
        <h2 class="text-lg font-semibold">{{ pageTitle }}</h2>
      </div>

      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 lg:hidden">
          <NuxtLink
            to="/"
            class="rounded-full border px-3 py-2 text-sm transition"
            :class="navClass('/')"
          >
            Dashboard
          </NuxtLink>
          <NuxtLink
            to="/portfolio"
            class="rounded-full border px-3 py-2 text-sm transition"
            :class="navClass('/portfolio')"
          >
            Portfolio
          </NuxtLink>
        </div>

        <div class="hidden items-center gap-2 lg:flex">
          <NuxtLink
            to="/"
            class="rounded-full border px-3 py-2 text-sm transition"
            :class="navClass('/')"
          >
            Dashboard
          </NuxtLink>
          <NuxtLink
            to="/portfolio"
            class="rounded-full border px-3 py-2 text-sm transition"
            :class="navClass('/portfolio')"
          >
            Portfolio
          </NuxtLink>
        </div>

        <div class="hidden rounded-full border border-border px-3 py-2 text-xs uppercase tracking-[0.28em] text-muted md:block">
          {{ assets.length }} {{ assets.length === 1 ? 'asset' : 'assets' }}
        </div>

        <label class="flex items-center gap-2 rounded-full border border-border bg-slate-950/70 px-3 py-2 text-sm">
          <span class="text-muted">Currency</span>
          <select
            :value="currency"
            class="bg-transparent font-medium uppercase outline-none"
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
      </div>
    </div>
  </header>
</template>
