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

  it('leaves generated sources unassigned until a library is chosen', () => {
    const projectStore = useProjectStore()
    projectStore.addNamespace('app')
    projectStore.addMachine('Machine', 'app')

    expect(projectStore.project.libraries).toEqual([])
    expect(projectStore.unassigned_source_compilation_units.map((unit) => unit.path)).toEqual([
      'src/app/Machine.cpp',
    ])

    const core = projectStore.addLibrary('core', 'STATIC')!
    const ui = projectStore.addLibrary('ui', 'SHARED')!
    projectStore.assignLibraryUnit(core, 'src/app/Machine.cpp')
    projectStore.assignLibraryUnit(ui, 'src/app/Machine.cpp')

    expect(core.compilation_units).toEqual([])
    expect(ui.compilation_units).toEqual(['src/app/Machine.cpp'])
    expect(projectStore.unassigned_source_compilation_units).toEqual([])

    projectStore.unassignLibraryUnit(ui, 'src/app/Machine.cpp')
    expect(projectStore.unassigned_source_compilation_units).toHaveLength(1)
  })

  it('keeps SDL2 and SDL3 mutually exclusive across library targets', () => {
    const projectStore = useProjectStore()
    const core = projectStore.addLibrary('core', 'STATIC')!
    const ui = projectStore.addLibrary('ui', 'STATIC')!

    projectStore.toggleLibraryDependency(core, 'sdl2', true)
    projectStore.toggleLibraryDependency(ui, 'sdl3', true)

    expect(core.dependencies).not.toContain('sdl2')
    expect(ui.dependencies).toContain('sdl3')
  })

  it('assigns reusable types explicitly and exclusively', () => {
    const projectStore = useProjectStore()
    projectStore.addNamespace('app')
    projectStore.addType('Settings', 'app')
    const core = projectStore.addLibrary('core', 'STATIC')!

    expect(projectStore.unassigned_types).toHaveLength(1)
    projectStore.assignLibraryType(core, 'app::Settings')
    expect(projectStore.unassigned_types).toEqual([])

    projectStore.unassignLibraryType(core, 'app::Settings')
    expect(projectStore.unassigned_types).toHaveLength(1)
  })

  it('defines eventpp payloads and cascades their SML handler targets', () => {
    const projectStore = useProjectStore()
    projectStore.addNamespace('game')
    const machine = projectStore.addMachine('Race', 'game')
    projectStore.addEventToMachine('Start', machine)
    const event = projectStore.addEvent('RaceStarted', 'game')!

    expect(
      projectStore.addFieldToEvent(event, {
        name: 'race_id',
        type: 'std::uint64_t',
        value: '0',
      })
    ).toBe(true)
    expect(
      projectStore.addEventHandler(event, {
        machine_namespace: 'game',
        machine_name: 'Race',
        machine_event: 'Start',
      })
    ).toBe(true)
    expect(event.handlers).toHaveLength(1)

    projectStore.removeEventFromMachine('Start', machine)
    expect(event.handlers).toEqual([])
  })
})
