<script setup lang="ts">
const model = defineModel()
const props = defineProps(['handler', 'id', 'label'])
</script>

<template>
  <div class="flex items-center space-x-2">
    <input
      type="text"
      v-model="model"
      :id="props.id"
      @keyup.enter="props.handler"
      class="w-48 px-3 py-2 border rounded-md bg-yellow-200 text-gray-900 dark:bg-yellow-200 dark:text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-yellow-600"
      :placeholder="props.label"
    />

    <button
      @click="props.handler"
      class="px-3 py-2 border rounded-md bg-red-500 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 dark:focus:ring-red-600"
    >
      <span>»</span>
      <slot></slot>
    </button>
  </div>
</template>
