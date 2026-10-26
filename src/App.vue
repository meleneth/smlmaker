<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="relative">
    <div class="fixed top-0 left-0 w-full z-10 p-4 shadow-md">
      <header>
        <nav class="flex flex-wrap items-center justify-center">
          <RouterLink class="p-2.5" to="/">Home</RouterLink>
          <RouterLink class="p-2.5" to="/project">Project</RouterLink>
          <RouterLink class="p-2.5" to="/machines">Machines</RouterLink>
          <RouterLink class="p-2.5" to="/types">Types</RouterLink>
          <RouterLink class="p-2.5" to="/build">Build</RouterLink>
        </nav>
      </header>
    </div>
    <div class="mt-16 p-4">
      <RouterView />
    </div>
  </div>
</template>
