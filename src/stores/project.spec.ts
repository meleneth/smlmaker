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
})
