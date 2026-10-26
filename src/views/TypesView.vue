<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

import CppTypeEditor from '@/components/CppTypeEditor.vue'
import AtButton from '@/components/appTulsa/AtButton.vue'
import AtField from '@/components/appTulsa/AtField.vue'
import AtPanel from '@/components/appTulsa/AtPanel.vue'
import AtSelect from '@/components/appTulsa/AtSelect.vue'
import { useProjectStore } from '@/stores/project'
import type { CppType } from '@/types'

const store = useProjectStore()
const name = ref('')
const namespace = ref(store.project.namespaces[0] ?? '')
const kind = ref<NonNullable<CppType['kind']>>('value')

function addType() {
  if (store.addType(name.value, namespace.value, kind.value)) name.value = ''
}
</script>

<template>
  <main class="mx-auto max-w-6xl space-y-6">
    <AtPanel
      v-if="store.project.namespaces.length"
      title="Reusable C++ types"
      description="Define ordinary values or Fairlanes-style borrowed context objects with reference accessors."
    >
      <div class="grid items-end gap-3 md:grid-cols-[1fr_1fr_12rem_auto]">
        <AtSelect
          id="new-type-namespace"
          v-model="namespace"
          label="Namespace"
          :options="store.project.namespaces.map((value) => ({ label: value, value }))"
        />
        <AtField id="new-type-name" v-model="name" label="Type name" @submit="addType" />
        <AtSelect
          id="new-type-kind"
          v-model="kind"
          label="Kind"
          :options="[
            { label: 'Value type', value: 'value' },
            { label: 'Context object', value: 'context' },
          ]"
        />
        <AtButton @click="addType">Add type</AtButton>
      </div>
    </AtPanel>
    <div
      v-else
      class="rounded-lg border border-dashed p-8 text-center text-gray-600 dark:text-gray-300"
    >
      <p class="mb-3">Reusable types need a namespace first.</p>
      <RouterLink class="font-medium text-blue-700 underline dark:text-blue-300" to="/namespaces">
        Create a namespace
      </RouterLink>
    </div>
    <CppTypeEditor
      v-for="type in store.project.types"
      :key="`${type.namespace}::${type.name}`"
      :type="type"
    />
  </main>
</template>
