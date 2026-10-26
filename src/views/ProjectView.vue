<script setup lang="ts">
import JSZip from 'jszip'
import { computed, ref } from 'vue'

import AtButton from '@/components/appTulsa/AtButton.vue'
import AtField from '@/components/appTulsa/AtField.vue'
import AtPanel from '@/components/appTulsa/AtPanel.vue'
import AtTextarea from '@/components/appTulsa/AtTextarea.vue'
import { useProjectStore } from '@/stores/project'
const project_store = useProjectStore()

const exportedText = ref('')
const textToImport = ref('')
const importError = ref('')
const hasInvalidMachines = computed(() =>
  project_store.project.machines.some(
    (machine) => project_store.validate_machine(machine).length > 0
  )
)

function generateExportedText(): void {
  exportedText.value = project_store.generateExport()
  const textarea = globalThis.document.createElement('textarea')
  textarea.value = exportedText.value
  globalThis.document.body.appendChild(textarea)
  textarea.select()
  globalThis.document.execCommand('copy') // ✅ Works on http://
  globalThis.document.body.removeChild(textarea)
}

function importText(): void {
  try {
    project_store.hydrateExport(textToImport.value)
    importError.value = ''
  } catch {
    importError.value = 'That project export is not valid JSON or compressed SMLmaker data.'
  }
}

async function downloadProjectCpp(): Promise<void> {
  const zip = new JSZip()
  for (const file of project_store.get_project_files) zip.file(file.name, file.contents)
  const blob = await zip.generateAsync({ type: 'blob' })
  const url = globalThis.URL.createObjectURL(blob)
  const link = globalThis.document.createElement('a')
  link.href = url
  link.download = `${project_store.project.name || 'smlmaker-project'}-cpp.zip`
  link.click()
  globalThis.URL.revokeObjectURL(url)
}
</script>
<template>
  <main class="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
    <AtPanel
      title="Project"
      description="Name the project, export its definition, or download the complete CMake source tree."
    >
      <AtField id="project-name" v-model="project_store.project.name" label="Project name" />
      <div class="flex flex-wrap gap-2">
        <AtButton tone="neutral" @click="generateExportedText">Copy project definition</AtButton>
        <AtButton
          :disabled="hasInvalidMachines || project_store.build_validation_errors.length > 0"
          @click="downloadProjectCpp"
        >
          Download C++ project
        </AtButton>
      </div>
      <pre
        v-if="exportedText"
        class="max-h-48 overflow-auto rounded bg-gray-950 p-3 text-gray-100"
        >{{ exportedText }}</pre
      >
    </AtPanel>

    <AtPanel
      title="Import"
      description="Paste a compressed SMLmaker export or a compatible JSON project definition."
    >
      <AtTextarea id="project-import" v-model="textToImport" label="Project definition" />
      <AtButton @click="importText">Import project</AtButton>
      <p v-if="importError" class="text-red-700">{{ importError }}</p>
    </AtPanel>
  </main>
</template>
