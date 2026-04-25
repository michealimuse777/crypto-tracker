<script setup lang="ts">
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js'
import { Pie } from 'vue-chartjs'
import type { PortfolioRow } from '~/types'
import { getAssetConfig } from '~/utils/assetConfig'
import { transformAllocationChart } from '~/utils/chartTransformers'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps<{
  rows: PortfolioRow[]
}>()

const isCompact = ref(false)
const allocationFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1
})

let mediaQuery: MediaQueryList | null = null
let handleMediaQueryChange: ((event: MediaQueryListEvent) => void) | null = null

onMounted(() => {
  mediaQuery = window.matchMedia('(max-width: 640px)')
  isCompact.value = mediaQuery.matches

  handleMediaQueryChange = (event: MediaQueryListEvent) => {
    isCompact.value = event.matches
  }

  mediaQuery.addEventListener('change', handleMediaQueryChange)
})

onBeforeUnmount(() => {
  if (mediaQuery && handleMediaQueryChange) {
    mediaQuery.removeEventListener('change', handleMediaQueryChange)
  }
})

const chartData = computed(() => transformAllocationChart(props.rows))

const legendItems = computed(() => {
  const totalValue = props.rows.reduce((sum, row) => sum + row.holdingsValue, 0)

  return props.rows
    .filter((row) => row.holdingsValue > 0)
    .sort((left, right) => right.holdingsValue - left.holdingsValue)
    .map((row) => ({
      id: row.id,
      name: row.name,
      symbol: row.symbol,
      color: getAssetConfig(row.id).color,
      allocation: totalValue > 0 ? allocationFormatter.format((row.holdingsValue / totalValue) * 100) : '0.0'
    }))
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  radius: isCompact.value ? '72%' : '82%',
  layout: {
    padding: isCompact.value ? 8 : 12
  },
  plugins: {
    legend: {
      display: false
    }
  }
}))
</script>

<template>
  <div v-if="rows.length" class="space-y-4">
    <div class="h-56 sm:h-72 lg:h-80">
      <Pie :data="chartData" :options="chartOptions" />
    </div>

    <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <div
        v-for="item in legendItems"
        :key="item.id"
        class="rounded-xl border border-border/70 bg-slate-950/35 px-3 py-2.5"
      >
        <div class="flex items-center gap-2">
          <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ backgroundColor: item.color }" />
          <p class="truncate text-sm font-medium text-text">{{ item.name }}</p>
        </div>
        <p class="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
          {{ item.symbol }} • {{ item.allocation }}%
        </p>
      </div>
    </div>
  </div>

  <div v-else class="flex h-56 items-center justify-center text-sm text-muted sm:h-72 lg:h-80">
    Add assets to see allocation.
  </div>
</template>
