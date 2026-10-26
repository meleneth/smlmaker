<script setup lang="ts">
defineProps<{ title: string; description?: string }>()
</script>

<template>
  <section
    class="space-y-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
  >
    <header>
      <h2 class="text-xl font-bold text-gray-900 dark:text-white">{{ title }}</h2>
      <p v-if="description" class="text-sm text-gray-600 dark:text-gray-300">{{ description }}</p>
    </header>
    <slot />
  </section>
</template>
