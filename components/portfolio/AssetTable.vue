<script setup lang="ts">
import type { Currency, PortfolioRow } from '~/types'
import { formatCompactNumber, formatCurrency, formatDate, formatPercent } from '~/utils/format'

defineProps<{
  rows: PortfolioRow[]
  currency: Currency
  loading?: boolean
  removable?: boolean
}>()

const emit = defineEmits<{
  edit: [id: string]
  remove: [id: string]
}>()

const toneClass = (value: number) => (value >= 0 ? 'text-positive' : 'text-negative')
const quantityFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 8
})
</script>

<template>
  <div class="card-shell overflow-hidden">
    <div class="flex items-center justify-between border-b border-border px-4 py-4">
      <div>
        <h3 class="text-sm font-semibold uppercase tracking-[0.24em] text-muted">Asset Table</h3>
        <p class="mt-1 text-sm text-muted">Price, holdings, and profit/loss at a glance.</p>
      </div>
    </div>

    <div v-if="loading" class="space-y-3 p-4">
      <div
        v-for="index in 4"
        :key="index"
        class="animate-pulse rounded-2xl border border-border p-4"
      >
        <div class="h-4 w-1/3 rounded bg-border"></div>
        <div class="mt-3 h-6 rounded bg-border"></div>
      </div>
    </div>

    <div v-else-if="!rows.length" class="p-6 text-sm text-muted">
      No holdings yet. Add a coin from the portfolio page to start tracking.
    </div>

    <template v-else>
      <div class="hidden overflow-x-auto md:block">
        <table class="min-w-[1080px] text-sm">
          <thead class="table-head">
            <tr>
              <th class="px-4 py-3">Coin</th>
              <th class="px-4 py-3">Symbol</th>
              <th class="px-4 py-3 text-right">Quantity</th>
              <th class="px-4 py-3">Price</th>
              <th class="px-4 py-3">Avg Buy</th>
              <th class="px-4 py-3">Current Value</th>
              <th class="px-4 py-3">PnL</th>
              <th class="px-4 py-3">24h Change</th>
              <th v-if="removable" class="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="row in rows"
              :key="row.id"
              class="border-t border-border/80 transition hover:bg-slate-900/60"
            >
              <td class="px-4 py-4">
                <NuxtLink :to="`/coins/${row.id}`" class="flex items-center gap-3">
                  <img
                    :src="row.market?.image || row.image"
                    :alt="row.name"
                    class="h-9 w-9 rounded-full bg-slate-950/80"
                  />
                  <div>
                    <p class="font-medium text-text">{{ row.name }}</p>
                    <p class="text-xs uppercase tracking-[0.2em] text-muted">{{ row.symbol }}</p>
                  </div>
                </NuxtLink>
              </td>
              <td class="px-4 py-4">
                <span class="font-mono text-xs uppercase tracking-[0.2em] text-muted">{{ row.symbol }}</span>
              </td>
              <td class="px-4 py-4 text-right font-mono text-text">
                {{ quantityFormatter.format(row.quantity) }}
              </td>
              <td class="px-4 py-4">
                <p class="font-mono">{{ formatCurrency(row.currentPrice, currency) }}</p>
                <p v-if="row.market" class="text-xs text-muted">
                  MC {{ formatCompactNumber(row.market.market_cap) }} / Vol {{ formatCompactNumber(row.market.total_volume) }}
                </p>
                <p v-else class="text-xs text-muted">Market data pending</p>
              </td>
              <td class="px-4 py-4">
                <p class="font-medium text-text">{{ formatCurrency(row.avgBuy, currency) }}</p>
                <p class="text-xs text-muted">{{ formatDate(row.purchaseDate) }}</p>
              </td>
              <td class="px-4 py-4">
                <p class="font-medium text-text">{{ formatCurrency(row.holdingsValue, currency) }}</p>
                <p class="text-xs text-muted">Cost {{ formatCurrency(row.costBasis, currency) }}</p>
              </td>
              <td class="px-4 py-4">
                <p class="font-medium" :class="toneClass(row.pnl)">
                  {{ formatCurrency(row.pnl, currency) }}
                </p>
                <p class="text-xs" :class="toneClass(row.pnl)">
                  {{ formatPercent(row.pnlPercent) }}
                </p>
              </td>
              <td class="px-4 py-4">
                <p class="font-medium" :class="toneClass(row.dailyChangeValue)">
                  {{ formatCurrency(row.dailyChangeValue, currency) }}
                </p>
                <p class="text-xs" :class="toneClass(row.dailyChangePercent)">
                  {{ formatPercent(row.dailyChangePercent) }}
                </p>
              </td>
              <td v-if="removable" class="px-4 py-4 text-right">
                <div class="flex justify-end gap-2">
                  <button
                    class="rounded-lg border border-border px-3 py-2 text-xs uppercase tracking-[0.2em] text-muted transition hover:border-accent hover:text-text"
                    type="button"
                    @click="emit('edit', row.id)"
                  >
                    Edit
                  </button>
                  <button
                    class="rounded-lg border border-border px-3 py-2 text-xs uppercase tracking-[0.2em] text-muted transition hover:border-negative hover:text-negative"
                    type="button"
                    @click="emit('remove', row.id)"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="space-y-3 p-4 md:hidden">
        <div
          v-for="row in rows"
          :key="row.id"
          class="rounded-2xl border border-border bg-slate-950/40 p-4"
        >
          <div class="flex items-start justify-between gap-3">
            <NuxtLink :to="`/coins/${row.id}`" class="flex items-center gap-3">
              <img
                :src="row.market?.image || row.image"
                :alt="row.name"
                class="h-10 w-10 rounded-full bg-slate-950/80"
              />
              <div>
                <p class="font-medium text-text">{{ row.name }}</p>
                <p class="text-xs uppercase tracking-[0.2em] text-muted">{{ row.symbol }}</p>
              </div>
            </NuxtLink>

            <button
              v-if="removable"
              class="text-xs uppercase tracking-[0.2em] text-muted transition hover:text-negative"
              type="button"
              @click="emit('edit', row.id)"
            >
              Edit
            </button>
          </div>

          <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p class="text-muted">Symbol</p>
              <p class="mt-1 font-medium text-text">{{ row.symbol }}</p>
            </div>
            <div>
              <p class="text-muted">Quantity</p>
              <p class="mt-1 font-medium text-text">{{ quantityFormatter.format(row.quantity) }}</p>
            </div>
            <div>
              <p class="text-muted">Price</p>
              <p class="mt-1 font-medium text-text">{{ formatCurrency(row.currentPrice, currency) }}</p>
            </div>
            <div>
              <p class="text-muted">Avg Buy</p>
              <p class="mt-1 font-medium text-text">{{ formatCurrency(row.avgBuy, currency) }}</p>
            </div>
            <div>
              <p class="text-muted">Current Value</p>
              <p class="mt-1 font-medium text-text">{{ formatCurrency(row.holdingsValue, currency) }}</p>
            </div>
            <div>
              <p class="text-muted">24h Change</p>
              <p class="mt-1 font-medium" :class="toneClass(row.dailyChangeValue)">
                {{ formatCurrency(row.dailyChangeValue, currency) }}
              </p>
            </div>
            <div>
              <p class="text-muted">PnL</p>
              <p class="mt-1 font-medium" :class="toneClass(row.pnl)">
                {{ formatCurrency(row.pnl, currency) }}
              </p>
            </div>
            <div>
              <p class="text-muted">PnL %</p>
              <p class="mt-1 font-medium" :class="toneClass(row.pnlPercent)">{{ formatPercent(row.pnlPercent) }}</p>
            </div>
          </div>

          <div class="mt-4 space-y-2 rounded-2xl border border-border/70 bg-slate-950/40 p-3 text-xs text-muted">
            <p>Purchase date: {{ formatDate(row.purchaseDate) }}</p>
            <p v-if="row.market">
              Market cap {{ formatCompactNumber(row.market.market_cap) }} / Volume {{ formatCompactNumber(row.market.total_volume) }}
            </p>
            <p v-else>Market data pending</p>
          </div>

          <div v-if="removable" class="mt-4 flex gap-2">
            <button
              class="flex-1 rounded-lg border border-border px-3 py-2 text-xs uppercase tracking-[0.2em] text-muted transition hover:border-accent hover:text-text"
              type="button"
              @click="emit('edit', row.id)"
            >
              Edit
            </button>
            <button
              class="flex-1 rounded-lg border border-border px-3 py-2 text-xs uppercase tracking-[0.2em] text-muted transition hover:border-negative hover:text-negative"
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
