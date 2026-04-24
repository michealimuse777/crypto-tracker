<script setup lang="ts">
import type { CoinDetail, CoinHistoryResponse } from '~/types'
import { calculatePnL } from '~/utils/pnlStrategies'
import { buildHistoryPoints } from '~/utils/calculations'
import { formatCompactNumber, formatCurrency, formatDate, formatPercent, stripHtml } from '~/utils/format'

const route = useRoute()
const { assets, currency } = usePortfolio()

const coinId = computed(() => route.params.id as string)

const {
  data: coin,
  pending: coinPending,
  error: coinError
} = await useFetch<CoinDetail>(() => `/api/coins/${coinId.value}`, {
  key: () => `coin-${coinId.value}`
})

const {
  data: history,
  pending: historyPending,
  error: historyError
} = await useFetch<CoinHistoryResponse>(() => `/api/coins/${coinId.value}/history`, {
  key: () => `coin-history-${coinId.value}-${currency.value}`,
  params: computed(() => ({
    currency: currency.value,
    days: 30
  })),
  watch: [currency]
})

const historyPoints = computed(() => buildHistoryPoints(history.value))
const pageError = computed(() => coinError.value || historyError.value)

const description = computed(() => {
  const text = stripHtml(coin.value?.description?.en ?? '')
  return text.length > 320 ? `${text.slice(0, 320)}...` : text
})

const currentPrice = computed(() => coin.value?.market_data?.current_price?.[currency.value] ?? 0)
const marketCap = computed(() => coin.value?.market_data?.market_cap?.[currency.value] ?? 0)
const totalVolume = computed(() => coin.value?.market_data?.total_volume?.[currency.value] ?? 0)
const high24 = computed(() => coin.value?.market_data?.high_24h?.[currency.value] ?? 0)
const low24 = computed(() => coin.value?.market_data?.low_24h?.[currency.value] ?? 0)
const change24 = computed(() => coin.value?.market_data?.price_change_percentage_24h ?? 0)
const holding = computed(() => assets.value.find((asset) => asset.id === coinId.value) ?? null)
const holdingPnL = computed(() => (
  holding.value
    ? calculatePnL(holding.value, currentPrice.value)
    : null
))
</script>

<template>
  <div class="space-y-6">
    <NuxtLink
      to="/"
      class="inline-flex rounded-full border border-border px-3 py-2 text-xs uppercase tracking-[0.24em] text-muted transition hover:border-accent hover:text-text"
    >
      Back to dashboard
    </NuxtLink>

    <div v-if="coinPending && !coin" class="space-y-3">
      <div class="animate-pulse rounded-2xl border border-border p-6">
        <div class="h-4 w-1/4 rounded bg-border"></div>
        <div class="mt-4 h-8 w-1/3 rounded bg-border"></div>
      </div>
    </div>

    <p
      v-else-if="pageError"
      class="rounded-xl border border-negative/40 bg-negative/10 px-4 py-3 text-sm text-negative"
    >
      Unable to load this coin right now.
    </p>

    <template v-else-if="coin">
      <section class="grid gap-4 xl:grid-cols-[1.4fr,0.9fr]">
        <div class="card-shell p-6">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="flex items-center gap-4">
              <img
                :src="coin.image?.large || coin.image?.small || coin.image?.thumb"
                :alt="coin.name"
                class="h-16 w-16 rounded-full bg-slate-950/70"
              />

              <div>
                <p class="text-xs uppercase tracking-[0.3em] text-muted">Asset Detail</p>
                <h1 class="mt-2 text-3xl font-semibold">{{ coin.name }}</h1>
                <p class="mt-2 text-sm uppercase tracking-[0.24em] text-muted">
                  {{ coin.symbol }} - Rank #{{ coin.market_cap_rank ?? 'n/a' }}
                </p>
              </div>
            </div>

            <div class="rounded-2xl border border-border bg-slate-950/60 px-4 py-3 text-right">
              <p class="text-sm text-muted">Current price</p>
              <p class="mt-2 text-2xl font-semibold">
                {{ formatCurrency(currentPrice, currency) }}
              </p>
            </div>
          </div>

          <p class="mt-6 max-w-3xl text-sm leading-7 text-muted">
            {{ description || 'No description available.' }}
          </p>
        </div>

        <div class="space-y-4">
          <div class="card-shell p-6">
            <p class="text-xs uppercase tracking-[0.3em] text-muted">Key Stats</p>
            <div class="mt-6 space-y-4">
              <div class="flex items-center justify-between gap-4">
                <span class="text-sm text-muted">24h Change</span>
                <span :class="change24 >= 0 ? 'text-positive' : 'text-negative'">
                  {{ formatPercent(change24) }}
                </span>
              </div>
              <div class="flex items-center justify-between gap-4">
                <span class="text-sm text-muted">Market Cap</span>
                <span>{{ formatCompactNumber(marketCap) }}</span>
              </div>
              <div class="flex items-center justify-between gap-4">
                <span class="text-sm text-muted">Volume</span>
                <span>{{ formatCompactNumber(totalVolume) }}</span>
              </div>
              <div class="flex items-center justify-between gap-4">
                <span class="text-sm text-muted">24h High</span>
                <span>{{ formatCurrency(high24, currency) }}</span>
              </div>
              <div class="flex items-center justify-between gap-4">
                <span class="text-sm text-muted">24h Low</span>
                <span>{{ formatCurrency(low24, currency) }}</span>
              </div>
              <div class="flex items-center justify-between gap-4">
                <span class="text-sm text-muted">Algorithm</span>
                <span>{{ coin.hashing_algorithm || 'n/a' }}</span>
              </div>
            </div>
          </div>

          <div class="card-shell p-6">
            <p class="text-xs uppercase tracking-[0.3em] text-muted">Your Position</p>

            <div v-if="holding && holdingPnL" class="mt-6 space-y-4">
              <div class="flex items-center justify-between gap-4">
                <span class="text-sm text-muted">Quantity</span>
                <span>{{ holding.quantity }}</span>
              </div>
              <div class="flex items-center justify-between gap-4">
                <span class="text-sm text-muted">Average Buy</span>
                <span>{{ formatCurrency(holding.avgBuy, currency) }}</span>
              </div>
              <div class="flex items-center justify-between gap-4">
                <span class="text-sm text-muted">Purchase Date</span>
                <span>{{ formatDate(holding.purchaseDate) }}</span>
              </div>
              <div class="flex items-center justify-between gap-4">
                <span class="text-sm text-muted">Current Value</span>
                <span>{{ formatCurrency(holdingPnL.currentValue, currency) }}</span>
              </div>
              <div class="flex items-center justify-between gap-4">
                <span class="text-sm text-muted">Cost Basis</span>
                <span>{{ formatCurrency(holdingPnL.costBasis, currency) }}</span>
              </div>
              <div class="flex items-center justify-between gap-4">
                <span class="text-sm text-muted">User PnL</span>
                <span :class="holdingPnL.pnl >= 0 ? 'text-positive' : 'text-negative'">
                  {{ formatCurrency(holdingPnL.pnl, currency) }} / {{ formatPercent(holdingPnL.pnlPercent) }}
                </span>
              </div>
            </div>

            <div v-else class="mt-6 rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted">
              No saved holding for this coin yet. Add it from the portfolio page to track user-specific value and PnL here.
            </div>
          </div>
        </div>
      </section>

      <ChartCard>
        <template #eyebrow>History</template>
        <template #title>30 Day Price Performance</template>

        <div v-if="historyPending && !historyPoints.length" class="animate-pulse space-y-3">
          <div class="h-4 w-1/4 rounded bg-border"></div>
          <div class="h-72 rounded-2xl bg-border"></div>
        </div>

        <PerformanceChart v-else :points="historyPoints" :label="`${coin.name} 30D`" />
      </ChartCard>
    </template>
  </div>
</template>
