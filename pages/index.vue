<script setup lang="ts">
import { buildPortfolioRows, buildPortfolioTrend, summarizePortfolio } from '~/utils/calculations'
import { formatCurrency } from '~/utils/format'

const { assets, currency } = usePortfolio()

const { data: markets, pending, error, refresh, liveStatus } = useHybridMarkets(
  assets,
  { currency }
)

const rows = computed(() => buildPortfolioRows(assets.value, markets.value))
const summary = computed(() => summarizePortfolio(rows.value))
const trendPoints = computed(() => buildPortfolioTrend(rows.value))
const topGainers = computed(() =>
  [...rows.value]
    .filter((row) => row.dailyChangePercent > 0)
    .sort((left, right) => right.dailyChangePercent - left.dailyChangePercent)
    .slice(0, 3)
)
const topLosers = computed(() =>
  [...rows.value]
    .filter((row) => row.dailyChangePercent < 0)
    .sort((left, right) => left.dailyChangePercent - right.dailyChangePercent)
    .slice(0, 3)
)
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

const kpiCards = computed(() => [
  {
    title: 'Portfolio Value',
    value: formatCurrency(summary.value.totalValue, currency.value),
    change: summary.value.dailyChangePercent,
    helper: `${formatCurrency(summary.value.dailyChangeValue, currency.value)} 24h`
  },
  {
    title: '24h Change',
    value: formatCurrency(summary.value.dailyChangeValue, currency.value),
    change: summary.value.dailyChangePercent,
    helper: 'Weighted daily move'
  },
  {
    title: 'Total PnL',
    value: formatCurrency(summary.value.totalPnl, currency.value),
    change: summary.value.totalPnlPercent,
    helper: `${formatCurrency(summary.value.totalCostBasis, currency.value)} cost basis`
  }
])

const handleRefreshRequest = () => {
  void refresh()
}

onMounted(() => {
  window.addEventListener('crypto-tracker:refresh-markets', handleRefreshRequest)
})

onBeforeUnmount(() => {
  window.removeEventListener('crypto-tracker:refresh-markets', handleRefreshRequest)
})
</script>

<template>
  <div class="space-y-8">
    <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div class="max-w-3xl">
        <p class="text-xs uppercase tracking-[0.3em] text-muted">Market Snapshot</p>
        <h1 class="mt-2 text-lg font-medium">Live portfolio performance with cached market data underneath.</h1>
        <p class="mt-2 text-sm leading-7 text-muted">
          Use the dashboard for weighted daily change, allocation, movers, and live market context. When you need to modify holdings, jump to the portfolio workspace.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <span
          class="rounded-full border px-3 py-2 text-xs uppercase tracking-[0.24em]"
          :class="liveBadgeClass"
        >
          {{ liveBadgeLabel }}
        </span>

        <NuxtLink
          to="/portfolio"
          class="rounded-xl border border-border px-4 py-3 text-sm font-medium text-muted transition hover:border-accent hover:text-text"
        >
          Manage portfolio
        </NuxtLink>
      </div>
    </div>

    <div class="grid gap-4 lg:grid-cols-3">
      <KpiCard
        v-for="card in kpiCards"
        :key="card.title"
        :title="card.title"
        :value="card.value"
        :change="card.change"
        :helper="card.helper"
      />
    </div>

    <p v-if="error" class="rounded-2xl border border-negative/40 bg-negative/10 px-4 py-3 text-sm text-negative">
      Something went wrong while refreshing prices.
      <button class="ml-2 underline" type="button" @click="refresh">Try again</button>
    </p>

    <div v-if="!rows.length" class="card-shell p-8">
      <p class="text-xs uppercase tracking-[0.3em] text-muted">Empty State</p>
      <h2 class="mt-3 text-2xl font-semibold">Build your first tracked portfolio</h2>
      <p class="mt-3 max-w-2xl text-sm leading-7 text-muted">
        Search a coin, store quantity and average buy, and this dashboard will compute live value,
        weighted daily change, allocation, and total PnL from CoinGecko polling with a Binance live-price overlay in USD mode.
      </p>
      <NuxtLink
        to="/portfolio"
        class="mt-6 inline-flex rounded-xl bg-accent px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-500"
      >
        Add assets
      </NuxtLink>
    </div>

    <template v-else>
      <div class="grid gap-6 xl:grid-cols-2">
        <MoversCard
          title="Top Gainers"
          :rows="topGainers"
          :currency="currency"
          empty-label="No positive movers yet in the current portfolio."
        />
        <MoversCard
          title="Top Losers"
          :rows="topLosers"
          :currency="currency"
          empty-label="No negative movers yet in the current portfolio."
        />
      </div>

      <div class="grid gap-6 2xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.7fr)]">
        <div>
          <ChartCard>
            <template #eyebrow>Performance</template>
            <template #title>Portfolio Value</template>
            <PerformanceChart :points="trendPoints" label="Portfolio value" />
          </ChartCard>
        </div>

        <ChartCard>
          <template #eyebrow>Distribution</template>
          <template #title>Allocation</template>
          <AllocationChart :rows="rows" />
        </ChartCard>
      </div>

      <section class="space-y-4">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="text-xs uppercase tracking-[0.3em] text-muted">Holdings</p>
            <h2 class="mt-2 text-lg font-medium">Tracked assets</h2>
          </div>

          <p class="text-sm text-muted">
            The layout stays card-first until wider screens so the data table does not force the whole dashboard to scroll sideways.
          </p>
        </div>

        <AssetTable :rows="rows" :currency="currency" :loading="pending" />
      </section>
    </template>
  </div>
</template>
