<template>
  <div class="card-shell p-5">
    <div class="mb-4 flex items-center justify-between gap-3">
      <div>
        <p class="text-xs uppercase tracking-[0.24em] text-muted">
          <slot name="eyebrow">Analytics</slot>
        </p>
        <h3 class="mt-2 text-lg font-semibold">
          <slot name="title" />
        </h3>
      </div>

      <slot name="action" />
    </div>

    <slot />
  </div>
</template>
