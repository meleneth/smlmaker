<script setup lang="ts">
import { computed, ref } from 'vue'

import AtButton from '@/components/appTulsa/AtButton.vue'
import AtField from '@/components/appTulsa/AtField.vue'
import AtPanel from '@/components/appTulsa/AtPanel.vue'
import { useProjectStore } from '@/stores/project'
import type { CppType } from '@/types'

const props = defineProps<{ type: CppType }>()
const store = useProjectStore()
const fieldName = ref('')
const fieldType = ref('')
const fieldValue = ref('')
const includes = computed({
  get: () => props.type.includes.join(', '),
  set: (value: string | number) => store.setTypeIncludes(props.type, String(value)),
})

function addField() {
  if (
    store.addFieldToType(props.type, {
      name: fieldName.value,
      type: fieldType.value,
      value: fieldValue.value,
    })
  ) {
    fieldName.value = ''
    fieldType.value = ''
    fieldValue.value = ''
  }
}
</script>

<template>
  <AtPanel
    :title="`${type.namespace}::${type.name}`"
    :description="
      type.kind === 'context'
        ? 'Borrowed context: raw-pointer members with reference accessors'
        : 'Reusable value type'
    "
  >
    <AtField
      :id="`includes-${type.namespace}-${type.name}`"
      v-model="includes"
      label="Required headers (comma-separated)"
      placeholder='string, chrono, "other/Type.hpp"'
    />
    <div class="space-y-2">
      <div
        v-for="field in type.fields"
        :key="field.name"
        class="flex items-center justify-between rounded bg-gray-50 p-2 dark:bg-gray-900"
      >
        <code v-if="type.kind === 'context'"
          >{{ field.type }}& {{ field.name }}() → {{ field.type }}*</code
        >
        <code v-else
          >{{ field.type }} {{ field.name }}{{ field.value ? ` = ${field.value}` : '{}' }}</code
        >
        <AtButton tone="danger" @click="store.removeFieldFromType(type, field)">Remove</AtButton>
      </div>
    </div>
    <div class="grid gap-2" :class="type.kind === 'context' ? 'md:grid-cols-2' : 'md:grid-cols-3'">
      <AtField :id="`field-type-${type.name}`" v-model="fieldType" label="C++ type" />
      <AtField
        :id="`field-name-${type.name}`"
        v-model="fieldName"
        :label="type.kind === 'context' ? 'Accessor name' : 'Field name'"
      />
      <AtField
        v-if="type.kind !== 'context'"
        :id="`field-value-${type.name}`"
        v-model="fieldValue"
        label="Default value"
      />
    </div>
    <div class="flex justify-between">
      <AtButton @click="addField">Add field</AtButton>
      <AtButton tone="danger" @click="store.removeType(type)">Delete type</AtButton>
    </div>
  </AtPanel>
</template>
