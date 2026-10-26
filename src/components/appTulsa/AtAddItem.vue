<script setup lang="ts">
import AtButton from './AtButton.vue'
import AtField from './AtField.vue'

defineProps<{ id: string; label: string; buttonLabel?: string }>()
const emit = defineEmits<{ submit: [] }>()
const model = defineModel<string>({ required: true })
</script>

<template>
  <div class="flex items-end gap-2">
    <div class="min-w-0 flex-1">
      <AtField :id="id" v-model="model" :label="label" @submit="emit('submit')" />
    </div>
    <AtButton @click="emit('submit')">{{ buttonLabel || 'Add' }}</AtButton>
  </div>
</template>
