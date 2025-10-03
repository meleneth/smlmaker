<script setup lang="ts">
defineOptions({
  name: 'SplitTwoOneOne',
})
</script>
<template>
  <div class="flex flex-nowrap">
    <div class="w-full lg:w-2/4 p-4">
      <slot name="one"></slot>
    </div>
    <div class="w-full lg:w-1/4 p-4">
      <slot name="three"></slot>
    </div>
    <div class="w-full lg:w-1/4 p-4">
      <slot name="four"></slot>
    </div>
  </div>
</template>
<style scoped>
/* Additional styling if needed */
</style>
