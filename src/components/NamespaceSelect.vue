<script setup lang="ts">
import { useProjectStore } from '@/stores/project'

const project_store = useProjectStore()

const model = defineModel()
</script>

<template>
  <select
    v-model="model"
    class="w-48 px-3 inline-block py-2 border rounded-md bg-yellow-200 text-gray-900 dark:bg-yellow-200 dark:text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-yellow-600"
  >
    <option v-for="choice in project_store.project.namespaces" :key="choice" :value="choice">
      {{ choice }}
    </option>
  </select>
</template>

<style scoped>
/* Additional Tailwind styles if needed */
</style>
