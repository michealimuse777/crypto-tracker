<template>
  <div class="min-h-screen bg-bg text-text">
    <div class="flex min-h-screen">
      <Sidebar />

      <div class="flex min-w-0 flex-1 flex-col">
        <Topbar />

        <main class="flex-1 overflow-y-auto px-4 py-6 md:px-6">
          <slot />
        </main>
      </div>
    </div>
  </div>
</template>
