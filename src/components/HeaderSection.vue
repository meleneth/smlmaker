<script setup lang="ts">
import SplitOneFourOne from '@/components/SplitOneFourOne.vue'
import ThingCard from '@/components/ThingCard.vue'

defineOptions({
  name: 'HeaderSection',
})
</script>
<template>
  <split-one-four-one>
    <template v-slot:one></template>
    <template v-slot:two>
      <thing-card>
        <template v-slot:label>
          <h1
            class="mb-4 text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white"
          >
            <slot name="label" />
          </h1>
        </template>
        <template v-slot:default>
          <slot name="default" />
        </template>
      </thing-card>
    </template>
    <template v-slot:six></template>
  </split-one-four-one>
</template>
