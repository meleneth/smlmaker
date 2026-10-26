import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useProjectStore } from './project'
import { generateTypeHeader } from '@/generators/cpp'

describe('C++ generation', () => {
  beforeEach(() => setActivePinia(createPinia()))

  function populatedMachine() {
    const store = useProjectStore()
    store.addNamespace('game')
    const machine = store.addMachine('Door', 'game')
    store.addStateToMachine('Closed', machine)
    store.addStateToMachine('Open', machine)
    store.addEventToMachine('OpenRequested', machine)
    store.addEventToMachine('CloseRequested', machine)
    store.addGuardToMachine('CanOpen', machine)
    store.addActionToMachine('RecordOpen', machine)
    const transition = store.addTransitionToMachine('Closed', 'OpenRequested', 'Open', machine)
    store.addGuardToTransition('CanOpen', transition)
    store.addActionToTransition('RecordOpen', transition)
    store.addTransitionToMachine('Open', 'CloseRequested', 'Closed', machine)
    return { store, machine }
  }

  it('generates a correctly shaped eventpp heterogeneous dispatcher', () => {
    const { store, machine } = populatedMachine()
    const header = store.get_machine_events_header(machine)

    expect(header).toContain('eventpp::HeterTuple<void(const Events&)...>')
    expect(header).toContain('eventpp::HeterEventDispatcher<std::type_index, Prototypes>')
    expect(header).toContain('dispatcher_.appendListener(')
    expect(header).toContain('dispatcher_.dispatch(std::type_index(typeid(Event)), event)')
    expect(header).toContain('class DoorTypedEventBus')
    expect(header).toContain(
      'using DoorEventBus = DoorTypedEventBus<DoorEvents::OpenRequested, DoorEvents::CloseRequested>'
    )
  })

  it('shares public event types between eventpp and Boost.SML', () => {
    const { store, machine } = populatedMachine()
    const header = store.get_machine_header(machine)
    const source = store.get_machine_source(machine)

    expect(header).toContain('#include "Door_events.hpp"')
    expect(header).toContain('DoorEventBus& event_bus() noexcept;')
    expect(source).not.toContain('struct OpenRequested {};')
    expect(source).toContain('using OpenRequested = DoorEvents::OpenRequested;')
    expect(source).toContain(
      'bus.on<game::DoorEvents::OpenRequested>([this](const game::DoorEvents::OpenRequested& value) { sm.process_event(value); });'
    )
    expect(source).toContain(
      'void Door::OpenRequested() { impl_->bus.emit(game::DoorEvents::OpenRequested{}); }'
    )
  })

  it('generates explicit initial state, context, guard expression, and action body', () => {
    const { store, machine } = populatedMachine()
    store.setInitialState(machine, 'Open')
    store.enableContext(machine, 'DoorContext')
    store.addContextEntry(machine, { name: 'open_count', type: 'int', value: '0' })
    store.setGuardCode(machine, 'CanOpen', 'context.open_count < 3')
    store.setActionCode(machine, 'RecordOpen', '++context.open_count;')

    const header = store.get_machine_header(machine)
    const source = store.get_machine_source(machine)
    expect(header).toContain('struct DoorContext')
    expect(header).toContain('int open_count = 0;')
    expect(source).toContain('bool operator()(DoorContext& context) const')
    expect(source).toContain('return (context.open_count < 3);')
    expect(source).toContain('++context.open_count;')
    expect(source).toContain('*state<Open> + event<CloseRequested>')
    expect(source).not.toContain('const auto const&')
  })

  it('sanitizes keywords and provides all downloadable files', () => {
    const store = useProjectStore()
    const machine = store.addMachine('class', 'namespace')
    store.addStateToMachine('1 idle', machine)
    store.addEventToMachine('switch', machine)
    store.addTransitionToMachine('1 idle', 'switch', '1 idle', machine)

    const files = store.get_machine_files(machine)
    expect(files.map((file) => file.name)).toEqual([
      'class__events.hpp',
      'class_.hpp',
      'class_.cpp',
    ])
    expect(files[2].contents).toContain('namespace namespace_')
    expect(files[2].contents).toContain('event<switch_>')
  })

  it('reports incomplete machines and sanitized identifier collisions', () => {
    const store = useProjectStore()
    const machine = store.addMachine('Machine', 'app')
    store.addStateToMachine('idle-state', machine)
    store.addStateToMachine('idle state', machine)

    expect(store.validate_machine(machine)).toEqual(
      expect.arrayContaining([
        'Add at least one event.',
        'Add at least one transition.',
        'Duplicate state C++ identifier(s): idle_state.',
      ])
    )
  })

  it('keeps an initial state valid even when it has no outgoing transition', () => {
    const { store, machine } = populatedMachine()
    store.addStateToMachine('Waiting', machine)
    store.setInitialState(machine, 'Waiting')

    const source = store.get_machine_source(machine)
    expect(source).toContain('struct InitialStateMarkerEvent {};')
    expect(source).toContain('*state<Waiting> + event<InitialStateMarkerEvent> = state<Waiting>')
  })

  it('generates borrowed context objects with raw pointers and reference accessors', () => {
    const header = generateTypeHeader({
      name: 'PartyCtx',
      namespace: 'game',
      kind: 'context',
      includes: [],
      fields: [
        { name: 'registry', type: 'Registry', value: '' },
        { name: 'log', type: 'Log', value: '' },
      ],
    })

    expect(header).toContain('PartyCtx(Registry& registry, Log& log)')
    expect(header).toContain('registry_{&registry}')
    expect(header).toContain('Registry& registry() const { return *registry_; }')
    expect(header).toContain('Registry* registry_{};')
  })
})
