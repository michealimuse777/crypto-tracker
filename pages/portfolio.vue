<script setup lang="ts">
import type { PortfolioAsset } from '~/types'
import { buildPortfolioRows, summarizePortfolio } from '~/utils/calculations'
import { formatCurrency, formatPercent } from '~/utils/format'
import { resolveLiveBadge } from '~/utils/liveStatus'

const { assets, currency, saveAsset, removeAsset } = usePortfolio()

const { data: markets, pending, error, refresh, liveStatus } = useHybridMarkets(
  assets,
  { currency }
)

const rows = computed(() => buildPortfolioRows(assets.value, markets.value))
const summary = computed(() => summarizePortfolio(rows.value))
const liveBadge = computed(() => resolveLiveBadge({
  enabled: liveStatus.value.enabled,
  hasAssets: assets.value.length > 0,
  state: liveStatus.value.state
}))
const pnlToneClass = computed(() => (summary.value.totalPnl >= 0 ? 'text-positive' : 'text-negative'))

const handleRefreshRequest = () => {
  void refresh()
}

onMounted(() => {
  window.addEventListener('crypto-tracker:refresh-markets', handleRefreshRequest)
})

onBeforeUnmount(() => {
  window.removeEventListener('crypto-tracker:refresh-markets', handleRefreshRequest)
})

const handleSave = (asset: PortfolioAsset) => {
  saveAsset(asset)
}

const handleRemove = (id: string) => {
  removeAsset(id)
}
</script>

<template>
  <div class="space-y-5 sm:space-y-6">
    <section class="card-shell p-4 sm:p-5 lg:p-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div class="max-w-3xl">
          <p class="text-[11px] uppercase tracking-[0.3em] text-accent/80">Portfolio Builder</p>
          <h1 class="mt-3 max-w-2xl text-2xl font-semibold leading-tight sm:text-3xl">
            Add and balance your tracked holdings.
          </h1>
          <p class="mt-2 text-sm leading-6 text-muted">
            Search a coin, set size and cost basis, then keep the portfolio synced with market data.
          </p>
        </div>

        <div class="w-full max-w-sm space-y-3">
          <span
            class="status-pill"
            :class="liveBadge.className"
          >
            <span class="h-2 w-2 rounded-full bg-current opacity-90" />
            {{ liveBadge.label }}
          </span>

          <div class="mini-stat-shell">
            <p class="text-[11px] uppercase tracking-[0.28em] text-muted">Portfolio</p>
            <div class="mt-3 flex items-end justify-between gap-4">
              <div>
                <p class="text-xl font-semibold leading-none sm:text-2xl">
                  {{ formatCurrency(summary.totalValue, currency) }}
                </p>
                <p class="mt-1 text-xs text-muted">Tracked value</p>
              </div>

              <div class="text-right">
                <p class="text-sm font-medium" :class="pnlToneClass">
                  {{ formatCurrency(summary.totalPnl, currency) }}
                </p>
                <p class="mt-1 text-xs" :class="pnlToneClass">
                  {{ formatPercent(summary.totalPnlPercent) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <CoinSearch
      :assets="assets"
      :currency="currency"
      @save="handleSave"
    />

    <p v-if="error" class="rounded-xl border border-negative/40 bg-negative/10 px-4 py-3 text-sm text-negative">
      Price refresh failed. Check your CoinGecko env config or try again.
    </p>

    <section class="space-y-3">
      <div>
        <p class="text-[11px] uppercase tracking-[0.3em] text-muted">Holdings</p>
        <h2 class="mt-2 text-base font-semibold sm:text-lg">Portfolio positions</h2>
      </div>

      <AssetTable
        :rows="rows"
        :currency="currency"
        :loading="pending"
        removable
        @remove="handleRemove"
      />
    </section>
  </div>
</template>
