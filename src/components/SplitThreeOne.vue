<template>
  <div class="flex flex-nowrap">
    <div class="w-full lg:w-3/4 p-4">
      <slot name="one"></slot>
    </div>

    <div class="w-full lg:w-1/4 p-4">
      <slot name="four"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'SplitThreeOne',
})
</script>
