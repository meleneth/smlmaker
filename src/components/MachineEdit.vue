<script setup lang="ts">
import type { Machine } from '@/types' // or '@/types.ts' if your setup requires the extension
import { toRefs, ref } from 'vue'

import SplitOneOneOne from '@/components/SplitOneOneOne.vue'
import SplitOneOneOneOne from '@/components/SplitOneOneOneOne.vue'
import FancyTextInput from '@/components/FancyTextInput.vue'

import { useProjectStore } from '@/stores/project'
const project_store = useProjectStore()
//const { project } = storeToRefs(project_store)
//import { storeToRefs } from 'pinia'

//import type { Namespace, Event, Machine, Transition, State, Context, ContextEntry } from '@/types'
const eventToAdd = ref('')
const stateToAdd = ref('')
const guardToAdd = ref('')
const new_transition_start_state = ref('')
const new_transition_event = ref('')
const new_transition_target_state = ref('')

defineOptions({
  name: 'MachineEdit',
})

const props = defineProps<{
  machine: Machine
}>()
const { machine } = toRefs(props)

function add_event() {
  project_store.addEventToMachine(eventToAdd.value, machine.value)
  eventToAdd.value = ''
}
function add_state() {
  project_store.addStateToMachine(stateToAdd.value, machine.value)
  stateToAdd.value = ''
}
function add_guard() {
  project_store.addGuardToMachine(guardToAdd.value, machine.value)
  guardToAdd.value = ''
}

function add_transition() {
  project_store.addTransitionToMachine(
    new_transition_start_state.value,
    new_transition_event.value,
    new_transition_target_state.value,
    machine.value
  )
}
</script>

<template>
  <section class="p-4">
    <h2 class="text-xl font-bold">{{ machine.name }}</h2>
    <!-- use props.machine.* as needed -->
  </section>
  <SplitOneOneOne>
    <template v-slot:one>
      <fancy-text-input v-model="eventToAdd" :handler="() => add_event()" id="event_to_add_input">
        Add Event
      </fancy-text-input>
      <ul>
        <li v-for="event in machine.events">{{ event }}</li>
      </ul>
    </template>
    <template v-slot:two>
      <fancy-text-input v-model="stateToAdd" :handler="() => add_state()" id="state_to_add_input">
        Add State
      </fancy-text-input>
      <ul>
        <li v-for="state in machine.states">{{ state }}</li>
      </ul>
    </template>
    <template v-slot:three>
      <fancy-text-input v-model="guardToAdd" :handler="() => add_guard()" id="guard_to_add_input">
        Add Guard
      </fancy-text-input>
      <ul>
        <li v-for="guard in machine.guards">{{ guard }}</li>
      </ul>
    </template>
  </SplitOneOneOne>
  <SplitOneOneOneOne>
    <template v-slot:one>
      <select
        v-model="new_transition_start_state"
        class="w-48 px-3 inline-block py-2 border rounded-md bg-yellow-200 text-gray-900 dark:bg-yellow-200 dark:text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-yellow-600"
      >
        <option v-for="choice in machine.states" :key="choice" :value="choice">
          {{ choice }}
        </option>
      </select>
    </template>
    <template v-slot:two>
      <select
        v-model="new_transition_event"
        class="w-48 px-3 inline-block py-2 border rounded-md bg-yellow-200 text-gray-900 dark:bg-yellow-200 dark:text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-yellow-600"
      >
        <option v-for="choice in machine.events" :key="choice" :value="choice">
          {{ choice }}
        </option>
      </select>
    </template>
    <template v-slot:three>
      <select
        v-model="new_transition_target_state"
        class="w-48 px-3 inline-block py-2 border rounded-md bg-yellow-200 text-gray-900 dark:bg-yellow-200 dark:text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-yellow-600"
      >
        <option v-for="choice in machine.states" :key="choice" :value="choice">
          {{ choice }}
        </option>
      </select>
    </template>
    <template v-slot:four>
      <button
        @click="add_transition"
        class="px-3 py-2 border rounded-md bg-red-500 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 dark:focus:ring-red-600"
      >
        <span>»</span>
        Add Transition
      </button>
    </template>
  </SplitOneOneOneOne>
  <ul>
    <li v-for="transition in machine.transitions">{{ transition.start_state }} gets {{ transition.event }} and transitions to {{ transition.target_state }}</li>
  </ul>
</template>
