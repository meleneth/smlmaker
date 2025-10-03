import { reactive, computed, ref } from 'vue'
import { defineStore } from 'pinia'
import pako from 'pako'

import type {
  NamespaceName,
  EventName,
  Machine,
  StateName,
  GuardName,
  ActionName,
  Project,
  Transition,
} from '@/types'

export const useProjectStore = defineStore('project', () => {
  const project = ref<Project>({
    name: '',
    namespaces: [],
    machines: [],
  })

  function addMachine(name: string, namespace: string): Machine {
    const new_machine = reactive<Machine>({
      name: name,
      namespace: namespace,
      events: [],
      states: [],
      transitions: [],
      guards: [],
      context: false,
      actions: [],
    })
    project.value.machines.push(new_machine)
    return new_machine
  }

  function addNamespace(name: NamespaceName) {
    project.value.namespaces.push(name)
  }

  function removeMachine(machineToRemove: Machine) {
    project.value.machines = project.value.machines.filter((machine) => machine !== machineToRemove)
  }

  function removeNamespace(namespaceToRemove: NamespaceName) {
    project.value.namespaces = project.value.namespaces.filter(
      (namespace) => namespace !== namespaceToRemove
    )
  }

  function addEventToMachine(name: EventName, machine: Machine) {
    machine.events.push(name)
  }

  function removeEventFromMachine(eventToRemove: EventName, machine: Machine) {
    machine.events = machine.events.filter((event) => event !== eventToRemove)
  }

  function addStateToMachine(name: StateName, machine: Machine) {
    machine.states.push(name)
  }

  function removeStateFromMachine(stateToRemove: StateName, machine: Machine) {
    machine.events = machine.events.filter((state) => state !== stateToRemove)
  }

  function addActionToMachine(name: ActionName, machine: Machine) {
    machine.actions.push(name)
  }

  function addActionToTransition(name: ActionName, transition: Transition) {
    transition.actions.push(name)
  }

  function addGuardToMachine(name: GuardName, machine: Machine) {
    machine.guards.push(name)
  }

  function addGuardToTransition(name: GuardName, transition: Transition) {
    transition.guard = name
  }

  function removeGuardFromMachine(guardToRemove: GuardName, machine: Machine) {
    machine.guards = machine.guards.filter((guard) => guard !== guardToRemove)
  }

  function addTransitionToMachine(
    startState: StateName,
    event: EventName,
    targetState: StateName,
    machine: Machine
  ): Transition {
    const new_transition = reactive<Transition>({
      event: event,
      start_state: startState,
      target_state: targetState,
      actions: [],
    })
    machine.transitions.push(new_transition)
    return new_transition
  }

  function generateExport(): string {
    const jsonString = JSON.stringify(project.value)
    const gzippedData = pako.gzip(jsonString)
    // spread because it spreads the Uint8Array into indivual bytes
    // which from CharCode turns into characters
    const base64Encoded = btoa(String.fromCharCode(...gzippedData))

    const lines = []
    for (let i = 0; i < base64Encoded.length; i += 78) {
      lines.push(`# ${base64Encoded.slice(i, i + 78)}`)
    }

    return lines.join('\n')
  }

  function hydrateExport(export_text: string): void {
    console.log('Hydrating export')
    try {
      const parsedJson = JSON.parse(export_text)
      if (typeof parsedJson === 'object' && parsedJson !== null) {
        console.log('Parsed JSON success!')
        project.value = parsedJson
        return
      }
    } catch {
      //
    }

    const base64Data = export_text
      .split('\n')
      .map((line) => (line.startsWith('# ') ? line.slice(2) : line))
      .join('')

    const binaryString = atob(base64Data)

    const binaryData = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      binaryData[i] = binaryString.charCodeAt(i)
    }

    const decompressedData = pako.inflate(binaryData, { to: 'string' })
    console.log('Decompressed Data')
    const parsed = JSON.parse(decompressedData)
    console.log('Parsing compressed JSON success!')
    project.value = parsed
  }

  type MachinesByNamespace = Record<NamespaceName, Machine[]>

  const machinesByNamespace = computed(() => {
    const results: MachinesByNamespace = {} as MachinesByNamespace
    project.value.namespaces.forEach((namespace) => {
      results[namespace] = []
    })

    project.value.machines.forEach((machine) => {
      results[machine.namespace].push(machine)
    })
    return results
  })

  const get_machine_header = computed(() => {
    return (machine: Machine) => {
      const lines = <string[]>[]
      lines.push("#pragma once")
      return lines.join('\n')
    }
  })

  const get_machine_source = computed(() => {
    return (machine: Machine) => {
      const lines = <string[]>[]
      return lines.join('\n')
    }
  })

  return {
    project,
    addMachine,
    addNamespace,
    addEventToMachine,
    addStateToMachine,
    addGuardToMachine,
    addTransitionToMachine,
    machinesByNamespace,
    generateExport,
    get_machine_header,
    get_machine_source,
    hydrateExport,
    removeMachine,
    removeNamespace,
    addGuardToTransition,
    addActionToTransition,
    addActionToMachine,
    removeEventFromMachine,
    removeGuardFromMachine,
    removeStateFromMachine,
  }
})
