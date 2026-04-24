<script setup lang="ts">
import type { CoinSearchResponse, CoinSearchResult, Currency, PortfolioAsset } from '~/types'
import { formatCurrency } from '~/utils/format'

interface SavePayload {
  asset: PortfolioAsset
  originalId?: string
}

const props = defineProps<{
  assets: PortfolioAsset[]
  currency: Currency
  editingAsset?: PortfolioAsset | null
}>()

const emit = defineEmits<{
  save: [payload: SavePayload]
  cancel: []
}>()

const { fetcher } = useApi()

const defaultPurchaseDate = () => new Date().toISOString().slice(0, 10)

const formCard = ref<HTMLElement | null>(null)
const query = ref('')
const results = ref<CoinSearchResult[]>([])
const pending = ref(false)
const errorMessage = ref('')
const selected = ref<CoinSearchResult | null>(null)
const selecting = ref(false)
const quantity = ref(1)
const avgBuy = ref(0)
const purchaseDate = ref(defaultPurchaseDate())
const assetType = ref<PortfolioAsset['type']>('spot')

const isEditing = computed(() => Boolean(props.editingAsset))
const hasSelectedCoin = computed(() => Boolean(selected.value))
const selectedImage = computed(() => selected.value?.thumb || selected.value?.large || props.editingAsset?.image || '')
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

  return props.assets.find((asset) => asset.id === selectedId && asset.id !== props.editingAsset?.id) ?? null
})
const actionLabel = computed(() => (isEditing.value ? 'Update asset' : 'Add to portfolio'))

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
  purchaseDate.value = defaultPurchaseDate()
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

watch(
  () => props.editingAsset,
  async (asset) => {
    errorMessage.value = ''
    results.value = []

    if (!asset) {
      resetForm()
      return
    }

    setSelectedCoin({
      id: asset.id,
      name: asset.name,
      symbol: asset.symbol,
      thumb: asset.image,
      large: asset.image,
      current_price: null
    })
    quantity.value = asset.quantity
    avgBuy.value = asset.avgBuy
    purchaseDate.value = asset.purchaseDate || defaultPurchaseDate()
    assetType.value = asset.type ?? 'spot'

    await nextTick()
    formCard.value?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  },
  { immediate: true }
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

  if (!purchaseDate.value) {
    errorMessage.value = 'Choose a purchase date before saving.'
    return
  }

  if (duplicateAsset.value) {
    errorMessage.value = `${duplicateAsset.value.name} is already in your portfolio. Use Edit instead.`
    return
  }

  emit('save', {
    originalId: props.editingAsset?.id,
    asset: {
      id: selected.value.id,
      name: selected.value.name,
      symbol: selected.value.symbol.toUpperCase(),
      image: selected.value.thumb || selected.value.large || props.editingAsset?.image,
      quantity: parsedQuantity,
      avgBuy: parsedAvgBuy,
      purchaseDate: purchaseDate.value,
      type: assetType.value,
      entry: assetType.value === 'futures' && props.editingAsset?.type === 'futures'
        ? props.editingAsset.entry
        : undefined,
      leverage: assetType.value === 'futures' && props.editingAsset?.type === 'futures'
        ? props.editingAsset.leverage
        : undefined
    }
  })

  if (!isEditing.value) {
    resetForm()
  }
}
</script>

<template>
  <div ref="formCard" class="card-shell p-6">
    <div class="flex items-start justify-between gap-4">
      <div>
        <p class="text-xs uppercase tracking-[0.3em] text-muted">
          {{ isEditing ? 'Edit Holding' : 'Search' }}
        </p>
        <h3 class="mt-2 text-xl font-semibold">
          {{ isEditing ? 'Update an asset' : 'Add an asset' }}
        </h3>
      </div>

      <span class="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.24em] text-muted">
        {{ isEditing ? 'Editing' : 'Cached API' }}
      </span>
    </div>

    <div class="mt-6 space-y-4">
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
        class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-slate-950/50 px-4 py-3"
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

      <div class="grid gap-4 md:grid-cols-4">
        <label class="space-y-2 text-sm text-muted">
          <span>Quantity</span>
          <input v-model.number="quantity" class="input-shell" min="0" step="any" type="number" />
        </label>

        <label class="space-y-2 text-sm text-muted">
          <span>Average Buy</span>
          <input v-model.number="avgBuy" class="input-shell" min="0" step="any" type="number" />
        </label>

        <label class="space-y-2 text-sm text-muted">
          <span>Purchase Date</span>
          <input v-model="purchaseDate" class="input-shell" type="date" />
        </label>

        <label class="space-y-2 text-sm text-muted">
          <span>Position Type</span>
          <select v-model="assetType" class="input-shell">
            <option value="spot">Spot</option>
            <option value="futures">Futures</option>
          </select>
        </label>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm text-muted">
          {{
            duplicateAsset
              ? `${duplicateAsset.name} is already tracked. Edit that row instead of creating a duplicate.`
              : selected && selected.current_price != null
                ? `Selected ${selected.name}. Current market price: ${formatCurrency(selected.current_price, currency)}.`
                : selected
                  ? `Selected ${selected.name}. Save quantity, average buy, and purchase date to your local portfolio.`
                  : 'Pick a coin, then save quantity, average buy, and purchase date to your local portfolio.'
          }}
        </p>

        <div class="flex flex-wrap items-center gap-3">
          <button
            v-if="isEditing"
            class="rounded-xl border border-border px-4 py-3 text-sm font-medium text-muted transition hover:border-border/70 hover:text-text"
            type="button"
            @click="emit('cancel')"
          >
            Cancel
          </button>

          <button
            class="rounded-xl bg-accent px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-500"
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
