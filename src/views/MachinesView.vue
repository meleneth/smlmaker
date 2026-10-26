<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

import MachineEdit from '@/components/MachineEdit.vue'
import AtButton from '@/components/appTulsa/AtButton.vue'
import AtField from '@/components/appTulsa/AtField.vue'
import AtPanel from '@/components/appTulsa/AtPanel.vue'
import AtSelect from '@/components/appTulsa/AtSelect.vue'
import { useProjectStore } from '@/stores/project'

const store = useProjectStore()
const machineToAdd = ref('')
const selectedNamespace = ref(store.project.namespaces[0] ?? '')

watch(
  () => store.project.namespaces,
  (namespaces) => {
    if (!namespaces.includes(selectedNamespace.value)) selectedNamespace.value = namespaces[0] ?? ''
  },
  { deep: true }
)

function addMachine() {
  const name = machineToAdd.value.trim()
  const namespace = selectedNamespace.value
  if (!name || !namespace) return
  if (
    store.project.machines.some(
      (machine) => machine.namespace === namespace && machine.name === name
    )
  )
    return
  store.addMachine(name, namespace)
  machineToAdd.value = ''
}
</script>

<template>
  <main class="mx-auto max-w-7xl space-y-6">
    <AtPanel
      v-if="store.project.namespaces.length"
      title="Machines"
      description="Choose an existing namespace, then add a state machine to it."
    >
      <form class="grid items-end gap-3 md:grid-cols-[12rem_1fr_auto]" @submit.prevent="addMachine">
        <AtSelect
          id="machine-namespace"
          v-model="selectedNamespace"
          label="Namespace"
          :options="store.project.namespaces.map((value) => ({ label: value, value }))"
        />
        <AtField id="machine-to-add" v-model="machineToAdd" label="Machine name" />
        <AtButton type="submit">Add machine</AtButton>
      </form>
    </AtPanel>

    <div
      v-else
      class="rounded-lg border border-dashed p-8 text-center text-gray-600 dark:text-gray-300"
    >
      <p class="mb-3">Machines need a namespace first.</p>
      <RouterLink class="font-medium text-blue-700 underline dark:text-blue-300" to="/namespaces">
        Create a namespace
      </RouterLink>
    </div>

    <AtPanel
      v-for="(machines, namespace) in store.machinesByNamespace"
      :key="namespace"
      :title="`Namespace: ${namespace}`"
    >
      <p v-if="!machines.length" class="text-sm text-gray-500">
        No machines in this namespace yet.
      </p>
      <MachineEdit v-for="machine in machines" :key="machine.name" :machine="machine" />
    </AtPanel>
  </main>
</template>
