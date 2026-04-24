<script setup lang="ts">
const route = useRoute()

const navItems = [
  { label: 'Dashboard', to: '/' },
  { label: 'Portfolio', to: '/portfolio' }
]

const linkClass = (to: string) =>
  route.path === to
    ? 'bg-accent text-white'
    : 'text-muted hover:bg-slate-900/80 hover:text-text'
</script>

<template>
  <aside class="hidden w-72 shrink-0 border-r border-border bg-slate-950/60 px-4 py-6 lg:block">
    <div class="mb-8">
      <p class="text-xs uppercase tracking-[0.32em] text-muted">Tracker</p>
      <h1 class="mt-2 text-2xl font-semibold">CryptoTrack</h1>
      <p class="mt-3 max-w-xs text-sm leading-6 text-muted">
        Clean portfolio analytics backed by a cached server API layer.
      </p>
    </div>

    <nav class="space-y-2">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="block rounded-xl px-3 py-2.5 text-sm transition"
        :class="linkClass(item.to)"
      >
        {{ item.label }}
      </NuxtLink>
    </nav>
  </aside>
</template>
