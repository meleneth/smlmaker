<script setup lang="ts">
withDefaults(
  defineProps<{
    id: string
    label: string
    placeholder?: string
    type?: 'text' | 'number'
  }>(),
  { placeholder: '', type: 'text' }
)
const model = defineModel<string | number>({ required: true })
defineEmits<{ submit: [] }>()
</script>

<template>
  <label :for="id" class="block text-sm font-medium text-gray-800 dark:text-gray-200">
    <span class="mb-1 block">{{ label }}</span>
    <input
      :id="id"
      v-model="model"
      :type="type"
      :placeholder="placeholder"
      class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
      @keyup.enter="$emit('submit')"
    />
  </label>
</template>
