<script setup lang="ts">
import type { PortfolioAsset } from '~/types'
import { buildPortfolioRows, summarizePortfolio } from '~/utils/calculations'
import { formatCurrency } from '~/utils/format'

interface SavePayload {
  asset: PortfolioAsset
  originalId?: string
}

const { assets, currency, saveAsset, removeAsset } = usePortfolio()

const { data: markets, pending, error, refresh, liveStatus } = useHybridMarkets(
  assets,
  { currency }
)

const editingAssetId = ref<string | null>(null)
const rows = computed(() => buildPortfolioRows(assets.value, markets.value))
const summary = computed(() => summarizePortfolio(rows.value))
const editingAsset = computed(() => assets.value.find((asset) => asset.id === editingAssetId.value) ?? null)
const liveBadgeClass = computed(() =>
  liveStatus.value.state === 'open'
    ? 'border-positive/30 bg-positive/10 text-positive'
    : 'border-border text-muted'
)
const liveBadgeLabel = computed(() => {
  if (!assets.value.length) {
    return 'Polling Ready'
  }

  if (!liveStatus.value.enabled) {
    return 'Polling Only'
  }

  if (liveStatus.value.state === 'open') {
    return `Live ${liveStatus.value.liveAssets}/${liveStatus.value.totalAssets}`
  }

  if (liveStatus.value.state === 'connecting' || liveStatus.value.state === 'reconnecting') {
    return 'Connecting Live'
  }

  return 'Fallback Active'
})

const handleSave = ({ asset, originalId }: SavePayload) => {
  saveAsset(asset, originalId)
  editingAssetId.value = null
}

const handleEdit = (id: string) => {
  editingAssetId.value = id
}

const handleRemove = (id: string) => {
  if (editingAssetId.value === id) {
    editingAssetId.value = null
  }

  removeAsset(id)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="text-xs uppercase tracking-[0.3em] text-muted">Workspace</p>
        <h1 class="mt-2 text-3xl font-semibold">Portfolio builder</h1>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <span
          class="rounded-full border px-3 py-2 text-xs uppercase tracking-[0.24em]"
          :class="liveBadgeClass"
        >
          {{ liveBadgeLabel }}
        </span>

        <button
          class="rounded-xl border border-border px-4 py-3 text-sm font-medium text-muted transition hover:border-accent hover:text-text"
          type="button"
          @click="refresh"
        >
          Refresh prices
        </button>
      </div>
    </div>

    <div class="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
      <CoinSearch
        :assets="assets"
        :currency="currency"
        :editing-asset="editingAsset"
        @save="handleSave"
        @cancel="editingAssetId = null"
      />

      <div class="card-shell p-6">
        <p class="text-xs uppercase tracking-[0.3em] text-muted">Snapshot</p>
        <h2 class="mt-2 text-2xl font-semibold">Current totals</h2>

        <div class="mt-6 space-y-4">
          <div class="rounded-2xl border border-border bg-slate-950/50 p-4">
            <p class="text-sm text-muted">Tracked value</p>
            <p class="mt-2 text-2xl font-semibold">
              {{ formatCurrency(summary.totalValue, currency) }}
            </p>
          </div>

          <div class="rounded-2xl border border-border bg-slate-950/50 p-4">
            <p class="text-sm text-muted">Total PnL</p>
            <p
              class="mt-2 text-2xl font-semibold"
              :class="summary.totalPnl >= 0 ? 'text-positive' : 'text-negative'"
            >
              {{ formatCurrency(summary.totalPnl, currency) }}
            </p>
          </div>

          <p class="text-sm leading-7 text-muted">
            This page stores holdings in localStorage, keeps CoinGecko polling as the baseline, and layers Binance global live prices on top when USD mode is active.
          </p>
        </div>
      </div>
    </div>

    <p v-if="error" class="rounded-xl border border-negative/40 bg-negative/10 px-4 py-3 text-sm text-negative">
      Price refresh failed. Check your CoinGecko env config or try again.
    </p>

    <AssetTable
      :rows="rows"
        :currency="currency"
        :loading="pending"
        removable
        @edit="handleEdit"
        @remove="handleRemove"
      />
  </div>
</template>
