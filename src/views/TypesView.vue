<script setup lang="ts">
import { ref } from 'vue'

import CppTypeEditor from '@/components/CppTypeEditor.vue'
import AtButton from '@/components/appTulsa/AtButton.vue'
import AtField from '@/components/appTulsa/AtField.vue'
import AtPanel from '@/components/appTulsa/AtPanel.vue'
import { useProjectStore } from '@/stores/project'

const store = useProjectStore()
const name = ref('')
const namespace = ref('')

function addType() {
  if (store.addType(name.value, namespace.value)) {
    name.value = ''
    namespace.value = ''
  }
}
</script>

<template>
  <main class="mx-auto max-w-6xl space-y-6">
    <AtPanel
      title="Reusable C++ types"
      description="Define context and data objects once, then attach them to any state machine."
    >
      <div class="grid items-end gap-3 md:grid-cols-[1fr_1fr_auto]">
        <AtField id="new-type-namespace" v-model="namespace" label="Namespace" />
        <AtField id="new-type-name" v-model="name" label="Type name" @submit="addType" />
        <AtButton @click="addType">Add type</AtButton>
      </div>
    </AtPanel>
    <CppTypeEditor
      v-for="type in store.project.types"
      :key="`${type.namespace}::${type.name}`"
      :type="type"
    />
  </main>
</template>
