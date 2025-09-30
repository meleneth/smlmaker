<template>
  <h1
    class="mb-4 text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white"
  >
    <slot name="label"></slot>
  </h1>
  <div
    class="block max-w-l p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
  >
    <p class="font-normal text-gray-700 dark:text-gray-400">
      <slot name="default"></slot>
    </p>
  </div>
</template>
