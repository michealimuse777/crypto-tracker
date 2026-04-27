<script setup lang="ts">
import type { Currency, PortfolioRow } from '~/types'
import { formatCompactNumber, formatCurrency, formatPercent } from '~/utils/format'

defineProps<{
  rows: PortfolioRow[]
  currency: Currency
  loading?: boolean
  removable?: boolean
}>()

const emit = defineEmits<{
  remove: [id: string]
}>()

const toneClass = (value: number) => (value >= 0 ? 'text-positive' : 'text-negative')
const quantityFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 8
})
</script>

<template>
  <div class="card-shell overflow-hidden">
    <div class="flex items-center justify-between border-b border-border/70 px-4 py-4 sm:px-5">
      <div>
        <p class="text-[11px] uppercase tracking-[0.24em] text-muted">Asset Table</p>
        <h3 class="mt-2 text-base font-semibold text-text sm:text-lg">Live positions at a glance.</h3>
      </div>
    </div>

    <div v-if="loading" class="flex flex-wrap gap-3 p-3 xl:block xl:space-y-3 xl:p-4">
      <div
        v-for="index in 4"
        :key="index"
        class="min-w-[260px] flex-1 animate-pulse rounded-2xl border border-border p-4 xl:min-w-0"
      >
        <div class="h-4 w-1/3 rounded bg-border"></div>
        <div class="mt-3 h-6 rounded bg-border"></div>
      </div>
    </div>

    <div v-else-if="!rows.length" class="p-5 text-sm text-muted">
      No holdings yet. Add a coin from the portfolio page to start tracking.
    </div>

    <template v-else>
      <div class="hidden overflow-x-auto px-3 pb-3 xl:block">
        <table class="min-w-[920px] w-full text-sm">
          <thead class="table-head">
            <tr>
              <th class="px-3 py-3">Coin</th>
              <th class="px-3 py-3">Symbol</th>
              <th class="px-3 py-3 text-right">Quantity</th>
              <th class="px-3 py-3">Price</th>
              <th class="px-3 py-3">Current Value</th>
              <th class="px-3 py-3">PnL</th>
              <th class="px-3 py-3">24h Change</th>
              <th v-if="removable" class="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="row in rows"
              :key="row.id"
              class="border-t border-border/80 transition hover:bg-slate-900/60"
            >
              <td class="px-3 py-3.5">
                <NuxtLink :to="`/coins/${row.id}`" class="flex min-w-0 items-center gap-3">
                  <img
                    :src="row.market?.image || row.image"
                    :alt="row.name"
                    class="h-9 w-9 rounded-full bg-slate-950/80"
                  />
                  <div class="min-w-0">
                    <p class="truncate font-medium text-text">{{ row.name }}</p>
                    <p class="text-xs uppercase tracking-[0.2em] text-muted">{{ row.symbol }}</p>
                  </div>
                </NuxtLink>
              </td>
              <td class="px-3 py-3.5">
                <span class="font-mono text-xs uppercase tracking-[0.2em] text-muted">{{ row.symbol }}</span>
              </td>
              <td class="px-3 py-3.5 text-right font-mono text-text whitespace-nowrap">
                {{ quantityFormatter.format(row.quantity) }}
              </td>
              <td class="px-3 py-3.5">
                <p class="font-mono whitespace-nowrap">{{ formatCurrency(row.currentPrice, currency) }}</p>
                <p v-if="row.market" class="text-xs text-muted">
                  MC {{ formatCompactNumber(row.market.market_cap) }} / Vol {{ formatCompactNumber(row.market.total_volume) }}
                </p>
                <p v-else class="text-xs text-muted">Market data pending</p>
              </td>
              <td class="px-3 py-3.5">
                <p class="font-medium whitespace-nowrap text-text">{{ formatCurrency(row.holdingsValue, currency) }}</p>
                <p class="text-xs text-muted">Cost {{ formatCurrency(row.costBasis, currency) }}</p>
              </td>
              <td class="px-3 py-3.5">
                <p class="font-medium whitespace-nowrap" :class="toneClass(row.pnl)">
                  {{ formatCurrency(row.pnl, currency) }}
                </p>
                <p class="text-xs" :class="toneClass(row.pnl)">
                  {{ formatPercent(row.pnlPercent) }}
                </p>
              </td>
              <td class="px-3 py-3.5">
                <p class="font-medium whitespace-nowrap" :class="toneClass(row.dailyChangeValue)">
                  {{ formatCurrency(row.dailyChangeValue, currency) }}
                </p>
                <p class="text-xs" :class="toneClass(row.dailyChangePercent)">
                  {{ formatPercent(row.dailyChangePercent) }}
                </p>
              </td>
              <td v-if="removable" class="px-3 py-3.5 text-right">
                <button
                  class="rounded-lg border border-border px-3 py-2 text-xs uppercase tracking-[0.2em] text-muted transition hover:border-negative hover:text-negative"
                  type="button"
                  @click="emit('remove', row.id)"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex flex-wrap gap-3 p-3 xl:hidden">
        <div
          v-for="row in rows"
          :key="row.id"
          class="min-w-[260px] flex-1 rounded-2xl border border-border/80 bg-slate-950/40 p-4"
        >
          <div class="flex items-start justify-between gap-3">
            <NuxtLink :to="`/coins/${row.id}`" class="flex min-w-0 items-center gap-3">
              <img
                :src="row.market?.image || row.image"
                :alt="row.name"
                class="h-9 w-9 rounded-full bg-slate-950/80"
              />
              <div class="min-w-0">
                <p class="truncate font-medium text-text">{{ row.name }}</p>
                <p class="text-xs uppercase tracking-[0.2em] text-muted">{{ row.symbol }}</p>
              </div>
            </NuxtLink>

            <p class="text-right text-xs uppercase tracking-[0.2em]" :class="toneClass(row.dailyChangePercent)">
              {{ formatPercent(row.dailyChangePercent) }}
            </p>
          </div>

          <div class="mt-4 grid grid-cols-2 gap-3 text-[13px] sm:text-sm">
            <div>
              <p class="text-xs uppercase tracking-[0.18em] text-muted">Price</p>
              <p class="mt-1 font-medium text-text">{{ formatCurrency(row.currentPrice, currency) }}</p>
            </div>
            <div>
              <p class="text-xs uppercase tracking-[0.18em] text-muted">Value</p>
              <p class="mt-1 font-medium text-text">{{ formatCurrency(row.holdingsValue, currency) }}</p>
            </div>
            <div>
              <p class="text-xs uppercase tracking-[0.18em] text-muted">PnL</p>
              <p class="mt-1 font-medium" :class="toneClass(row.pnl)">
                {{ formatCurrency(row.pnl, currency) }}
              </p>
            </div>
            <div>
              <p class="text-xs uppercase tracking-[0.18em] text-muted">24h</p>
              <p class="mt-1 font-medium" :class="toneClass(row.dailyChangeValue)">
                {{ formatCurrency(row.dailyChangeValue, currency) }}
              </p>
            </div>
            <div>
              <p class="text-xs uppercase tracking-[0.18em] text-muted">Quantity</p>
              <p class="mt-1 font-medium text-text">{{ quantityFormatter.format(row.quantity) }}</p>
            </div>
            <div>
              <p class="text-xs uppercase tracking-[0.18em] text-muted">PnL %</p>
              <p class="mt-1 font-medium" :class="toneClass(row.pnlPercent)">{{ formatPercent(row.pnlPercent) }}</p>
            </div>
          </div>

          <div class="mt-3 space-y-1.5 rounded-xl border border-border/70 bg-slate-950/30 p-3 text-xs text-muted">
            <p>Tracked cost: {{ formatCurrency(row.costBasis, currency) }}</p>
            <p v-if="row.market">
              Market cap {{ formatCompactNumber(row.market.market_cap) }} / Volume {{ formatCompactNumber(row.market.total_volume) }}
            </p>
            <p v-else>Market data pending</p>
          </div>

          <div v-if="removable" class="mt-3">
            <button
              class="w-full rounded-xl border border-border px-3 py-2 text-xs uppercase tracking-[0.2em] text-muted transition hover:border-negative hover:text-negative"
              type="button"
              @click="emit('remove', row.id)"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
