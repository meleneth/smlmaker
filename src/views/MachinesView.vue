<script setup lang="ts">
import { ref } from 'vue'

import MachineEdit from '@/components/MachineEdit.vue'
import AtAddItem from '@/components/appTulsa/AtAddItem.vue'
import AtButton from '@/components/appTulsa/AtButton.vue'
import AtPanel from '@/components/appTulsa/AtPanel.vue'
import { useProjectStore } from '@/stores/project'
import type { NamespaceName } from '@/types'

const store = useProjectStore()
const machineToAdd = ref('')
const namespaceToAdd = ref('')

function addMachine(namespace: NamespaceName) {
  const name = machineToAdd.value.trim()
  if (!name) return
  if (
    store.project.machines.some(
      (machine) => machine.namespace === namespace && machine.name === name
    )
  )
    return
  store.addMachine(name, namespace)
  machineToAdd.value = ''
}

function addNamespace() {
  if (store.addNamespace(namespaceToAdd.value)) namespaceToAdd.value = ''
}
</script>

<template>
  <main class="mx-auto max-w-7xl space-y-6">
    <AtPanel title="Namespaces" description="Namespaces own generated machines and types.">
      <AtAddItem
        id="namespace_to_add_input"
        v-model="namespaceToAdd"
        label="Namespace"
        button-label="Add namespace"
        @submit="addNamespace"
      />
    </AtPanel>

    <AtPanel
      v-for="(machines, namespace) in store.machinesByNamespace"
      :key="namespace"
      :title="`Namespace: ${namespace}`"
    >
      <div class="flex items-end gap-3">
        <div class="flex-1">
          <AtAddItem
            id="machine_to_add_input"
            v-model="machineToAdd"
            label="Machine name"
            button-label="Add machine"
            @submit="addMachine(namespace)"
          />
        </div>
        <AtButton tone="danger" @click="store.removeNamespace(namespace)"
          >Delete namespace</AtButton
        >
      </div>
      <MachineEdit v-for="machine in machines" :key="machine.name" :machine="machine" />
    </AtPanel>
  </main>
</template>
