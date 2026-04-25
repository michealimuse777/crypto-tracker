<script setup lang="ts">
import type { PortfolioAsset } from '~/types'
import { buildPortfolioRows, summarizePortfolio } from '~/utils/calculations'
import { formatCurrency } from '~/utils/format'

const { assets, currency, saveAsset, removeAsset } = usePortfolio()

const { data: markets, pending, error, refresh, liveStatus } = useHybridMarkets(
  assets,
  { currency }
)

const rows = computed(() => buildPortfolioRows(assets.value, markets.value))
const summary = computed(() => summarizePortfolio(rows.value))
const liveBadgeClass = computed(() =>
  liveStatus.value.state === 'open'
    ? 'border-positive/30 bg-positive/10 text-positive'
    : 'border-border text-muted'
)
const liveBadgeLabel = computed(() => {
  if (!assets.value.length) {
    return 'Polling Ready'
  }

  if (!liveStatus.value.enabled) {
    return 'Polling Only'
  }

  if (liveStatus.value.state === 'open') {
    return `Live ${liveStatus.value.liveAssets}/${liveStatus.value.totalAssets}`
  }

  if (liveStatus.value.state === 'connecting' || liveStatus.value.state === 'reconnecting') {
    return 'Connecting Live'
  }

  return 'Fallback Active'
})

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
  <div class="space-y-8">
    <div class="grid gap-8 xl:grid-cols-[minmax(0,1.75fr)_320px]">
      <section class="space-y-6">
        <div class="space-y-3">
          <p class="text-xs uppercase tracking-[0.3em] text-muted">Portfolio Builder</p>
          <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div class="max-w-3xl">
              <h1 class="text-lg font-medium">Add and balance your tracked holdings.</h1>
              <p class="mt-2 text-sm leading-7 text-muted">
                Search a coin, set quantity and cost basis, and keep your portfolio state local while CoinGecko polling and Binance live prices fill in the market side.
              </p>
            </div>

            <span
              class="inline-flex rounded-full border px-3 py-2 text-xs uppercase tracking-[0.24em]"
              :class="liveBadgeClass"
            >
              {{ liveBadgeLabel }}
            </span>
          </div>
        </div>

        <CoinSearch
          :assets="assets"
          :currency="currency"
          @save="handleSave"
        />
      </section>

      <aside class="space-y-4 xl:sticky xl:top-[96px] xl:self-start">
        <div class="card-shell p-6">
          <p class="text-xs uppercase tracking-[0.3em] text-muted">Workspace Snapshot</p>
          <h2 class="mt-3 text-lg font-medium">Current totals</h2>
          <p class="mt-3 text-sm leading-7 text-muted">
            Holdings stay in localStorage, market snapshots stay cached on the server, and USD mode can layer live Binance price updates on top.
          </p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div class="card-shell p-5">
            <p class="text-sm text-muted">Tracked value</p>
            <p class="mt-3 text-3xl font-semibold">
              {{ formatCurrency(summary.totalValue, currency) }}
            </p>
          </div>

          <div class="card-shell p-5">
            <p class="text-sm text-muted">Total PnL</p>
            <p
              class="mt-3 text-3xl font-semibold"
              :class="summary.totalPnl >= 0 ? 'text-positive' : 'text-negative'"
            >
              {{ formatCurrency(summary.totalPnl, currency) }}
            </p>
          </div>
        </div>
      </aside>
    </div>

    <p v-if="error" class="rounded-2xl border border-negative/40 bg-negative/10 px-4 py-3 text-sm text-negative">
      Price refresh failed. Check your CoinGecko env config or try again.
    </p>

    <section class="space-y-4">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-xs uppercase tracking-[0.3em] text-muted">Holdings</p>
          <h2 class="mt-2 text-lg font-medium">Portfolio positions</h2>
        </div>

        <p class="text-sm text-muted">
          Responsive cards stay visible on smaller screens, while the full table opens up once there is enough width.
        </p>
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
