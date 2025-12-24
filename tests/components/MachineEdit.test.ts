import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import MachineEdit from '@/components/MachineEdit.vue'
import { useProjectStore } from '@/stores/project'
import type { Machine } from '@/types'
import { createTestingPinia } from '@pinia/testing'

/**
 * Minimal component stubs with the behaviors MachineEdit expects.
 * We avoid fighting your real appTulsa components or layout components.
 */
const stubs = {
  // Layout: just render slots
  SplitOneOneOneOne: {
    template: `
      <div data-stub="SplitOneOneOneOne">
        <div><slot name="one" /></div>
        <div><slot name="two" /></div>
        <div><slot name="three" /></div>
        <div><slot name="four" /></div>
      </div>
    `,
  },

  // Button: invokes handler on click
  aTButton: {
    props: ['handler'],
    template: `<button data-stub="aTButton" type="button" @click="handler?.()"><slot /></button>`,
  },

  // Input: v-model compatible + emits keyup.enter
  aTInput: {
    props: ['modelValue', 'id'],
    emits: ['update:modelValue', 'keyup'],
    template: `
      <input
        :id="id"
        data-stub="aTInput"
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target ).value)"
        @keyup.enter="$emit('keyup', $event)"
      />
    `,
  },

  // Not needed for these tests (but we can keep it in DOM)
  TransitionEdit: {
    props: ['transition', 'machine'],
    template: `<div data-stub="TransitionEdit"></div>`,
  },

  // ThingCard: render slots
  ThingCard: {
    template: `
      <div data-stub="ThingCard">
        <div data-stub="ThingCardLabel"><slot name="label" /></div>
        <div data-stub="ThingCardBody"><slot /></div>
      </div>
    `,
  },
}

function makeMachine(overrides: Partial<Machine> = {}): Machine {
  return {
    name: 'CombatantFsm',
    states: ['Charging', 'Ready'],
    events: ['Tick', 'Act'],
    guards: ['CanAct'],
    actions: ['SpendResource'],
    transitions: [],
    ...overrides,
  } as Machine
}

describe('MachineEdit', () => {
  let machine: Machine
  let wrapper: VueWrapper
  let store: ReturnType<typeof useProjectStore>

  beforeEach(() => {
    machine = makeMachine()

    wrapper = mount(MachineEdit, {
      props: { machine },
      global: {
        stubs,
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            stubActions: false, // we want to control spies ourselves
          }),
        ],
      },
    })

    store = useProjectStore()

    // Spy the store methods MachineEdit calls.
    // If your store already defines these, this replaces them with spies safely.
    store.addEventToMachine = vi.fn()
    store.addStateToMachine = vi.fn()
    store.addGuardToMachine = vi.fn()
    store.addActionToMachine = vi.fn()
    store.addTransitionToMachine = vi.fn()
    store.get_machine_header = vi.fn().mockReturnValue('// header output')
    store.get_machine_source = vi.fn().mockReturnValue('// source output')
  })

  it('renders the machine name', () => {
    expect(wrapper.text()).toContain('CombatantFsm')
  })

  it('adds a state on enter and clears the input', async () => {
    const input = wrapper.get('#state_to_add_input')

    await input.setValue('Acting')
    await input.trigger('keyup.enter')

    expect(store.addStateToMachine).toHaveBeenCalledWith('Acting', machine)
    expect(input.element.value).toBe('')
  })

  it('adds an event on enter and clears the input', async () => {
    const input = wrapper.get('#event_to_add_input')

    await input.setValue('DamageTaken')
    await input.trigger('keyup.enter')

    expect(store.addEventToMachine).toHaveBeenCalledWith('DamageTaken', machine)
    expect(input.element.value).toBe('')
  })

  it('adds a guard on enter and clears the input', async () => {
    const input = wrapper.get('#guard_to_add_input')

    await input.setValue('HasMana')
    await input.trigger('keyup.enter')

    expect(store.addGuardToMachine).toHaveBeenCalledWith('HasMana', machine)
    expect(input.element.value).toBe('')
  })

  it('adds an action on enter and clears the input', async () => {
    const input = wrapper.get('#action_to_add_input')

    await input.setValue('DealDamage')
    await input.trigger('keyup.enter')

    expect(store.addActionToMachine).toHaveBeenCalledWith('DealDamage', machine)
    expect(input.element.value).toBe('')
  })

  it('clicking "Add State" calls the store method', async () => {
    const buttons = wrapper.findAll('[data-stub="aTButton"]')
    const addStateButton = buttons.find((b) => b.text().includes('Add State'))
    expect(addStateButton).toBeTruthy()

    // prime the input value by using the input (v-model)
    await wrapper.get('#state_to_add_input').setValue('Dead')

    await addStateButton!.trigger('click')

    expect(store.addStateToMachine).toHaveBeenCalledWith('Dead', machine)
  })

  it('clicking "Add Event" calls the store method', async () => {
    const buttons = wrapper.findAll('[data-stub="aTButton"]')
    const addEventButton = buttons.find((b) => b.text().includes('Add Event'))
    expect(addEventButton).toBeTruthy()

    await wrapper.get('#event_to_add_input').setValue('Healed')
    await addEventButton!.trigger('click')

    expect(store.addEventToMachine).toHaveBeenCalledWith('Healed', machine)
  })

  it('clicking "Add Guard" calls addGuardToMachine)', async () => {
    const buttons = wrapper.findAll('[data-stub="aTButton"]')
    const addGuardButton = buttons.find((b) => b.text().includes('Add Guard'))
    expect(addGuardButton).toBeTruthy()

    await wrapper.get('#guard_to_add_input').setValue('IsAlive')
    await addGuardButton!.trigger('click')

    // BUG: in your template, Add Guard button is wired to add_state().
    // This expectation is the correct behavior and should fail until you fix the template.
    expect(store.addGuardToMachine).toHaveBeenCalledWith('IsAlive', machine)
  })

  it('clicking "Add Action" calls addActionToMachine', async () => {
    const buttons = wrapper.findAll('[data-stub="aTButton"]')
    const addActionButton = buttons.find((b) => b.text().includes('Add Action'))
    expect(addActionButton).toBeTruthy()

    await wrapper.get('#action_to_add_input').setValue('ConsumePotion')
    await addActionButton!.trigger('click')

    expect(store.addActionToMachine).toHaveBeenCalledWith('ConsumePotion', machine)
  })

  it('adds a transition using the selected start/event/target', async () => {
    // There are 3 <select> elements in this component
    const selects = wrapper.findAll('select')
    expect(selects.length).toBe(3)

    // start state
    await selects[0].setValue('Charging')
    // event
    await selects[1].setValue('Tick')
    // target state
    await selects[2].setValue('Ready')

    const buttons = wrapper.findAll('[data-stub="aTButton"]')
    const addTransitionButton = buttons.find((b) => b.text().includes('Add Transition'))
    expect(addTransitionButton).toBeTruthy()

    await addTransitionButton!.trigger('click')

    expect(store.addTransitionToMachine).toHaveBeenCalledWith('Charging', 'Tick', 'Ready', machine)
  })

  it('renders the header/source previews using project_store getters', async () => {
    expect(store.get_machine_header).toHaveBeenCalledWith(machine)
    expect(store.get_machine_source).toHaveBeenCalledWith(machine)

    expect(wrapper.text()).toContain('// header output')
    expect(wrapper.text()).toContain('// source output')
  })
})
