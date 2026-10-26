<script setup lang="ts">
defineProps<{ id: string; label: string }>()
const model = defineModel<boolean>({ required: true })
</script>

<template>
  <label :for="id" class="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
    <input
      :id="id"
      v-model="model"
      type="checkbox"
      class="h-4 w-4 rounded border-gray-300 text-blue-700 focus:ring-blue-600"
    />
    {{ label }}
  </label>
</template>
