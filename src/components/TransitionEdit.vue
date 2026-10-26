<script setup lang="ts">
import type { Machine } from '@/types' // or '@/types.ts' if your setup requires the extension
import { computed, toRefs, ref } from 'vue'

import { useProjectStore } from '@/stores/project'
const project_store = useProjectStore()

import type { Transition } from '@/types'
import SplitTwoOneOne from '@/components/SplitTwoOneOne.vue'
import AtButton from '@/components/appTulsa/AtButton.vue'
import AtSelect from '@/components/appTulsa/AtSelect.vue'

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
const guardOptions = computed(() => machine.value.guards.map((value) => ({ label: value, value })))
const actionOptions = computed(() =>
  machine.value.actions.map((value) => ({ label: value, value }))
)
const currentGuard = computed({
  get: () => transition.value.guard ?? '',
  set: (value: string | number) => {
    transition.value.guard = String(value)
  },
})

function add_guard() {
  if (selectedGuardToAdd.value) {
    project_store.addGuardToTransition(selectedGuardToAdd.value, transition.value)
    selectedGuardToAdd.value = ''
  }
}

function add_action() {
  if (selectedActionToAdd.value) {
    project_store.addActionToTransition(selectedActionToAdd.value, transition.value)
    selectedActionToAdd.value = ''
  }
}
</script>

<template>
  <hr />
  <SplitTwoOneOne>
    <template v-slot:one
      >{{ transition.start_state }} gets {{ transition.event }} and transitions to
      {{ transition.target_state }}
      <button
        class="ml-2 text-red-700"
        @click="project_store.removeTransitionFromMachine(transition, machine)"
      >
        remove transition
      </button></template
    >
    <template v-if="!transition.guard" v-slot:three>
      <AtSelect
        :id="`guard-${transition.start_state}-${transition.event}-${transition.target_state}`"
        v-model="selectedGuardToAdd"
        label="Guard"
        placeholder="Select guard"
        :options="guardOptions"
      />
    </template>
    <template v-if="transition.guard" v-slot:three>
      <AtSelect
        :id="`guard-${transition.start_state}-${transition.event}-${transition.target_state}`"
        v-model="currentGuard"
        label="Guard"
        :options="guardOptions"
      />
    </template>
    <template v-if="!transition.guard" v-slot:four>
      <AtButton @click="add_guard">Add Guard</AtButton>
    </template>
    <template v-else v-slot:four>
      <AtButton @click="project_store.clearGuardFromTransition(transition)"> Clear Guard </AtButton>
    </template>
  </SplitTwoOneOne>
  <SplitTwoOneOne>
    <template v-slot:one>
      <span v-for="action in transition.actions" :key="action" class="mr-2">
        {{ action }}
        <button
          class="text-red-700"
          @click="project_store.removeActionFromTransition(action, transition)"
        >
          ×
        </button>
      </span>
    </template>
    <template v-slot:three>
      <AtSelect
        :id="`action-${transition.start_state}-${transition.event}-${transition.target_state}`"
        v-model="selectedActionToAdd"
        label="Action"
        placeholder="Select action"
        :options="actionOptions"
      />
    </template>
    <template v-slot:four>
      <AtButton @click="add_action">Add Action</AtButton>
    </template>
  </SplitTwoOneOne>
  <hr />
</template>
