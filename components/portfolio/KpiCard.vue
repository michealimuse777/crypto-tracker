<script setup lang="ts">
import { formatPercent } from '~/utils/format'

const props = defineProps<{
  title: string
  value: string
  change: number
  helper?: string
}>()

const toneClass = computed(() => (props.change >= 0 ? 'text-positive' : 'text-negative'))
</script>

<template>
  <div class="card-shell p-6">
    <p class="text-xs uppercase tracking-[0.28em] text-muted">{{ title }}</p>
    <div class="mt-4 text-3xl font-semibold">{{ value }}</div>
    <div class="mt-3 flex items-center justify-between gap-3">
      <p class="text-sm font-medium" :class="toneClass">{{ formatPercent(change) }}</p>
      <p v-if="helper" class="text-right text-xs text-muted">{{ helper }}</p>
    </div>
  </div>
</template>
