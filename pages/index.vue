<script setup lang="ts">
import { buildPortfolioRows, buildPortfolioTrend, summarizePortfolio } from '~/utils/calculations'
import { formatCurrency } from '~/utils/format'
import { resolveLiveBadge } from '~/utils/liveStatus'

const { assets, currency } = usePortfolio()

const { data: markets, pending, refresh, liveStatus } = useHybridMarkets(
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
const liveBadge = computed(() => resolveLiveBadge({
  enabled: liveStatus.value.enabled,
  hasAssets: assets.value.length > 0,
  state: liveStatus.value.state
}))

const kpiCards = computed(() => [
  {
    title: 'Portfolio Value',
    value: formatCurrency(summary.value.totalValue, currency.value),
    change: summary.value.dailyChangePercent,
    helper: `${formatCurrency(summary.value.dailyChangeValue, currency.value)} over 24h`
  },
  {
    title: '24h Move',
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
  <div class="space-y-5 sm:space-y-6">
    <section class="card-shell p-4 sm:p-5 lg:p-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div class="max-w-3xl">
          <p class="text-[11px] uppercase tracking-[0.3em] text-accent/80">Market Snapshot</p>
          <h1 class="mt-3 max-w-2xl text-2xl font-semibold leading-tight sm:text-3xl">
            Live portfolio performance built for quick scanning.
          </h1>
          <p class="mt-2 text-sm leading-6 text-muted">
            Track value, 24h move, allocation, and movers in one view.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          <span
            class="status-pill"
            :class="liveBadge.className"
          >
            <span class="h-2 w-2 rounded-full bg-current opacity-90" />
            {{ liveBadge.label }}
          </span>

          <NuxtLink
            to="/portfolio"
            class="control-shell rounded-xl px-4 py-2.5 text-sm font-medium text-muted hover:border-accent/30 hover:text-text"
          >
            Manage holdings
          </NuxtLink>
        </div>
      </div>
    </section>

    <div class="grid grid-cols-2 gap-3 lg:grid-cols-3">
      <KpiCard
        v-for="(card, index) in kpiCards"
        :key="card.title"
        :title="card.title"
        :value="card.value"
        :change="card.change"
        :helper="card.helper"
        :class="index === kpiCards.length - 1 && kpiCards.length % 2 === 1 ? 'col-span-2 lg:col-span-1' : ''"
      />
    </div>

    <div v-if="!rows.length" class="card-shell p-5 sm:p-6">
      <p class="text-[11px] uppercase tracking-[0.3em] text-muted">Empty State</p>
      <h2 class="mt-3 text-xl font-semibold sm:text-2xl">Build your first tracked portfolio</h2>
      <p class="mt-3 max-w-2xl text-sm leading-6 text-muted">
        Add a coin on the portfolio page and this dashboard will fill in value, PnL, allocation, and movers.
      </p>
      <NuxtLink
        to="/portfolio"
        class="mt-5 inline-flex rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
      >
        Add assets
      </NuxtLink>
    </div>

    <template v-else>
      <div class="grid gap-4 xl:grid-cols-2">
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

      <div class="grid gap-4 2xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.7fr)]">
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

      <section class="space-y-3">
        <div>
          <p class="text-[11px] uppercase tracking-[0.3em] text-muted">Holdings</p>
          <h2 class="mt-2 text-base font-semibold sm:text-lg">Tracked assets</h2>
        </div>

        <AssetTable :rows="rows" :currency="currency" :loading="pending" />
      </section>
    </template>
  </div>
</template>
