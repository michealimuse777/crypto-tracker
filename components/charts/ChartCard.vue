<template>
  <div class="card-shell p-4 sm:p-5">
    <div class="mb-4 flex items-center justify-between gap-3">
      <div>
        <p class="text-[11px] uppercase tracking-[0.24em] text-muted">
          <slot name="eyebrow">Analytics</slot>
        </p>
        <h3 class="mt-2 text-base font-semibold sm:text-lg">
          <slot name="title" />
        </h3>
      </div>

      <slot name="action" />
    </div>

    <slot />
  </div>
</template>
