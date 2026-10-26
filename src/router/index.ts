// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import AboutView from '@/views/AboutView.vue'
import ProjectView from '@/views/ProjectView.vue'
import MachinesView from '@/views/MachinesView.vue'
import TypesView from '@/views/TypesView.vue'
import BuildView from '@/views/BuildView.vue'
import NamespacesView from '@/views/NamespacesView.vue'
import LibrariesView from '@/views/LibrariesView.vue'
import EventsView from '@/views/EventsView.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
  },
  {
    path: '/project',
    name: 'project',
    component: ProjectView,
  },
  {
    path: '/namespaces',
    name: 'namespaces',
    component: NamespacesView,
  },
  {
    path: '/machines',
    name: 'machines',
    component: MachinesView,
  },
  {
    path: '/events',
    name: 'events',
    component: EventsView,
  },
  {
    path: '/libraries',
    name: 'libraries',
    component: LibrariesView,
  },
  {
    path: '/types',
    name: 'types',
    component: TypesView,
  },
  {
    path: '/build',
    name: 'build',
    component: BuildView,
  },
  {
    path: '/about',
    name: 'About',
    component: AboutView,
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
