<script setup lang="ts">
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip
} from 'chart.js'
import { Line } from 'vue-chartjs'
import type { ChartPoint } from '~/types'
import { transformPerformanceChart } from '~/utils/chartTransformers'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

const props = defineProps<{
  points: ChartPoint[]
  label?: string
}>()

const isCompact = ref(false)

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

const chartData = computed(() => {
  const data = transformPerformanceChart(props.points)
  data.datasets[0].label = props.label ?? 'Performance'
  return data
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index' as const,
    intersect: false
  },
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      displayColors: false
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        color: '#9CA3AF',
        maxRotation: 0,
        minRotation: 0,
        maxTicksLimit: isCompact.value ? 4 : 6
      }
    },
    y: {
      grid: {
        color: 'rgba(156, 163, 175, 0.12)'
      },
      ticks: {
        color: '#9CA3AF',
        maxTicksLimit: isCompact.value ? 4 : 6
      }
    }
  }
}))
</script>

<template>
  <div v-if="points.length" class="h-56 sm:h-72 lg:h-80">
    <Line :data="chartData" :options="chartOptions" />
  </div>

  <div v-else class="flex h-56 items-center justify-center text-sm text-muted sm:h-72 lg:h-80">
    No price history available yet.
  </div>
</template>
