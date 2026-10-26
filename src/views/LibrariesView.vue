<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import AtButton from '@/components/appTulsa/AtButton.vue'
import AtField from '@/components/appTulsa/AtField.vue'
import AtPanel from '@/components/appTulsa/AtPanel.vue'
import AtSelect from '@/components/appTulsa/AtSelect.vue'
import { cppTypeKey } from '@/generators/cpp'
import { useProjectStore } from '@/stores/project'
import type { LibraryKind } from '@/types'

const store = useProjectStore()
const libraryName = ref('')
const libraryKind = ref<LibraryKind>('STATIC')
const selectedLibraryName = ref(store.project.libraries?.[0]?.name ?? '')

const libraryKinds = ['STATIC', 'SHARED', 'OBJECT'].map((value) => ({ label: value, value }))
const libraryOptions = computed(() =>
  (store.project.libraries ?? []).map((library) => ({
    label: library.name,
    value: library.name,
  }))
)
const selectedLibrary = computed(() =>
  store.project.libraries?.find((library) => library.name === selectedLibraryName.value)
)

watch(
  libraryOptions,
  (options) => {
    if (!options.some((option) => option.value === selectedLibraryName.value)) {
      selectedLibraryName.value = options[0]?.value ?? ''
    }
  },
  { immediate: true }
)

function addLibrary() {
  const library = store.addLibrary(libraryName.value, libraryKind.value)
  if (!library) return
  libraryName.value = ''
  selectedLibraryName.value = library.name
}

function assign(path: string) {
  if (selectedLibrary.value) store.assignLibraryUnit(selectedLibrary.value, path)
}

function assignType(type: string) {
  if (selectedLibrary.value) store.assignLibraryType(selectedLibrary.value, type)
}
</script>

<template>
  <main class="mx-auto max-w-5xl space-y-6">
    <AtPanel
      title="Libraries"
      description="Create a target, then place each unassigned C++ source into its owning library."
    >
      <form class="grid items-end gap-3 md:grid-cols-[1fr_12rem_auto]" @submit.prevent="addLibrary">
        <AtField id="new-library-name" v-model="libraryName" label="Target name" />
        <AtSelect
          id="new-library-kind"
          v-model="libraryKind"
          label="Kind"
          :options="libraryKinds"
        />
        <AtButton type="submit">Add library</AtButton>
      </form>
    </AtPanel>

    <AtPanel
      v-if="store.project.libraries?.length"
      title="Unassigned .cpp files"
      description="Choose a destination, then click a source file to assign it."
    >
      <AtSelect
        id="assignment-library"
        v-model="selectedLibraryName"
        label="Assign to"
        :options="libraryOptions"
      />
      <div v-if="store.unassigned_source_compilation_units.length" class="grid gap-2">
        <button
          v-for="unit in store.unassigned_source_compilation_units"
          :key="unit.path"
          type="button"
          class="rounded-md border border-dashed border-blue-300 bg-blue-50 px-3 py-2 text-left font-mono text-sm text-blue-900 transition hover:border-blue-600 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-100"
          @click="assign(unit.path)"
        >
          + {{ unit.path }}
        </button>
      </div>
      <p v-else class="text-sm text-gray-500">Every .cpp file has a library.</p>

      <template v-if="store.unassigned_types.length">
        <h3 class="pt-2 font-semibold text-gray-900 dark:text-white">Unassigned reusable types</h3>
        <button
          v-for="type in store.unassigned_types"
          :key="cppTypeKey(type)"
          type="button"
          class="block w-full rounded-md border border-dashed border-blue-300 bg-blue-50 px-3 py-2 text-left font-mono text-sm text-blue-900 transition hover:border-blue-600 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-100"
          @click="assignType(cppTypeKey(type))"
        >
          + {{ cppTypeKey(type) }}
        </button>
      </template>
    </AtPanel>

    <div v-if="store.project.libraries?.length" class="grid gap-4 lg:grid-cols-2">
      <AtPanel
        v-for="library in store.project.libraries"
        :key="library.name"
        :title="library.name"
        :description="`${library.kind} library · click a source to unassign it`"
      >
        <div v-if="library.compilation_units.length" class="grid gap-2">
          <button
            v-for="path in library.compilation_units"
            :key="path"
            type="button"
            class="rounded-md bg-gray-100 px-3 py-2 text-left font-mono text-sm text-gray-800 transition hover:bg-red-50 hover:text-red-800 dark:bg-gray-900 dark:text-gray-200"
            @click="store.unassignLibraryUnit(library, path)"
          >
            {{ path }} <span class="float-right font-sans text-xs">Unassign</span>
          </button>
        </div>
        <p v-else class="text-sm text-gray-500">No .cpp files assigned yet.</p>
        <template v-if="library.types.length">
          <h3 class="pt-2 text-sm font-semibold text-gray-900 dark:text-white">Reusable types</h3>
          <button
            v-for="type in library.types"
            :key="type"
            type="button"
            class="block w-full rounded-md bg-gray-100 px-3 py-2 text-left font-mono text-sm text-gray-800 transition hover:bg-red-50 hover:text-red-800 dark:bg-gray-900 dark:text-gray-200"
            @click="store.unassignLibraryType(library, type)"
          >
            {{ type }} <span class="float-right font-sans text-xs">Unassign</span>
          </button>
        </template>
        <AtButton tone="danger" @click="store.removeLibrary(library)">Delete library</AtButton>
      </AtPanel>
    </div>

    <p v-else class="rounded-lg border border-dashed p-6 text-center text-gray-500">
      Add a library to begin assigning generated and authored .cpp files.
    </p>
  </main>
</template>
