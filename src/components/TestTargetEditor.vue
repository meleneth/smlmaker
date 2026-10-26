<script setup lang="ts">
import AtButton from '@/components/appTulsa/AtButton.vue'
import AtCheckbox from '@/components/appTulsa/AtCheckbox.vue'
import AtPanel from '@/components/appTulsa/AtPanel.vue'
import { useProjectStore } from '@/stores/project'
import type { TestTarget } from '@/types'

defineProps<{ target: TestTarget }>()
const store = useProjectStore()
</script>

<template>
  <AtPanel :title="target.name" description="Catch2 executable registered with CTest">
    <div class="grid gap-4 md:grid-cols-2">
      <div>
        <p class="mb-2 text-sm font-medium">Test compilation units</p>
        <AtCheckbox
          v-for="unit in store.test_compilation_units"
          :id="`test-${target.name}-${unit.path}`"
          :key="unit.path"
          :label="unit.path"
          :model-value="target.compilation_units.includes(unit.path)"
          @update:model-value="store.toggleTestUnit(target, unit.path, $event)"
        />
      </div>
      <div>
        <p class="mb-2 text-sm font-medium">Linked libraries</p>
        <AtCheckbox
          v-for="library in store.project.libraries"
          :id="`test-${target.name}-library-${library.name}`"
          :key="library.name"
          :label="library.name"
          :model-value="target.libraries.includes(library.name)"
          @update:model-value="store.toggleTestLibrary(target, library.name, $event)"
        />
      </div>
    </div>
    <AtButton tone="danger" @click="store.removeTestTarget(target)">Delete test target</AtButton>
  </AtPanel>
</template>
