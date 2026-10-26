import { cppIdentifier } from '@/generators/cpp'
import type { EventDefinition, Project } from '@/types'

function unique(values: string[]): string[] {
  return [...new Set(values)]
}

export function eventKey(event: Pick<EventDefinition, 'namespace' | 'name'>): string {
  return `${event.namespace}::${event.name}`
}

export function eventHeaderPath(event: EventDefinition): string {
  return `src/${cppIdentifier(event.namespace, 'global')}/${cppIdentifier(event.name, 'Event')}.hpp`
}

export function generateEventHeader(event: EventDefinition): string {
  const namespace = cppIdentifier(event.namespace, 'global')
  const name = cppIdentifier(event.name, 'Event')
  const includes = unique(event.includes.map((include) => include.trim()).filter(Boolean))
    .map((include) =>
      include.startsWith('<') || include.startsWith('"')
        ? `#include ${include}`
        : `#include <${include}>`
    )
    .join('\n')
  const fields = event.fields
    .map((field) => {
      const initializer = field.value.trim() ? ` = ${field.value.trim()}` : '{}'
      return `  ${field.type.trim()} ${cppIdentifier(field.name)}${initializer};`
    })
    .join('\n')

  return `#pragma once
${includes ? `${includes}\n` : ''}
namespace ${namespace} {

struct ${name} {
${fields}
};

} // namespace ${namespace}
`
}

export function generateEventBusHeader(projectName: string, events: EventDefinition[]): string {
  const namespace = `${cppIdentifier(projectName, 'smlmaker')}_events`
  const includes = events
    .map((event) => `#include "${eventHeaderPath(event).replace(/^src\//, '')}"`)
    .join('\n')
  const qualifiedEvents = events.map(
    (event) =>
      `::${cppIdentifier(event.namespace, 'global')}::${cppIdentifier(event.name, 'Event')}`
  )

  return `#pragma once
#include <type_traits>
#include <typeindex>
#include <utility>

#include <eventpp/hetereventdispatcher.h>
${includes ? `${includes}\n` : ''}
namespace ${namespace} {

template <class... Events>
class TypedEventBus {
  using Prototypes = eventpp::HeterTuple<void(const Events&)...>;
  using Dispatcher = eventpp::HeterEventDispatcher<std::type_index, Prototypes>;

public:
  using Handle = typename Dispatcher::Handle;

  template <class Event, class Listener>
  Handle on(Listener&& listener) {
    static_assert((std::is_same_v<Event, Events> || ...), "Event is not registered");
    return dispatcher_.appendListener(
      std::type_index(typeid(Event)), std::forward<Listener>(listener));
  }

  template <class Event>
  void emit(const Event& event = {}) const {
    static_assert((std::is_same_v<Event, Events> || ...), "Event is not registered");
    dispatcher_.dispatch(std::type_index(typeid(Event)), event);
  }

  template <class Event>
  bool remove(const Handle& handle) {
    static_assert((std::is_same_v<Event, Events> || ...), "Event is not registered");
    return dispatcher_.removeListener(std::type_index(typeid(Event)), handle);
  }

private:
  Dispatcher dispatcher_;
};

using EventBus = TypedEventBus<${qualifiedEvents.join(', ')}>;

} // namespace ${namespace}
`
}

export function generateEventHandlersHeader(project: Project): string {
  const mappings = (project.events ?? []).flatMap((event) =>
    (event.handlers ?? []).map((handler) => ({ event, handler }))
  )
  const machines = [
    ...new Map(
      mappings.map(({ handler }) => [
        `${handler.machine_namespace}::${handler.machine_name}`,
        handler,
      ])
    ).values(),
  ]
  const namespace = `${cppIdentifier(project.name, 'smlmaker')}_events`
  const variableName = (machineNamespace: string, machineName: string) =>
    cppIdentifier(`${machineNamespace}_${machineName}`, 'machine').toLowerCase()
  const machineIncludes = machines
    .map(
      (machine) =>
        `#include "${cppIdentifier(machine.machine_namespace, 'global')}/${cppIdentifier(machine.machine_name, 'StateMachine')}.hpp"`
    )
    .join('\n')
  const parameters = machines
    .map(
      (machine) =>
        `::${cppIdentifier(machine.machine_namespace, 'global')}::${cppIdentifier(machine.machine_name, 'StateMachine')}& ${variableName(machine.machine_namespace, machine.machine_name)}`
    )
    .join(', ')
  const initializers = [
    'bus_{bus}',
    ...machines.map((machine) => {
      const variable = variableName(machine.machine_namespace, machine.machine_name)
      return `${variable}_{${variable}}`
    }),
    ...mappings.map(({ event, handler }, index) => {
      const eventType = `::${cppIdentifier(event.namespace, 'global')}::${cppIdentifier(event.name, 'Event')}`
      const machine = variableName(handler.machine_namespace, handler.machine_name)
      return `handler_${index}_{bus_.on<${eventType}>([this](const ${eventType}&) { ${machine}_.${cppIdentifier(handler.machine_event)}(); })}`
    }),
  ].join(',\n      ')
  const removals = mappings
    .map(({ event }, index) => {
      const eventType = `::${cppIdentifier(event.namespace, 'global')}::${cppIdentifier(event.name, 'Event')}`
      return `    bus_.remove<${eventType}>(handler_${index}_);`
    })
    .join('\n')
  const machineMembers = machines
    .map((machine) => {
      const type = `::${cppIdentifier(machine.machine_namespace, 'global')}::${cppIdentifier(machine.machine_name, 'StateMachine')}`
      return `  ${type}& ${variableName(machine.machine_namespace, machine.machine_name)}_;`
    })
    .join('\n')
  const handlerMembers = mappings
    .map((_, index) => `  EventBus::Handle handler_${index}_;`)
    .join('\n')

  return `#pragma once
#include "events.hpp"
${machineIncludes}

namespace ${namespace} {

class EventHandlers {
public:
  EventHandlers(EventBus& bus${parameters ? `, ${parameters}` : ''})
      : ${initializers} {}

  ~EventHandlers() {
${removals}
  }

  EventHandlers(const EventHandlers&) = delete;
  EventHandlers& operator=(const EventHandlers&) = delete;
  EventHandlers(EventHandlers&&) = delete;
  EventHandlers& operator=(EventHandlers&&) = delete;

private:
  EventBus& bus_;
${machineMembers}
${handlerMembers}
};

} // namespace ${namespace}
`
}
