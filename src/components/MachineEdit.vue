<script setup lang="ts">
import type { Machine } from '@/types' // or '@/types.ts' if your setup requires the extension
import { toRefs, ref } from 'vue'

import SplitThreeOne from '@/components/SplitThreeOne.vue'
import TransitionEdit from '@/components/TransitionEdit.vue'

import SplitOneOneOne from '@/components/SplitOneOneOne.vue'
import SplitOneOneOneOne from '@/components/SplitOneOneOneOne.vue'
import FancyTextInput from '@/components/FancyTextInput.vue'

import aTButton from '@/components/appTulsa/aTButton.vue'
import aTInput from '@/components/appTulsa/aTInput.vue'

import { useProjectStore } from '@/stores/project'
const project_store = useProjectStore()
//const { project } = storeToRefs(project_store)
//import { storeToRefs } from 'pinia'

//import type { Namespace, Event, Machine, Transition, State, Context, ContextEntry } from '@/types'
const eventToAdd = ref('')
const stateToAdd = ref('')
const guardToAdd = ref('')
const actionToAdd = ref('')
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

function add_action() {
  project_store.addActionToMachine(actionToAdd.value, machine.value)
  actionToAdd.value = ''
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
  </section>
  <SplitOneOneOneOne>
    <template v-slot:one>
      <aTInput v-model="stateToAdd" @keyup.enter="() => add_state()" id="state_to_add_input" />
    </template>
    <template v-slot:two>
      <aTButton :handler="() => add_state()"> Add State </aTButton>
    </template>
    <template v-slot:three>
      <aTInput v-model="eventToAdd" @keyup.enter="() => add_event()" id="event_to_add_input" />
    </template>
    <template v-slot:four>
      <aTButton :handler="() => add_event()"> Add Event </aTButton>
    </template>
  </SplitOneOneOneOne>
  <SplitOneOneOneOne>
    <template v-slot:one>
      <ul>
        <li v-for="state in machine.states">{{ state }}</li>
      </ul>
    </template>
    <template v-slot:three>
      <ul>
        <li v-for="event in machine.events">{{ event }}</li>
      </ul>
    </template>
  </SplitOneOneOneOne>
  <SplitOneOneOneOne>
    <template v-slot:one>
      <aTInput v-model="guardToAdd" @keyup.enter="() => add_guard()" id="guard_to_add_input" />
    </template>
    <template v-slot:two>
      <aTButton :handler="() => add_state()"> Add Guard </aTButton>
    </template>
    <template v-slot:three>
      <aTInput v-model="actionToAdd" @keyup.enter="() => add_action()" id="action_to_add_input" />
    </template>
    <template v-slot:four>
      <aTButton :handler="() => add_action()"> Add Action </aTButton>
    </template>
  </SplitOneOneOneOne>
  <SplitOneOneOneOne>
    <template v-slot:one>
      <ul>
        <li v-for="guard in machine.guards">{{ guard }}</li>
      </ul>
    </template>
    <template v-slot:three>
      <ul>
        <li v-for="action in machine.actions">{{ action }}</li>
      </ul>
    </template>
  </SplitOneOneOneOne>
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
      <aTButton :handler="() => add_transition()"> Add Transition </aTButton>
    </template>
  </SplitOneOneOneOne>
  <TransitionEdit
    v-for="transition in machine.transitions"
    :transition="transition"
    :machine="machine"
  />
</template>
