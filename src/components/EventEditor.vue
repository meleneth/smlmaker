<script setup lang="ts">
import { computed, ref } from 'vue'

import AtButton from '@/components/appTulsa/AtButton.vue'
import AtField from '@/components/appTulsa/AtField.vue'
import AtPanel from '@/components/appTulsa/AtPanel.vue'
import AtSelect from '@/components/appTulsa/AtSelect.vue'
import { useProjectStore } from '@/stores/project'
import type { EventDefinition } from '@/types'

const props = defineProps<{ event: EventDefinition }>()
const store = useProjectStore()
const fieldName = ref('')
const fieldType = ref('')
const fieldValue = ref('')
const selectedHandler = ref('')
const includes = computed({
  get: () => props.event.includes.join(', '),
  set: (value: string | number) => store.setEventIncludes(props.event, String(value)),
})
const handlerTargets = computed(() =>
  store.project.machines.flatMap((machine) =>
    machine.events.map((machineEvent) => ({
      machine_namespace: machine.namespace,
      machine_name: machine.name,
      machine_event: machineEvent,
    }))
  )
)
const handlerOptions = computed(() =>
  handlerTargets.value.map((target, index) => ({
    label: `${target.machine_namespace}::${target.machine_name}.${target.machine_event}()`,
    value: String(index),
  }))
)

function addField() {
  if (
    store.addFieldToEvent(props.event, {
      name: fieldName.value,
      type: fieldType.value,
      value: fieldValue.value,
    })
  ) {
    fieldName.value = ''
    fieldType.value = ''
    fieldValue.value = ''
  }
}

function addHandler() {
  const target = handlerTargets.value[Number(selectedHandler.value)]
  if (target && store.addEventHandler(props.event, target)) selectedHandler.value = ''
}
</script>

<template>
  <AtPanel :title="`${event.namespace}::${event.name}`" description="Typed eventpp message payload">
    <AtField
      :id="`event-includes-${event.namespace}-${event.name}`"
      v-model="includes"
      label="Required headers (comma-separated)"
      placeholder='string, chrono, "other/Type.hpp"'
    />

    <div v-if="event.fields.length" class="space-y-2">
      <div
        v-for="field in event.fields"
        :key="field.name"
        class="flex items-center justify-between rounded bg-gray-50 p-2 dark:bg-gray-900"
      >
        <code>{{ field.type }} {{ field.name }}{{ field.value ? ` = ${field.value}` : '{}' }}</code>
        <AtButton tone="danger" @click="store.removeFieldFromEvent(event, field)">Remove</AtButton>
      </div>
    </div>
    <p v-else class="text-sm text-gray-500">This event currently has an empty payload.</p>

    <div class="grid gap-2 md:grid-cols-3">
      <AtField :id="`event-field-type-${event.name}`" v-model="fieldType" label="C++ type" />
      <AtField :id="`event-field-name-${event.name}`" v-model="fieldName" label="Field name" />
      <AtField :id="`event-field-value-${event.name}`" v-model="fieldValue" label="Default value" />
    </div>
    <div class="flex justify-between">
      <AtButton @click="addField">Add payload field</AtButton>
      <AtButton tone="danger" @click="store.removeEvent(event)">Delete event</AtButton>
    </div>

    <section class="space-y-3 border-t border-gray-200 pt-4 dark:border-gray-700">
      <div>
        <h3 class="font-semibold text-gray-900 dark:text-white">SML handlers</h3>
        <p class="text-sm text-gray-500">
          Forward this eventpp message directly to a machine transition event.
        </p>
      </div>
      <div v-if="event.handlers.length" class="flex flex-wrap gap-2">
        <button
          v-for="handler in event.handlers"
          :key="`${handler.machine_namespace}::${handler.machine_name}.${handler.machine_event}`"
          type="button"
          class="rounded-full bg-violet-50 px-3 py-1 font-mono text-sm text-violet-900 transition hover:bg-red-50 hover:text-red-800 dark:bg-violet-950 dark:text-violet-100"
          title="Remove generated handler"
          @click="store.removeEventHandler(event, handler)"
        >
          {{ handler.machine_namespace }}::{{ handler.machine_name }}.{{ handler.machine_event }}()
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <div v-if="handlerOptions.length" class="flex items-end gap-2">
        <div class="min-w-0 flex-1">
          <AtSelect
            :id="`event-handler-${event.namespace}-${event.name}`"
            v-model="selectedHandler"
            label="Machine event"
            placeholder="Select a machine event"
            :options="handlerOptions"
          />
        </div>
        <AtButton :disabled="selectedHandler === ''" @click="addHandler">Add handler</AtButton>
      </div>
      <p v-else class="text-sm text-gray-500">
        Define a transition event on a machine to make handler generation available.
      </p>
    </section>
  </AtPanel>
</template>
