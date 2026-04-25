<script setup lang="ts">
const route = useRoute()
const isSidebarOpen = useState('ui:sidebar-open', () => false)

const navItems = [
  { label: 'Dashboard', to: '/', icon: 'dashboard' },
  { label: 'Portfolio', to: '/portfolio', icon: 'portfolio' }
]

watch(
  () => route.path,
  () => {
    isSidebarOpen.value = false
  }
)

const linkClass = (to: string) =>
  route.path === to
    ? 'border-accent/40 bg-accent/10 text-text shadow-[0_18px_40px_-30px_rgba(59,130,246,0.9)]'
    : 'border-transparent text-muted hover:border-border/90 hover:bg-slate-900/80 hover:text-text'
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
      class="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[86vw] flex-col border-r border-border/80 bg-slate-950/95 px-3 py-4 shadow-2xl transition-transform duration-200 ease-out lg:w-60 lg:bg-slate-950/72 lg:shadow-none"
      :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="flex min-w-0 items-center gap-3">
          <div class="flex h-11 w-11 items-center justify-center rounded-xl border border-accent/25 bg-accent/10 text-accent">
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M4 13.5L8 9.5L11 12.5L16 7.5" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M12.5 7.5H16V11" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>

          <div class="min-w-0">
            <p class="text-[10px] uppercase tracking-[0.34em] text-accent/80">Portfolio Tracker</p>
            <h1 class="truncate text-lg font-semibold">CryptoTrack</h1>
          </div>
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
          class="flex items-center gap-3 rounded-xl border px-3 py-3 text-sm font-medium transition"
          :class="linkClass(item.to)"
        >
          <span
            class="flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-slate-950/70"
            :class="route.path === item.to ? 'text-accent border-accent/20 bg-accent/10' : 'text-muted'"
          >
            <svg
              v-if="item.icon === 'dashboard'"
              class="h-4 w-4"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            >
              <path d="M4 12.5L8.5 8L11.5 11L16 6.5" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M12.5 6.5H16V10" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <svg
              v-else
              class="h-4 w-4"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            >
              <path d="M6 7.5H14" stroke-linecap="round" />
              <path d="M5.5 7.5H4.75C4.336 7.5 4 7.836 4 8.25V13.5C4 13.914 4.336 14.25 4.75 14.25H15.25C15.664 14.25 16 13.914 16 13.5V8.25C16 7.836 15.664 7.5 15.25 7.5H14.5" stroke-linecap="round" />
              <path d="M7.25 7.5V6.5C7.25 5.948 7.698 5.5 8.25 5.5H11.75C12.302 5.5 12.75 5.948 12.75 6.5V7.5" stroke-linecap="round" />
            </svg>
          </span>
          <span class="flex-1">{{ item.label }}</span>
          <span
            v-if="route.path === item.to"
            class="h-2 w-2 rounded-full bg-accent shadow-[0_0_18px_rgba(59,130,246,0.9)]"
          />
        </NuxtLink>
      </nav>

      <div class="mt-auto flex items-center justify-between border-t border-border/80 px-1 pt-4 text-[11px] uppercase tracking-[0.24em] text-muted">
        <span>v1.0</span>
        <span>synced</span>
      </div>
    </aside>
  </div>
</template>
