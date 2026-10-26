<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

import EventEditor from '@/components/EventEditor.vue'
import AtButton from '@/components/appTulsa/AtButton.vue'
import AtField from '@/components/appTulsa/AtField.vue'
import AtPanel from '@/components/appTulsa/AtPanel.vue'
import AtSelect from '@/components/appTulsa/AtSelect.vue'
import { useProjectStore } from '@/stores/project'

const store = useProjectStore()
const name = ref('')
const namespace = ref(store.project.namespaces[0] ?? '')

watch(
  () => store.project.namespaces,
  (namespaces) => {
    if (!namespaces.includes(namespace.value)) namespace.value = namespaces[0] ?? ''
  },
  { deep: true }
)

function addEvent() {
  if (store.addEvent(name.value, namespace.value)) name.value = ''
}
</script>

<template>
  <main class="mx-auto max-w-6xl space-y-6">
    <AtPanel
      v-if="store.project.namespaces.length"
      title="eventpp events"
      description="Define project-level messages independently from state-machine transition events."
    >
      <form class="grid items-end gap-3 md:grid-cols-[1fr_1fr_auto]" @submit.prevent="addEvent">
        <AtSelect
          id="new-event-namespace"
          v-model="namespace"
          label="Namespace"
          :options="store.project.namespaces.map((value) => ({ label: value, value }))"
        />
        <AtField id="new-event-name" v-model="name" label="Event name" />
        <AtButton type="submit">Add event</AtButton>
      </form>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Generated events are registered with the shared <code>src/events.hpp</code> typed bus.
      </p>
    </AtPanel>

    <div
      v-else
      class="rounded-lg border border-dashed p-8 text-center text-gray-600 dark:text-gray-300"
    >
      <p class="mb-3">eventpp events need a namespace first.</p>
      <RouterLink class="font-medium text-blue-700 underline dark:text-blue-300" to="/namespaces">
        Create a namespace
      </RouterLink>
    </div>

    <EventEditor
      v-for="event in store.project.events"
      :key="`${event.namespace}::${event.name}`"
      :event="event"
    />

    <p
      v-if="store.project.namespaces.length && !store.project.events?.length"
      class="rounded-lg border border-dashed p-6 text-center text-gray-500"
    >
      Add the first message in your eventpp event system.
    </p>
  </main>
</template>
