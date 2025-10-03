<script setup lang="ts">
const model = defineModel()
const props = defineProps(['id', 'label'])
const emit = defineEmits<{
  (e: 'keyup.enter', ev: KeyboardEvent): void
}>()

defineOptions({
  name: 'aTInput',
})
</script>
<template>
  <input
    type="text"
    v-model="model"
    :id="props.id"
    @keyup.enter="emit('keyup.enter', $event)"
    class="w-48 px-3 py-2 border rounded-md bg-yellow-200 text-gray-900 dark:bg-yellow-200 dark:text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-yellow-600"
    :placeholder="props.label"
  />
</template>
