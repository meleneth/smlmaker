<template>
  <div class="flex flex-nowrap">
    <div class="w-full lg:w-1/6 p-4">
      <slot name="one"></slot>
    </div>
    <div class="w-full lg:w-2/3 p-4">
      <slot name="two"></slot>
    </div>
    <div class="w-full lg:w-1/6 p-4">
      <slot name="six"></slot>
    </div>
  </div>
</template>
