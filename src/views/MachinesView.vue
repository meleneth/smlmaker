<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref } from 'vue'

import { useProjectStore } from '@/stores/project'
const project_store = useProjectStore()
const { project } = storeToRefs(project_store)

import type { NamespaceName } from '@/types'

import MachineEdit from '@/components/MachineEdit.vue'

import DeleteButtonFor from '@/components/DeleteButtonFor.vue'

import HeaderSection from '@/components/HeaderSection.vue'
import FancyTextInput from '@/components/FancyTextInput.vue'

const machineToAdd = ref('')

function add_machine(namespace: NamespaceName) {
  project_store.addMachine(machineToAdd.value, namespace)
  machineToAdd.value = ''
}

const namespaceToAdd = ref('')

function add_namespace() {
  project_store.addNamespace(namespaceToAdd.value)
  namespaceToAdd.value = ''
}

defineOptions({
  name: 'Machines',
})
</script>
<template>
  <header-section>
    <template v-slot:label>Define Namespaces</template>
    <template v-slot:default>
      Namespaces are where machines live
      <br />
      <fancy-text-input
        v-model="namespaceToAdd"
        :handler="() => add_namespace()"
        id="namespace_to_add_input"
      >
        Add Namespace
      </fancy-text-input>
    </template>
  </header-section>

  <div v-for="namespace in project.namespaces" :key="namespace">
  <header-section>
    <template v-slot:label>Namespace: 
      <delete-button-for :handler="() => project_store.removeNamespace(namespace)">
          {{ namespace }}
        </delete-button-for>
      </template>
    <template v-slot:default>
       <fancy-text-input
        v-model="machineToAdd"
        :handler="() => add_machine(namespace)"
        id="machine_to_add_input"
      >
        Add Machine
      </fancy-text-input>
    </template>
  </header-section>
  <MachineEdit> </MachineEdit>
  </div>
 
 
</template>
