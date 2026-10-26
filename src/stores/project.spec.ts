import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

import { useProjectStore } from './project'

describe('project Store', () => {
  beforeEach(() => {
    // creates a fresh pinia and makes it active
    // so it's automatically picked up by any useStore() call
    setActivePinia(createPinia())
  })

  it('#addNamespace', () => {
    const project_store = useProjectStore()
    project_store.addNamespace('myNamespace')
    expect(project_store.project.namespaces[0]).toEqual('myNamespace')
  })

  it('#addMachine', () => {
    const project_store = useProjectStore()
    project_store.addNamespace('myNamespace')
    project_store.addMachine('myMachine', 'myNamespace')
    const myMachine = project_store.project.machines[0]
    expect(myMachine.name).toEqual('myMachine')
  })

  it('#addEventToMachine', () => {
    const project_store = useProjectStore()
    project_store.addNamespace('myNamespace')
    project_store.addMachine('myMachine', 'myNamespace')
    const myMachine = project_store.project.machines[0]
    project_store.addEventToMachine('myEvent', myMachine)
    expect(myMachine.events[0]).toEqual('myEvent')
  })

  it('#addStateToMachine', () => {
    const project_store = useProjectStore()
    project_store.addNamespace('myNamespace')
    project_store.addMachine('myMachine', 'myNamespace')
    const myMachine = project_store.project.machines[0]
    project_store.addStateToMachine('myState', myMachine)
    expect(myMachine.states[0]).toEqual('myState')
  })

  it('rejects blank and duplicate names', () => {
    const projectStore = useProjectStore()
    expect(projectStore.addNamespace('')).toBe(false)
    expect(projectStore.addNamespace('app')).toBe(true)
    expect(projectStore.addNamespace(' app ')).toBe(false)

    const machine = projectStore.addMachine('Machine', 'app')
    expect(projectStore.addStateToMachine('Idle', machine)).toBe(true)
    expect(projectStore.addStateToMachine('Idle', machine)).toBe(false)
    expect(projectStore.addEventToMachine('   ', machine)).toBe(false)
  })

  it('cascades removals through transitions and repairs the initial state', () => {
    const projectStore = useProjectStore()
    const machine = projectStore.addMachine('Machine', 'app')
    projectStore.addStateToMachine('Idle', machine)
    projectStore.addStateToMachine('Running', machine)
    projectStore.addEventToMachine('Start', machine)
    projectStore.addGuardToMachine('Ready', machine)
    projectStore.addActionToMachine('Log', machine)
    const transition = projectStore.addTransitionToMachine('Idle', 'Start', 'Running', machine)
    projectStore.addGuardToTransition('Ready', transition)
    projectStore.addActionToTransition('Log', transition)

    projectStore.removeGuardFromMachine('Ready', machine)
    projectStore.removeActionFromMachine('Log', machine)
    expect(transition.guard).toBeUndefined()
    expect(transition.actions).toEqual([])

    projectStore.removeStateFromMachine('Idle', machine)
    expect(machine.states).toEqual(['Running'])
    expect(machine.initial_state).toBe('Running')
    expect(machine.transitions).toEqual([])
  })

  it('removing a namespace also removes its machines', () => {
    const projectStore = useProjectStore()
    projectStore.addNamespace('app')
    projectStore.addMachine('Machine', 'app')
    projectStore.removeNamespace('app')
    expect(projectStore.project.namespaces).toEqual([])
    expect(projectStore.project.machines).toEqual([])
  })
})
