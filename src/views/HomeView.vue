<script setup lang="ts">
import { RouterLink } from 'vue-router'

import { useProjectStore } from '@/stores/project'

const store = useProjectStore()

const concepts = [
  {
    to: '/project',
    title: 'Project',
    description: 'Name, import, export, and download the project.',
  },
  {
    to: '/namespaces',
    title: 'Namespaces',
    description: 'Define the C++ namespaces used by the project.',
  },
  {
    to: '/machines',
    title: 'Machines',
    description: 'Grow state machines from states, transition events, guards, and actions.',
  },
  {
    to: '/events',
    title: 'Events',
    description: 'Design the typed messages carried by the eventpp event bus.',
  },
  { to: '/types', title: 'Types', description: 'Create reusable context and data types.' },
  {
    to: '/libraries',
    title: 'Libraries',
    description: 'Create targets and assign their .cpp files.',
  },
  { to: '/build', title: 'Build', description: 'Choose dependencies, tests, and CMake settings.' },
]
</script>

<template>
  <main class="mx-auto max-w-5xl space-y-8">
    <header class="space-y-2 text-center">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
        {{ store.project.name || 'Your SML project' }}
      </h1>
      <p class="text-gray-600 dark:text-gray-300">
        Start with a namespace, then grow the project one concept at a time.
      </p>
    </header>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <RouterLink
        v-for="concept in concepts"
        :key="concept.to"
        :to="concept.to"
        class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
      >
        <h2 class="font-bold text-gray-900 dark:text-white">{{ concept.title }}</h2>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">{{ concept.description }}</p>
      </RouterLink>
    </div>
  </main>
</template>
