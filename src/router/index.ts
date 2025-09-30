// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import AboutView from '@/views/AboutView.vue'
import ProjectView from '@/views/ProjectView.vue'
import MachinesView from '@/views/MachinesView.vue'

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
    path: '/machines',
    name: 'machines',
    component: MachinesView,
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
