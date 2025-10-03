<script setup lang="ts">
const props = defineProps(['handler'])
defineOptions({
  name: 'aTButton',
})
</script>
<template>
  <button
    @click="props.handler"
    class="px-3 py-2 border rounded-md bg-red-500 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 dark:focus:ring-red-600"
  >
    <span>»</span>
    <slot></slot>
  </button>
</template>
