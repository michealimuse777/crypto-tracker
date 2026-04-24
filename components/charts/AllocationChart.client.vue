<script setup lang="ts">
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js'
import { Pie } from 'vue-chartjs'
import type { PortfolioRow } from '~/types'
import { transformAllocationChart } from '~/utils/chartTransformers'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps<{
  rows: PortfolioRow[]
}>()

const chartData = computed(() => transformAllocationChart(props.rows))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        color: '#E5E7EB',
        usePointStyle: true,
        boxWidth: 8,
        padding: 18
      }
    }
  }
}
</script>

<template>
  <div v-if="rows.length" class="h-80">
    <Pie :data="chartData" :options="chartOptions" />
  </div>

  <div v-else class="flex h-80 items-center justify-center text-sm text-muted">
    Add assets to see allocation.
  </div>
</template>
