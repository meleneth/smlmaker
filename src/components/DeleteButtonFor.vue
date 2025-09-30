<template>
  <button @click="handler" class="text-red-500 hover:text-red-700 font-bold px-2 rounded">X</button>
  <slot></slot>
</template>
<script setup lang="ts">
defineProps<{ handler: () => void }>()
</script>
