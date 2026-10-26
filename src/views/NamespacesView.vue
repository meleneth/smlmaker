<script setup lang="ts">
import { ref } from 'vue'

import AtAddItem from '@/components/appTulsa/AtAddItem.vue'
import AtButton from '@/components/appTulsa/AtButton.vue'
import AtPanel from '@/components/appTulsa/AtPanel.vue'
import { useProjectStore } from '@/stores/project'

const store = useProjectStore()
const namespaceToAdd = ref('')

function addNamespace() {
  if (store.addNamespace(namespaceToAdd.value)) namespaceToAdd.value = ''
}
</script>

<template>
  <main class="mx-auto max-w-4xl space-y-6">
    <AtPanel
      title="Namespaces"
      description="Create the C++ namespaces that will contain your machines and reusable types."
    >
      <AtAddItem
        id="namespace-to-add"
        v-model="namespaceToAdd"
        label="Namespace"
        button-label="Add namespace"
        @submit="addNamespace"
      />
    </AtPanel>

    <div v-if="store.project.namespaces.length" class="grid gap-3 sm:grid-cols-2">
      <article
        v-for="namespace in store.project.namespaces"
        :key="namespace"
        class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
      >
        <div>
          <code class="font-semibold text-gray-900 dark:text-white">{{ namespace }}</code>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ store.machinesByNamespace[namespace]?.length ?? 0 }} machines
          </p>
        </div>
        <AtButton tone="danger" @click="store.removeNamespace(namespace)">Delete</AtButton>
      </article>
    </div>
    <p v-else class="rounded-lg border border-dashed p-6 text-center text-gray-500">
      Add a namespace to unlock machines and reusable types.
    </p>
  </main>
</template>
