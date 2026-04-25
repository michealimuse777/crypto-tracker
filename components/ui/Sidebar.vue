<script setup lang="ts">
const route = useRoute()
const isSidebarOpen = useState('ui:sidebar-open', () => false)

const navItems = [
  { label: 'Dashboard', to: '/' },
  { label: 'Portfolio', to: '/portfolio' }
]

watch(
  () => route.path,
  () => {
    isSidebarOpen.value = false
  }
)

const linkClass = (to: string) =>
  route.path === to
    ? 'border-accent/50 bg-accent/15 text-text shadow-[0_16px_40px_-28px_rgba(59,130,246,0.9)]'
    : 'border-transparent text-muted hover:border-border hover:bg-slate-900/70 hover:text-text'
</script>

<template>
  <div>
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <button
        v-if="isSidebarOpen"
        class="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden"
        type="button"
        aria-label="Close navigation"
        @click="isSidebarOpen = false"
      />
    </Transition>

    <aside
      class="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[86vw] flex-col border-r border-border/80 bg-slate-950/95 px-4 py-5 shadow-2xl transition-transform duration-200 ease-out lg:w-56 lg:bg-slate-950/70 lg:shadow-none"
      :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
    >
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-[11px] uppercase tracking-[0.32em] text-muted">Tracker</p>
          <h1 class="mt-2 text-xl font-semibold">CryptoTrack</h1>
          <p class="mt-3 max-w-[16rem] text-sm leading-6 text-muted">
            Market-aware portfolio analytics with cached server routes and live overlays.
          </p>
        </div>

        <button
          class="rounded-xl border border-border/80 p-2 text-muted transition hover:border-border hover:text-text lg:hidden"
          type="button"
          aria-label="Close navigation"
          @click="isSidebarOpen = false"
        >
          <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M5 5L15 15" stroke-linecap="round" />
            <path d="M15 5L5 15" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      <nav class="mt-8 space-y-2">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm font-medium transition"
          :class="linkClass(item.to)"
        >
          <span class="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900/80 text-[11px] uppercase tracking-[0.24em] text-muted">
            {{ item.label.slice(0, 1) }}
          </span>
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <div class="mt-auto rounded-2xl border border-border/70 bg-slate-950/55 p-4">
        <p class="text-[11px] uppercase tracking-[0.28em] text-muted">Navigation</p>
        <p class="mt-3 text-sm leading-6 text-muted">
          Use the dashboard for overview metrics, then switch to portfolio to add and tune holdings.
        </p>
      </div>
    </aside>
  </div>
</template>
