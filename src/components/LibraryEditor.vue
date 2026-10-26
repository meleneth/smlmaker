<script setup lang="ts">
import AtButton from '@/components/appTulsa/AtButton.vue'
import AtCheckbox from '@/components/appTulsa/AtCheckbox.vue'
import AtPanel from '@/components/appTulsa/AtPanel.vue'
import { useProjectStore } from '@/stores/project'
import { cppTypeKey } from '@/generators/cpp'
import { OPTIONAL_DEPENDENCIES } from '@/generators/project'
import type { LibraryTarget } from '@/types'

defineProps<{ library: LibraryTarget }>()
const store = useProjectStore()
</script>

<template>
  <AtPanel :title="library.name" :description="`${library.kind} library`">
    <p class="text-sm font-medium">Compilation units</p>
    <AtCheckbox
      v-for="unit in store.source_compilation_units"
      :id="`library-${library.name}-${unit.path}`"
      :key="unit.path"
      :label="unit.path"
      :model-value="library.compilation_units.includes(unit.path)"
      @update:model-value="store.toggleLibraryUnit(library, unit.path, $event)"
    />
    <p class="pt-2 text-sm font-medium">Optional dependencies</p>
    <div class="grid gap-2 md:grid-cols-2">
      <AtCheckbox
        v-for="dependency in OPTIONAL_DEPENDENCIES"
        :id="`library-${library.name}-dependency-${dependency.id}`"
        :key="dependency.id"
        :label="dependency.label"
        :model-value="library.dependencies.includes(dependency.id)"
        @update:model-value="store.toggleLibraryDependency(library, dependency.id, $event)"
      />
    </div>
    <p class="pt-2 text-sm font-medium">Types declared by this library</p>
    <AtCheckbox
      v-for="type in store.project.types"
      :id="`library-${library.name}-type-${cppTypeKey(type)}`"
      :key="cppTypeKey(type)"
      :label="cppTypeKey(type)"
      :model-value="library.types.includes(cppTypeKey(type))"
      @update:model-value="store.toggleLibraryType(library, cppTypeKey(type), $event)"
    />
    <AtButton tone="danger" @click="store.removeLibrary(library)">Delete library</AtButton>
  </AtPanel>
</template>
