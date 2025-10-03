<script setup lang="ts">
import { storeToRefs } from 'pinia'

import SplitOneTwoTwoOne from '@/components/SplitOneTwoTwoOne.vue'

import { useProjectStore } from '@/stores/project'
const project_store = useProjectStore()
const { project } = storeToRefs(project_store)
</script>

<template>
  <split-one-two-two-one>
    <template v-slot:two> Instructions:<br /> </template>
    <template v-slot:four>
      <br />
      <pre>{{ project }}</pre>
    </template>
  </split-one-two-two-one>
</template>
