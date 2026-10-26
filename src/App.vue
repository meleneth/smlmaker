<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <div
      class="sticky top-0 z-10 w-full border-b border-gray-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-900/95"
    >
      <header>
        <nav class="flex flex-wrap items-center justify-center">
          <RouterLink class="rounded px-2.5 py-2 text-sm" to="/">Home</RouterLink>
          <RouterLink class="rounded px-2.5 py-2 text-sm" to="/project">Project</RouterLink>
          <RouterLink class="rounded px-2.5 py-2 text-sm" to="/namespaces">Namespaces</RouterLink>
          <RouterLink class="rounded px-2.5 py-2 text-sm" to="/machines">Machines</RouterLink>
          <RouterLink class="rounded px-2.5 py-2 text-sm" to="/events">Events</RouterLink>
          <RouterLink class="rounded px-2.5 py-2 text-sm" to="/types">Types</RouterLink>
          <RouterLink class="rounded px-2.5 py-2 text-sm" to="/libraries">Libraries</RouterLink>
          <RouterLink class="rounded px-2.5 py-2 text-sm" to="/build">Build</RouterLink>
        </nav>
      </header>
    </div>
    <div class="p-4">
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.router-link-active {
  background: rgb(219 234 254);
  color: rgb(29 78 216);
}
</style>
