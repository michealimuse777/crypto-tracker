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
  <div class="card-shell p-4 sm:p-5">
    <p class="text-[11px] uppercase tracking-[0.28em] text-muted">{{ title }}</p>
    <div class="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <p class="min-w-0 text-xl font-semibold leading-tight sm:text-2xl">{{ value }}</p>
      <p class="max-w-full text-sm font-medium leading-tight break-all sm:text-right" :class="toneClass">
        {{ formatPercent(change) }}
      </p>
    </div>
    <p v-if="helper" class="mt-2 text-xs leading-5 text-muted">{{ helper }}</p>
  </div>
</template>
