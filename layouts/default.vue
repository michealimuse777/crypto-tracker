<template>
  <div class="min-h-screen overflow-x-hidden bg-bg text-text">
    <Sidebar />

    <div class="min-h-screen lg:pl-60">
      <Topbar />

      <main class="overflow-x-hidden px-3 py-4 sm:px-5 sm:py-5 lg:px-8 lg:py-6">
        <div class="mr-auto w-full max-w-[1500px]">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
