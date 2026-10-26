<script setup lang="ts">
import JSZip from 'jszip'
import { computed, ref, toRefs } from 'vue'

import TransitionEdit from '@/components/TransitionEdit.vue'
import AtAddItem from '@/components/appTulsa/AtAddItem.vue'
import AtButton from '@/components/appTulsa/AtButton.vue'
import AtSelect from '@/components/appTulsa/AtSelect.vue'
import ThingCard from '@/components/ThingCard.vue'
import { useProjectStore } from '@/stores/project'
import type { Machine } from '@/types'

defineOptions({ name: 'MachineEdit' })

const props = defineProps<{ machine: Machine }>()
const { machine } = toRefs(props)
const projectStore = useProjectStore()

const eventToAdd = ref('')
const stateToAdd = ref('')
const guardToAdd = ref('')
const actionToAdd = ref('')
const transitionStart = ref('')
const transitionEvent = ref('')
const transitionTarget = ref('')
const contextFieldName = ref('')
const contextFieldType = ref('')
const contextFieldValue = ref('')
const validationErrors = computed(() => projectStore.validate_machine(machine.value))
const contextOptions = computed(() => [
  { label: 'No shared context', value: '' },
  ...(projectStore.project.types ?? []).map((type) => ({
    label: `${type.namespace}::${type.name}`,
    value: `${type.namespace}::${type.name}`,
  })),
])
const stateOptions = computed(() => machine.value.states.map((value) => ({ label: value, value })))
const eventOptions = computed(() => machine.value.events.map((value) => ({ label: value, value })))
const selectedInitialState = computed({
  get: () => machine.value.initial_state ?? '',
  set: (value: string | number) => projectStore.setInitialState(machine.value, String(value)),
})
const selectedContextType = computed({
  get: () => machine.value.context_type ?? '',
  set: (value: string | number) => projectStore.setMachineContextType(machine.value, String(value)),
})

function addValue(kind: 'state' | 'event' | 'guard' | 'action') {
  const refs = { state: stateToAdd, event: eventToAdd, guard: guardToAdd, action: actionToAdd }
  const methods = {
    state: projectStore.addStateToMachine,
    event: projectStore.addEventToMachine,
    guard: projectStore.addGuardToMachine,
    action: projectStore.addActionToMachine,
  }
  if (methods[kind](refs[kind].value, machine.value)) refs[kind].value = ''
}

function addTransition() {
  if (!transitionStart.value || !transitionEvent.value || !transitionTarget.value) return
  projectStore.addTransitionToMachine(
    transitionStart.value,
    transitionEvent.value,
    transitionTarget.value,
    machine.value
  )
  transitionStart.value = ''
  transitionEvent.value = ''
  transitionTarget.value = ''
}

function addContextField() {
  if (
    projectStore.addContextEntry(machine.value, {
      name: contextFieldName.value,
      type: contextFieldType.value,
      value: contextFieldValue.value,
    })
  ) {
    contextFieldName.value = ''
    contextFieldType.value = ''
    contextFieldValue.value = ''
  }
}

async function downloadCppZip() {
  if (validationErrors.value.length) return
  const zip = new JSZip()
  for (const file of projectStore.get_machine_files(machine.value)) {
    zip.file(file.name, file.contents)
  }
  zip.file(
    'DEPENDENCIES.md',
    `# C++ dependencies

- C++17 or newer
- Boost-ext.SML: https://github.com/boost-ext/sml
- eventpp: https://github.com/wqking/eventpp
`
  )
  const blob = await zip.generateAsync({ type: 'blob' })
  const url = globalThis.URL.createObjectURL(blob)
  const link = globalThis.document.createElement('a')
  link.href = url
  link.download = `${machine.value.name || 'state-machine'}-cpp.zip`
  link.click()
  globalThis.URL.revokeObjectURL(url)
}
</script>

<template>
  <section class="space-y-6 rounded-lg border border-gray-300 p-4 dark:border-gray-700">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-2xl font-bold">{{ machine.name }}</h2>
      <div class="flex gap-2">
        <button
          class="rounded bg-blue-700 px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="validationErrors.length > 0"
          @click="downloadCppZip"
        >
          Download C++ ZIP
        </button>
        <button
          class="rounded bg-red-700 px-3 py-2 text-white"
          @click="projectStore.removeMachine(machine)"
        >
          Delete machine
        </button>
      </div>
    </div>

    <ul
      v-if="validationErrors.length"
      class="rounded border border-amber-400 bg-amber-50 p-3 text-amber-900"
    >
      <li v-for="error in validationErrors" :key="error">{{ error }}</li>
    </ul>

    <div class="grid gap-5 md:grid-cols-2">
      <section>
        <h3 class="font-bold">States</h3>
        <AtAddItem
          id="state_to_add_input"
          v-model="stateToAdd"
          label="New state"
          button-label="Add State"
          @submit="addValue('state')"
        />
        <ul>
          <li v-for="state in machine.states" :key="state" class="flex items-center gap-2">
            {{ state }}
            <button
              class="text-red-700"
              @click="projectStore.removeStateFromMachine(state, machine)"
            >
              remove
            </button>
          </li>
        </ul>
        <AtSelect
          v-if="machine.states.length"
          id="initial-state"
          v-model="selectedInitialState"
          label="Initial state"
          :options="stateOptions"
        />
      </section>

      <section>
        <h3 class="font-bold">Events</h3>
        <AtAddItem
          id="event_to_add_input"
          v-model="eventToAdd"
          label="New event"
          button-label="Add Event"
          @submit="addValue('event')"
        />
        <ul>
          <li v-for="event in machine.events" :key="event" class="flex items-center gap-2">
            {{ event }}
            <button
              class="text-red-700"
              @click="projectStore.removeEventFromMachine(event, machine)"
            >
              remove
            </button>
          </li>
        </ul>
      </section>
    </div>

    <div class="grid gap-5 md:grid-cols-2">
      <section>
        <h3 class="font-bold">Guards</h3>
        <AtAddItem
          id="guard_to_add_input"
          v-model="guardToAdd"
          label="New guard"
          button-label="Add Guard"
          @submit="addValue('guard')"
        />
        <div v-for="guard in machine.guards" :key="guard" class="mt-2">
          <label class="block">{{ guard }} expression</label>
          <input
            class="w-full rounded border p-2 text-gray-900"
            :value="machine.guard_code?.[guard]"
            placeholder="context.ready"
            @input="
              projectStore.setGuardCode(machine, guard, ($event.target as HTMLInputElement).value)
            "
          />
          <button class="text-red-700" @click="projectStore.removeGuardFromMachine(guard, machine)">
            remove
          </button>
        </div>
      </section>

      <section>
        <h3 class="font-bold">Actions</h3>
        <AtAddItem
          id="action_to_add_input"
          v-model="actionToAdd"
          label="New action"
          button-label="Add Action"
          @submit="addValue('action')"
        />
        <div v-for="action in machine.actions" :key="action" class="mt-2">
          <label class="block">{{ action }} C++ body</label>
          <textarea
            class="w-full rounded border p-2 font-mono text-gray-900"
            :value="machine.action_code?.[action]"
            placeholder="context.count += 1;"
            @input="
              projectStore.setActionCode(
                machine,
                action,
                ($event.target as HTMLTextAreaElement).value
              )
            "
          />
          <button
            class="text-red-700"
            @click="projectStore.removeActionFromMachine(action, machine)"
          >
            remove
          </button>
        </div>
      </section>
    </div>

    <section>
      <div class="flex flex-wrap items-end gap-3">
        <h3 class="font-bold">Context</h3>
        <div class="min-w-64">
          <AtSelect
            :id="`context-type-${machine.name}`"
            v-model="selectedContextType"
            label="Reusable context type"
            :options="contextOptions"
          />
        </div>
        <button
          v-if="!machine.context && !machine.context_type"
          class="rounded bg-gray-700 px-3 py-1 text-white"
          @click="projectStore.enableContext(machine)"
        >
          Enable context
        </button>
        <button v-else class="text-red-700" @click="projectStore.disableContext(machine)">
          Disable context
        </button>
      </div>
      <div v-if="machine.context" class="space-y-2">
        <label
          >Context type
          <input v-model="machine.context.name" class="rounded border p-2 text-gray-900"
        /></label>
        <div v-for="entry in machine.context.entries" :key="entry.name" class="flex gap-2">
          <code>{{ entry.type }} {{ entry.name }} = {{ entry.value || '{}' }}</code>
          <button class="text-red-700" @click="projectStore.removeContextEntry(machine, entry)">
            remove
          </button>
        </div>
        <div class="flex flex-wrap gap-2">
          <input
            v-model="contextFieldType"
            placeholder="C++ type"
            class="rounded border p-2 text-gray-900"
          />
          <input
            v-model="contextFieldName"
            placeholder="field name"
            class="rounded border p-2 text-gray-900"
          />
          <input
            v-model="contextFieldValue"
            placeholder="initial value"
            class="rounded border p-2 text-gray-900"
          />
          <button class="rounded bg-gray-700 px-3 py-2 text-white" @click="addContextField">
            Add field
          </button>
        </div>
      </div>
    </section>

    <section>
      <h3 class="font-bold">Transitions</h3>
      <div class="flex flex-wrap gap-2">
        <AtSelect
          id="transition-start"
          v-model="transitionStart"
          label="Start state"
          placeholder="Select state"
          :options="stateOptions"
        />
        <AtSelect
          id="transition-event"
          v-model="transitionEvent"
          label="Event"
          placeholder="Select event"
          :options="eventOptions"
        />
        <AtSelect
          id="transition-target"
          v-model="transitionTarget"
          label="Target state"
          placeholder="Select state"
          :options="stateOptions"
        />
        <AtButton @click="addTransition">Add Transition</AtButton>
      </div>
      <TransitionEdit
        v-for="transition in machine.transitions"
        :key="`${transition.start_state}-${transition.event}-${transition.target_state}`"
        :transition="transition"
        :machine="machine"
      />
    </section>

    <thing-card>
      <template #label>file: {{ machine.name }}_events.hpp</template>
      <pre class="overflow-auto">{{ projectStore.get_machine_events_header(machine) }}</pre>
    </thing-card>
    <thing-card>
      <template #label>file: {{ machine.name }}.hpp</template>
      <pre class="overflow-auto">{{ projectStore.get_machine_header(machine) }}</pre>
    </thing-card>
    <thing-card>
      <template #label>file: {{ machine.name }}.cpp</template>
      <pre class="overflow-auto">{{ projectStore.get_machine_source(machine) }}</pre>
    </thing-card>
  </section>
</template>
