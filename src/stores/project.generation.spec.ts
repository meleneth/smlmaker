import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

import { useProjectStore } from './project'

describe('project Store generation', () => {
  beforeEach(() => {
    // creates a fresh pinia and makes it active
    // so it's automatically picked up by any useStore() call
    setActivePinia(createPinia())
  })

  it('#get_machine_header', () => {
    const project_store = useProjectStore()
    project_store.addNamespace('myNamespace')
    const machine = project_store.addMachine('myMachine', 'myNamespace')
    project_store.addStateToMachine('someState', machine)
    project_store.addStateToMachine('otherState', machine)
    project_store.addStateToMachine('triState', machine)
    project_store.addEventToMachine('someEvent', machine)
    project_store.addGuardToMachine('someGuard', machine)
    project_store.addActionToMachine('someAction', machine)
    project_store.addActionToMachine('otherAction', machine)
    const transition = project_store.addTransitionToMachine(
      'someState',
      'someEvent',
      'otherState',
      machine
    )
    const expected_contents = `#pragma once`

    expect(project_store.get_machine_header(machine)).toEqual(expected_contents)
  })

  it('#get_machine_source', () => {
    const project_store = useProjectStore()
    project_store.addNamespace('myNamespace')
    const machine = project_store.addMachine('myMachine', 'myNamespace')
    project_store.addStateToMachine('someState', machine)
    project_store.addStateToMachine('otherState', machine)
    project_store.addStateToMachine('triState', machine)
    project_store.addEventToMachine('someEvent', machine)
    project_store.addGuardToMachine('someGuard', machine)
    project_store.addActionToMachine('someAction', machine)
    project_store.addActionToMachine('otherAction', machine)
    const transition = project_store.addTransitionToMachine(
      'someState',
      'someEvent',
      'otherState',
      machine
    )
    const expected_contents = ``

    expect(project_store.get_machine_header(machine)).toEqual(expected_contents)
  })
})
