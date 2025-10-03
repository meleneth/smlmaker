<script setup lang="ts">
import type { Machine } from '@/types' // or '@/types.ts' if your setup requires the extension
import { toRefs, ref } from 'vue'

import { useProjectStore } from '@/stores/project'
const project_store = useProjectStore()

import type { Transition } from '@/types'
import SplitTwoOneOne from '@/components/SplitTwoOneOne.vue'
import aTButton from '@/components/appTulsa/aTButton.vue'

defineOptions({
  name: 'TransitionGuardEdit',
})

const props = defineProps<{
  transition: Transition
  machine: Machine
}>()

const { transition, machine } = toRefs(props)
const selectedGuardToAdd = ref('')
const selectedActionToAdd = ref('')

function add_guard() {
  project_store.addGuardToTransition(selectedGuardToAdd.value, transition.value)
}

function add_action() {
  project_store.addActionToTransition(selectedActionToAdd.value, transition.value)
}
</script>

<template>
  <hr />
  <SplitTwoOneOne>
    <template v-slot:one
      >{{ transition.start_state }} gets {{ transition.event }} and transitions to
      {{ transition.target_state }}</template
    >
    <template v-if="!transition.guard" v-slot:three>
      <select
        v-model="selectedGuardToAdd"
        class="w-48 px-3 inline-block py-2 border rounded-md bg-yellow-200 text-gray-900 dark:bg-yellow-200 dark:text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-yellow-600"
      >
        <option v-for="choice in machine.guards" :key="choice" :value="choice">
          {{ choice }}
        </option>
      </select>
    </template>
    <template v-if="transition.guard" v-slot:three>
      <select
        v-model="transition.guard"
        class="w-48 px-3 inline-block py-2 border rounded-md bg-yellow-200 text-gray-900 dark:bg-yellow-200 dark:text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-yellow-600"
      >
        <option v-for="choice in machine.guards" :key="choice" :value="choice">
          {{ choice }}
        </option>
      </select>
    </template>
    <template v-if="!transition.guard" v-slot:four>
      <aTButton :handler="() => add_guard()">Add Guard</aTButton>
    </template>
  </SplitTwoOneOne>
  <SplitTwoOneOne>
    <template v-slot:one>{{ transition.actions.join(', ') }}</template>
    <template v-slot:three>
      <select
        v-model="selectedActionToAdd"
        class="w-48 px-3 inline-block py-2 border rounded-md bg-yellow-200 text-gray-900 dark:bg-yellow-200 dark:text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-yellow-600"
      >
        <option v-for="choice in machine.actions" :key="choice" :value="choice">
          {{ choice }}
        </option>
      </select>
    </template>
    <template v-slot:four>
      <aTButton :handler="() => add_action()">Add Action</aTButton>
    </template>
  </SplitTwoOneOne>
  <hr />
</template>
