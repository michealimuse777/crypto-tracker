<script setup lang="ts">
import type { Currency, PortfolioRow } from '~/types'
import { formatCurrency, formatPercent } from '~/utils/format'

const props = defineProps<{
  title: string
  rows: PortfolioRow[]
  currency: Currency
  emptyLabel: string
}>()

const toneClass = (value: number) => (value >= 0 ? 'text-positive' : 'text-negative')
</script>

<template>
  <div class="card-shell p-4 sm:p-5">
    <div class="flex items-center justify-between gap-3">
      <div>
        <p class="text-[11px] uppercase tracking-[0.3em] text-muted">Market Movers</p>
        <h3 class="mt-2 text-base font-semibold sm:text-lg">{{ title }}</h3>
      </div>
      <span class="status-pill border-border/80 text-muted">
        {{ rows.length }} assets
      </span>
    </div>

    <div v-if="rows.length" class="mt-4 space-y-2.5">
      <NuxtLink
        v-for="row in rows"
        :key="row.id"
        :to="`/coins/${row.id}`"
        class="flex items-center justify-between gap-4 rounded-xl border border-border/70 bg-slate-950/40 px-3.5 py-3 transition hover:border-accent/50 hover:bg-slate-950/70"
      >
        <div class="min-w-0">
          <p class="truncate font-medium text-text">{{ row.name }}</p>
          <p class="text-xs uppercase tracking-[0.2em] text-muted">{{ row.symbol }}</p>
        </div>

        <div class="text-right">
          <p class="text-sm text-muted">{{ formatCurrency(row.currentPrice, currency) }}</p>
          <p class="text-sm font-medium" :class="toneClass(row.dailyChangeValue)">
            {{ formatCurrency(row.dailyChangeValue, currency) }}
          </p>
          <p class="text-xs" :class="toneClass(row.dailyChangePercent)">
            {{ formatPercent(row.dailyChangePercent) }}
          </p>
        </div>
      </NuxtLink>
    </div>

    <div v-else class="mt-4 rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted">
      {{ emptyLabel }}
    </div>
  </div>
</template>
