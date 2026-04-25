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
  <div class="card-shell p-6">
    <div class="flex items-center justify-between gap-3">
      <div>
        <p class="text-xs uppercase tracking-[0.3em] text-muted">Market Movers</p>
        <h3 class="mt-2 text-lg font-medium">{{ title }}</h3>
      </div>
      <span class="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.24em] text-muted">
        {{ rows.length }} assets
      </span>
    </div>

    <div v-if="rows.length" class="mt-6 space-y-3">
      <NuxtLink
        v-for="row in rows"
        :key="row.id"
        :to="`/coins/${row.id}`"
        class="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-slate-950/40 px-4 py-3 transition hover:border-accent/50 hover:bg-slate-950/70"
      >
        <div class="min-w-0">
          <p class="truncate font-medium text-text">{{ row.name }}</p>
          <p class="text-xs uppercase tracking-[0.2em] text-muted">{{ row.symbol }}</p>
        </div>

        <div class="text-right">
          <p class="text-sm text-muted">{{ formatCurrency(row.currentPrice, currency) }}</p>
          <p class="font-medium" :class="toneClass(row.dailyChangeValue)">
            {{ formatCurrency(row.dailyChangeValue, currency) }}
          </p>
          <p class="text-xs" :class="toneClass(row.dailyChangePercent)">
            {{ formatPercent(row.dailyChangePercent) }}
          </p>
        </div>
      </NuxtLink>
    </div>

    <div v-else class="mt-6 rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted">
      {{ emptyLabel }}
    </div>
  </div>
</template>
