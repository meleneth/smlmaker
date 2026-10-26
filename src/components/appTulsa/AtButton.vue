<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: 'button' | 'submit'
    tone?: 'primary' | 'danger' | 'neutral'
    disabled?: boolean
  }>(),
  { type: 'button', tone: 'primary', disabled: false }
)
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="rounded-md border px-3 py-2 font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50"
    :class="{
      'border-blue-700 bg-blue-700 hover:bg-blue-800': tone === 'primary',
      'border-red-700 bg-red-700 hover:bg-red-800': tone === 'danger',
      'border-gray-600 bg-gray-700 hover:bg-gray-800': tone === 'neutral',
    }"
  >
    <slot />
  </button>
</template>
