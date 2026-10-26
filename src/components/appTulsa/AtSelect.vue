<script setup lang="ts">
export interface SelectOption {
  label: string
  value: string | number
}

defineProps<{
  id: string
  label: string
  options: SelectOption[]
  placeholder?: string
}>()
const model = defineModel<string | number>({ required: true })
</script>

<template>
  <label :for="id" class="block text-sm font-medium text-gray-800 dark:text-gray-200">
    <span class="mb-1 block">{{ label }}</span>
    <select
      :id="id"
      v-model="model"
      class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
    >
      <option v-if="placeholder" disabled value="">{{ placeholder }}</option>
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </label>
</template>
