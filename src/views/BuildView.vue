<script setup lang="ts">
import { computed, ref } from 'vue'

import TestTargetEditor from '@/components/TestTargetEditor.vue'
import AtButton from '@/components/appTulsa/AtButton.vue'
import AtCheckbox from '@/components/appTulsa/AtCheckbox.vue'
import AtField from '@/components/appTulsa/AtField.vue'
import AtPanel from '@/components/appTulsa/AtPanel.vue'
import AtSelect from '@/components/appTulsa/AtSelect.vue'
import AtTextarea from '@/components/appTulsa/AtTextarea.vue'
import { useProjectStore } from '@/stores/project'
import { OPTIONAL_DEPENDENCIES } from '@/generators/project'
import type { CompilationUnitKind, LibraryTarget, OptionalDependency } from '@/types'

const store = useProjectStore()
const testTargetName = ref('')
const unitPath = ref('')
const unitKind = ref<CompilationUnitKind>('source')
const projectVersion = computed({
  get: () => store.project.version ?? '0.1.0',
  set: (value: string | number) => {
    store.project.version = String(value)
  },
})
const cxxStandard = computed({
  get: () => store.project.cxx_standard ?? 17,
  set: (value: string | number) => {
    store.project.cxx_standard = Number(value) as 17 | 20 | 23
  },
})

const unitKinds = [
  { label: 'Library source', value: 'source' },
  { label: 'Catch2 test', value: 'test' },
]

function addTestTarget() {
  if (store.addTestTarget(testTargetName.value)) testTargetName.value = ''
}

function addUnit() {
  if (store.addCompilationUnit(unitPath.value, unitKind.value)) unitPath.value = ''
}

function dependencyDisabled(library: LibraryTarget, dependency: OptionalDependency): boolean {
  if (library.dependencies.includes(dependency)) return false
  if (dependency === 'sdl2') {
    return Boolean(store.project.libraries?.some((target) => target.dependencies.includes('sdl3')))
  }
  if (dependency === 'sdl3') {
    return Boolean(store.project.libraries?.some((target) => target.dependencies.includes('sdl2')))
  }
  return false
}
</script>

<template>
  <main class="mx-auto max-w-6xl space-y-6">
    <AtPanel
      title="CMake project"
      description="Configure generated C++ targets and compilation-unit ownership."
    >
      <div class="grid gap-3 md:grid-cols-3">
        <AtField id="cmake-project-name" v-model="store.project.name" label="Project name" />
        <AtField id="cmake-project-version" v-model="projectVersion" label="Version" />
        <AtSelect
          id="cmake-cxx-standard"
          v-model="cxxStandard"
          label="C++ standard"
          :options="[
            { label: 'C++17', value: 17 },
            { label: 'C++20', value: 20 },
            { label: 'C++23', value: 23 },
          ]"
        />
      </div>
      <ul
        v-if="store.build_validation_errors.length"
        class="rounded border border-amber-400 bg-amber-50 p-3 text-amber-900"
      >
        <li v-for="error in store.build_validation_errors" :key="error">{{ error }}</li>
      </ul>
    </AtPanel>

    <AtPanel
      title="Compilation units"
      description="Generated machine units are listed automatically; add authored sources or tests here."
    >
      <div class="grid items-end gap-3 md:grid-cols-[1fr_12rem_auto]">
        <AtField
          id="new-unit-path"
          v-model="unitPath"
          label="Path"
          placeholder="src/network/Socket.cpp"
        />
        <AtSelect id="new-unit-kind" v-model="unitKind" label="Kind" :options="unitKinds" />
        <AtButton @click="addUnit">Add unit</AtButton>
      </div>
      <div
        v-for="unit in store.project.compilation_units"
        :key="unit.path"
        class="space-y-2 rounded border p-3"
      >
        <div class="flex justify-between">
          <code>{{ unit.path }}</code
          ><AtButton tone="danger" @click="store.removeCompilationUnit(unit)">Remove</AtButton>
        </div>
        <AtTextarea :id="`unit-${unit.path}`" v-model="unit.content" label="Contents" />
      </div>
    </AtPanel>

    <AtPanel
      v-if="store.project.libraries?.length"
      title="Optional libraries"
      description="Select the third-party libraries each generated target should link."
    >
      <div v-for="library in store.project.libraries" :key="library.name" class="space-y-3">
        <h3 class="font-semibold text-gray-900 dark:text-white">{{ library.name }}</h3>
        <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <AtCheckbox
            v-for="dependency in OPTIONAL_DEPENDENCIES"
            :id="`build-${library.name}-dependency-${dependency.id}`"
            :key="dependency.id"
            :label="dependency.label"
            :disabled="dependencyDisabled(library, dependency.id)"
            :model-value="library.dependencies.includes(dependency.id)"
            @update:model-value="store.toggleLibraryDependency(library, dependency.id, $event)"
          />
        </div>
      </div>
    </AtPanel>

    <AtPanel
      title="Catch2 targets"
      description="Each target becomes a Catch2 executable discovered by CTest."
    >
      <div class="flex items-end gap-3">
        <div class="flex-1">
          <AtField
            id="new-test-target"
            v-model="testTargetName"
            label="Target name"
            @submit="addTestTarget"
          />
        </div>
        <AtButton @click="addTestTarget">Add test target</AtButton>
      </div>
    </AtPanel>
    <TestTargetEditor
      v-for="target in store.project.test_targets"
      :key="target.name"
      :target="target"
    />

    <AtPanel title="Generated CMakeLists.txt">
      <pre class="overflow-auto rounded bg-gray-950 p-4 text-sm text-gray-100">{{
        store.get_cmake
      }}</pre>
    </AtPanel>
  </main>
</template>
