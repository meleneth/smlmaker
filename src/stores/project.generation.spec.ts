import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

import { useProjectStore } from './project'

describe('project Store generation', () => {
  beforeEach(() => {
    // creates a fresh pinia and makes it active
    // so it's automatically picked up by any useStore() call
    setActivePinia(createPinia())
  })

  it('#get_machine_events_header_typed_bus_no_id', () => {
    const project_store = useProjectStore()
    project_store.addNamespace('someNamespace')
    const machine = project_store.addMachine('aMachine', 'someNamespace')
    project_store.addEventToMachine('someEvent', machine)

    expect(project_store.get_machine_events_header(machine)).toContain('HeterEventDispatcher')
    expect(project_store.get_machine_events_header(machine)).toContain('static_assert')
  })

  it('#get_machine_events_header (typed bus, no id)', () => {
    const project_store = useProjectStore()
    project_store.addNamespace('someNamespace')
    const machine = project_store.addMachine('aMachine', 'someNamespace')
    project_store.addEventToMachine('someEvent', machine)

    const expected_contents = `#pragma once
#include <type_traits>
#include <utility>

#include <eventpp/hetereventdispatcher.h>

namespace someNamespace {

// ---- events ----
struct someEvent {};

// ---- typed bus ----
// No runtime ids. Only types listed here can be emitted/listened to.
template <class... Es>
class TypedBus {
public:
  template <class E, class Fn>
  void on(Fn&& fn) {
    static_assert((std::is_same_v<E, Es> || ...), "Event type not registered in this bus");
    dispatcher_.template appendListener<E>(std::forward<Fn>(fn));
  }

  template <class E>
  void emit(const E& ev) {
    static_assert((std::is_same_v<E, Es> || ...), "Event type not registered in this bus");
    dispatcher_.template dispatch<E>(ev);
  }

private:
  eventpp::HeterEventDispatcher<void(const Es&)...> dispatcher_;
};

using aMachineBus = TypedBus<someEvent>;

} // namespace someNamespace
`

    expect(project_store.get_machine_events_header(machine)).toEqual(expected_contents)
  })

  it('#get_machine_header', () => {
    const project_store = useProjectStore()
    project_store.addNamespace('someNamespace')
    const machine = project_store.addMachine('aMachine', 'someNamespace')
    project_store.addStateToMachine('someState', machine)
    project_store.addStateToMachine('otherState', machine)
    project_store.addStateToMachine('triState', machine)
    project_store.addEventToMachine('someEvent', machine)
    project_store.addGuardToMachine('someGuard', machine)
    project_store.addActionToMachine('someAction', machine)
    project_store.addActionToMachine('otherAction', machine)
    project_store.addTransitionToMachine('someState', 'someEvent', 'otherState', machine)
    const expected_contents = `#pragma once
#include <memory>

namespace someNamespace {

class aMachine {
public:
  aMachine();
  ~aMachine();

  aMachine(aMachine&&) noexcept;
  aMachine& operator=(aMachine&&) noexcept;

  aMachine(const aMachine&) = delete;
  aMachine& operator=(const aMachine&) = delete;

  void someEvent();

private:
  struct Impl;
  std::unique_ptr<Impl> impl;
};

} // namespace someNamespace
`

    expect(project_store.get_machine_header(machine)).toEqual(expected_contents)
  })

  it('#get_machine_source', () => {
    const project_store = useProjectStore()
    project_store.addNamespace('someNamespace')
    const machine = project_store.addMachine('aMachine', 'someNamespace')
    project_store.addStateToMachine('someState', machine)
    project_store.addStateToMachine('otherState', machine)
    project_store.addStateToMachine('triState', machine)
    project_store.addEventToMachine('someEvent', machine)
    project_store.addGuardToMachine('aGuard', machine)
    project_store.addActionToMachine('anAction', machine)

    const transition = project_store.addTransitionToMachine(
      'someState',
      'someEvent',
      'otherState',
      machine
    )

    project_store.addGuardToTransition('aGuard', transition)
    project_store.addActionToTransition('anAction', transition)

    const expected_contents = `#include "aMachine.hpp"
#include <boost/sml.hpp>
#include <memory>
#include <utility>

namespace sml = boost::sml;

namespace someNamespace {

namespace { // TU-local internals (hidden from headers)

// ---- events ----
struct someEvent {};

// ---- state tags ----
struct someState {};
struct otherState {};
struct triState {};

// ---- actions ----
struct anAction {
  void operator()(const someEvent&) const noexcept {
    // TODO: side-effects for action "anAction"
  }
};

// ---- guards ----
struct aGuard {
  bool operator()(const someEvent&) const noexcept {
    // TODO: predicate for guard "aGuard"
    return true;
  }
};

// ---- transition table ----
struct aMachineTable {
  auto operator()() const {
    using sml::event;
    using sml::state;
    using sml::make_transition_table;

    return make_transition_table(
      *state<someState> + event<someEvent> [aGuard{}] / anAction{} = state<otherState>
    );
  }
};

} // anonymous namespace

// ---- PIMPL ----
struct aMachine::Impl {
  sml::sm<aMachineTable> sm;

  void someEvent() { sm.process_event(someEvent{}); }
};

// ---- public API ----
aMachine::aMachine() : impl(std::make_unique<Impl>()) {}
aMachine::~aMachine() = default;

aMachine::aMachine(aMachine&&) noexcept = default;
aMachine& aMachine::operator=(aMachine&&) noexcept = default;

void aMachine::someEvent() { impl->someEvent(); }

} // namespace someNamespace
`

    expect(project_store.get_machine_source(machine)).toEqual(expected_contents)
  })
})
