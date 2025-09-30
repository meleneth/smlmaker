<script setup lang="ts">
import { ref } from 'vue'

import SplitOneTwoTwoOne from '@/components/SplitOneTwoTwoOne.vue'

import { useProjectStore } from '@/stores/project'
const project_store = useProjectStore()

const exportedText = ref('')
const textToImport = ref('')

function generateExportedText(): void {
  exportedText.value = project_store.generateExport()
  const textarea = document.createElement('textarea')
  textarea.value = exportedText.value
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy') // ✅ Works on http://
  document.body.removeChild(textarea)
}

function importText(): void {
  project_store.hydrateExport(textToImport.value)
}
</script>
<template>
  <split-one-two-two-one>
    <template v-slot:two>
      Instructions: <br />
      Define Project details.<br />

      this lets you specify the project name and should have export / import project info
      <br />
      <button @click="generateExportedText()">Generate Export</button>

      <pre>{{ exportedText }}</pre>
    </template>
    <template v-slot:four>
      Paste Import:<br />
      <textarea
        v-model="textToImport"
        class="w-full h-32 p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-yellow-200 text-gray-900"
      />
      <button @click="importText()">Import</button>
    </template>
  </split-one-two-two-one>
</template>
