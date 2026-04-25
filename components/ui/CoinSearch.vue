<script setup lang="ts">
import type { CoinSearchResponse, CoinSearchResult, Currency, PortfolioAsset } from '~/types'
import { formatCurrency } from '~/utils/format'

const props = defineProps<{
  assets: PortfolioAsset[]
  currency: Currency
}>()

const emit = defineEmits<{
  save: [asset: PortfolioAsset]
}>()

const { fetcher } = useApi()
const query = ref('')
const results = ref<CoinSearchResult[]>([])
const pending = ref(false)
const errorMessage = ref('')
const selected = ref<CoinSearchResult | null>(null)
const selecting = ref(false)
const quantity = ref(1)
const avgBuy = ref(0)
const assetType = ref<PortfolioAsset['type']>('spot')

const hasSelectedCoin = computed(() => Boolean(selected.value))
const selectedImage = computed(() => selected.value?.thumb || selected.value?.large || '')
const searchPlaceholder = computed(() => (
  hasSelectedCoin.value
    ? 'Selected coin locked. Use Change coin to search again.'
    : 'Search coin...'
))
const duplicateAsset = computed(() => {
  const selectedId = selected.value?.id

  if (!selectedId) {
    return null
  }

  return props.assets.find((asset) => asset.id === selectedId) ?? null
})
const actionLabel = computed(() => (duplicateAsset.value ? 'Replace holding' : 'Add holding'))

const setSelectedCoin = (coin: CoinSearchResult) => {
  selecting.value = true
  selected.value = coin
  query.value = `${coin.name} (${coin.symbol.toUpperCase()})`
  results.value = []
}

const clearSelectedCoin = () => {
  selected.value = null
  query.value = ''
  results.value = []
  errorMessage.value = ''
}

const resetForm = () => {
  query.value = ''
  results.value = []
  pending.value = false
  selected.value = null
  quantity.value = 1
  avgBuy.value = 0
  assetType.value = 'spot'
  errorMessage.value = ''
}

watch(
  [query, () => props.currency],
  ([value], _, onCleanup) => {
    if (selecting.value) {
      selecting.value = false
      return
    }

    selected.value = null
    errorMessage.value = ''

    if (!value.trim()) {
      results.value = []
      pending.value = false
      return
    }

    const activeQuery = value.trim()

    const timeoutId = setTimeout(async () => {
      pending.value = true

      try {
        const response = await fetcher<CoinSearchResponse>('search', {
          query: activeQuery,
          currency: props.currency
        })

        if (query.value.trim() === activeQuery) {
          results.value = response.coins.slice(0, 6)
        }
      } catch (error) {
        console.error(error)
        errorMessage.value = 'Search failed. Please try again.'
      } finally {
        pending.value = false
      }
    }, 300)

    onCleanup(() => {
      clearTimeout(timeoutId)
    })
  },
  { flush: 'post' }
)

const submitAsset = () => {
  const parsedQuantity = Number(quantity.value)
  const parsedAvgBuy = Number(avgBuy.value)

  if (!selected.value) {
    errorMessage.value = 'Choose a coin before saving.'
    return
  }

  if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
    errorMessage.value = 'Choose a coin and enter a quantity greater than zero.'
    return
  }

  if (!Number.isFinite(parsedAvgBuy) || parsedAvgBuy < 0) {
    errorMessage.value = 'Average buy price must be zero or greater.'
    return
  }

  emit('save', {
    id: selected.value.id,
    name: selected.value.name,
    symbol: selected.value.symbol.toUpperCase(),
    image: selected.value.thumb || selected.value.large,
    quantity: parsedQuantity,
    avgBuy: parsedAvgBuy,
    type: assetType.value
  })

  resetForm()
}
</script>

<template>
  <div class="card-shell p-6 lg:p-8">
    <div class="flex items-start justify-between gap-4">
      <div>
        <p class="text-xs uppercase tracking-[0.3em] text-muted">Search</p>
        <h3 class="mt-2 text-xl font-semibold">Add an asset</h3>
        <p class="mt-3 max-w-2xl text-sm leading-7 text-muted">
          Search by coin name, choose the exact asset, then capture quantity and average buy in one pass.
        </p>
      </div>

      <span class="rounded-full border border-border/80 px-3 py-1 text-xs uppercase tracking-[0.24em] text-muted">
        Cached API
      </span>
    </div>

    <div class="mt-8 space-y-6">
      <div class="relative">
        <input
          v-model="query"
          class="input-shell"
          :placeholder="searchPlaceholder"
          :readonly="hasSelectedCoin"
          type="text"
        />

        <div
          v-if="!hasSelectedCoin && (pending || results.length)"
          class="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-10 rounded-2xl border border-border bg-slate-950/95 p-2 shadow-2xl"
        >
          <p v-if="pending" class="px-3 py-2 text-sm text-muted">Searching...</p>

          <button
            v-for="coin in results"
            :key="coin.id"
            class="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-slate-900"
            type="button"
            @click="setSelectedCoin(coin)"
          >
            <span class="flex items-center gap-3">
              <img
                v-if="coin.thumb || coin.large"
                :src="coin.thumb || coin.large"
                :alt="coin.name"
                class="h-10 w-10 rounded-full bg-slate-900 object-cover"
                loading="lazy"
              />
              <span class="text-left">
                <span class="block font-medium text-text">{{ coin.name }}</span>
                <span class="text-xs uppercase tracking-[0.2em] text-muted">{{ coin.symbol }}</span>
              </span>
            </span>
            <span class="text-right text-xs text-muted">
              <span v-if="coin.current_price != null" class="block">
                {{ formatCurrency(coin.current_price, currency) }}
              </span>
              <span class="block">#{{ coin.market_cap_rank ?? 'n/a' }}</span>
            </span>
          </button>
        </div>
      </div>

      <div
        v-if="selected"
        class="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border/80 bg-slate-950/35 px-4 py-4"
      >
        <div class="flex items-center gap-3">
          <img
            v-if="selectedImage"
            :src="selectedImage"
            :alt="selected.name"
            class="h-11 w-11 rounded-full bg-slate-900 object-cover"
          />
          <div>
            <p class="font-medium text-text">{{ selected.name }}</p>
            <p class="text-xs uppercase tracking-[0.2em] text-muted">{{ selected.symbol }}</p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <p v-if="selected.current_price != null" class="text-sm text-muted">
            {{ formatCurrency(selected.current_price, currency) }}
          </p>
          <button
            class="rounded-lg border border-border px-3 py-2 text-xs uppercase tracking-[0.2em] text-muted transition hover:border-accent hover:text-text"
            type="button"
            @click="clearSelectedCoin"
          >
            Change coin
          </button>
        </div>
      </div>

      <div class="grid gap-4 border-t border-border/60 pt-6 sm:grid-cols-2 xl:grid-cols-3">
        <label class="space-y-2 text-sm text-muted">
          <span>Quantity</span>
          <input v-model.number="quantity" class="input-shell" min="0" step="any" type="number" />
        </label>

        <label class="space-y-2 text-sm text-muted">
          <span>Average Buy</span>
          <input v-model.number="avgBuy" class="input-shell" min="0" step="any" type="number" />
        </label>

        <label class="space-y-2 text-sm text-muted">
          <span>Position Type</span>
          <select v-model="assetType" class="input-shell">
            <option value="spot">Spot</option>
            <option value="futures">Futures</option>
          </select>
        </label>
      </div>

      <div class="flex flex-col gap-4 border-t border-border/60 pt-6 lg:flex-row lg:items-end lg:justify-between">
        <p class="max-w-2xl text-sm leading-7 text-muted">
          {{
            duplicateAsset
              ? `${duplicateAsset.name} is already tracked. Saving again will replace its stored quantity and average buy.`
              : selected && selected.current_price != null
                ? `Selected ${selected.name}. Current market price: ${formatCurrency(selected.current_price, currency)}.`
                : selected
                  ? `Selected ${selected.name}. Save quantity and average buy to your local portfolio.`
                  : 'Pick a coin, then save quantity and average buy to your local portfolio.'
          }}
        </p>

        <div class="flex w-full flex-col gap-3 sm:flex-row sm:justify-end lg:w-auto">
          <button
            class="w-full rounded-xl bg-accent px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-500 sm:w-auto"
            type="button"
            @click="submitAsset"
          >
            {{ actionLabel }}
          </button>
        </div>
      </div>

      <p v-if="errorMessage" class="text-sm text-negative">{{ errorMessage }}</p>
    </div>
  </div>
</template>
