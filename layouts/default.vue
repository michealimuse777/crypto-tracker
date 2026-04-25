<template>
  <div class="min-h-screen overflow-x-hidden bg-bg text-text">
    <Sidebar />

    <div class="min-h-screen lg:pl-56">
      <Topbar />

      <main class="overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
        <div class="mr-auto w-full max-w-[1500px]">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
