import type { CppType, GeneratedFile, Machine } from '@/types'

const cppKeywords = new Set([
  'alignas',
  'alignof',
  'and',
  'and_eq',
  'asm',
  'atomic_cancel',
  'atomic_commit',
  'atomic_noexcept',
  'auto',
  'bitand',
  'bitor',
  'bool',
  'break',
  'case',
  'catch',
  'char',
  'char8_t',
  'char16_t',
  'char32_t',
  'class',
  'compl',
  'concept',
  'const',
  'consteval',
  'constexpr',
  'constinit',
  'const_cast',
  'continue',
  'co_await',
  'co_return',
  'co_yield',
  'decltype',
  'default',
  'delete',
  'do',
  'double',
  'dynamic_cast',
  'else',
  'enum',
  'explicit',
  'export',
  'extern',
  'false',
  'float',
  'for',
  'friend',
  'goto',
  'if',
  'inline',
  'int',
  'long',
  'mutable',
  'namespace',
  'new',
  'noexcept',
  'not',
  'not_eq',
  'nullptr',
  'operator',
  'or',
  'or_eq',
  'private',
  'protected',
  'public',
  'reflexpr',
  'register',
  'reinterpret_cast',
  'requires',
  'return',
  'short',
  'signed',
  'sizeof',
  'static',
  'static_assert',
  'static_cast',
  'struct',
  'switch',
  'synchronized',
  'template',
  'this',
  'thread_local',
  'throw',
  'true',
  'try',
  'typedef',
  'typeid',
  'typename',
  'union',
  'unsigned',
  'using',
  'virtual',
  'void',
  'volatile',
  'wchar_t',
  'while',
  'xor',
  'xor_eq',
])

export function cppIdentifier(raw: string, fallback = 'Generated'): string {
  let result = (raw ?? '').trim().replace(/[^a-zA-Z0-9_]/g, '_')
  if (!result) result = fallback
  if (/^[0-9]/.test(result)) result = `_${result}`
  if (cppKeywords.has(result)) result = `${result}_`
  if (/^__/.test(result) || /^_[A-Z]/.test(result)) result = `generated${result}`
  return result
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}

function duplicateIdentifiers(values: string[]): string[] {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const value of values.map((item) => cppIdentifier(item))) {
    if (seen.has(value)) duplicates.add(value)
    seen.add(value)
  }
  return [...duplicates]
}

export function machineValidationErrors(machine: Machine): string[] {
  const errors: string[] = []
  if (!(machine.name ?? '').trim()) errors.push('Machine name is required.')
  if (!(machine.namespace ?? '').trim()) errors.push('Namespace is required.')
  if (machine.states.length === 0) errors.push('Add at least one state.')
  if (machine.events.length === 0) errors.push('Add at least one event.')
  if (machine.transitions.length === 0) errors.push('Add at least one transition.')

  const groups: Array<[string, string[]]> = [
    ['state', machine.states],
    ['event', machine.events],
    ['guard', machine.guards],
    ['action', machine.actions],
  ]
  for (const [label, values] of groups) {
    if (values.some((value) => !value.trim())) errors.push(`${label} names cannot be blank.`)
    const duplicates = duplicateIdentifiers(values)
    if (duplicates.length) {
      errors.push(`Duplicate ${label} C++ identifier(s): ${duplicates.join(', ')}.`)
    }
  }

  const states = new Set(machine.states)
  const events = new Set(machine.events)
  const guards = new Set(machine.guards)
  const actions = new Set(machine.actions)
  for (const transition of machine.transitions) {
    if (!states.has(transition.start_state) || !states.has(transition.target_state)) {
      errors.push('A transition references an unknown state.')
    }
    if (!events.has(transition.event)) errors.push('A transition references an unknown event.')
    if (transition.guard && !guards.has(transition.guard)) {
      errors.push('A transition references an unknown guard.')
    }
    if (transition.actions.some((action) => !actions.has(action))) {
      errors.push('A transition references an unknown action.')
    }
  }
  if (machine.initial_state && !states.has(machine.initial_state)) {
    errors.push('The initial state does not exist.')
  }

  if (machine.context) {
    if (!machine.context.name.trim()) errors.push('Context name is required.')
    const duplicates = duplicateIdentifiers(machine.context.entries.map((entry) => entry.name))
    if (duplicates.length) errors.push(`Duplicate context field(s): ${duplicates.join(', ')}.`)
    if (machine.context.entries.some((entry) => !entry.name.trim() || !entry.type.trim())) {
      errors.push('Context fields require both a name and a C++ type.')
    }
  }

  const generatedSymbols = [
    ['machine', machine.name],
    ...machine.events.map((name) => ['event', name]),
    ...machine.states.map((name) => ['state', name]),
    ...machine.guards.map((name) => ['guard', name]),
    ...machine.actions.map((name) => ['action', name]),
    ...(machine.context ? [['context', machine.context.name]] : []),
  ]
  const symbolOwners = new Map<string, string[]>()
  generatedSymbols.forEach(([kind, name]) => {
    const identifier = cppIdentifier(name)
    const owners = symbolOwners.get(identifier) ?? []
    owners.push(kind)
    symbolOwners.set(identifier, owners)
  })
  for (const [identifier, owners] of symbolOwners) {
    if (owners.length > 1) {
      errors.push(`C++ identifier collision for ${identifier}: ${owners.join(', ')}.`)
    }
  }

  return unique(errors)
}

function eventNames(machine: Machine): string[] {
  return unique(machine.events.map((event) => cppIdentifier(event)))
}

export function cppTypeKey(type: Pick<CppType, 'namespace' | 'name'>): string {
  return `${type.namespace}::${type.name}`
}

function selectedContext(machine: Machine, types: CppType[]) {
  const shared = machine.context_type
    ? types.find((type) => cppTypeKey(type) === machine.context_type)
    : undefined
  if (shared) {
    const namespace = cppIdentifier(shared.namespace, 'global')
    const name = cppIdentifier(shared.name, 'Context')
    return {
      name: `::${namespace}::${name}`,
      definition: '',
      include: `#include "${namespace}/${name}.hpp"\n`,
      requiresArgument: shared.kind === 'context' && shared.fields.length > 0,
    }
  }
  if (machine.context) {
    const name = cppIdentifier(machine.context.name, `${cppIdentifier(machine.name)}Context`)
    return {
      name,
      definition: `struct ${name} {\n${machine.context.entries
        .map((entry) => {
          const initializer = entry.value.trim() ? ` = ${entry.value.trim()}` : '{}'
          return `  ${entry.type.trim()} ${cppIdentifier(entry.name)}${initializer};`
        })
        .join('\n')}\n};\n\n`,
      include: '',
      requiresArgument: false,
    }
  }
  return undefined
}

export function generateTypeHeader(type: CppType): string {
  const ns = cppIdentifier(type.namespace, 'global')
  const name = cppIdentifier(type.name, 'Context')
  const includes = unique(type.includes.map((include) => include.trim()).filter(Boolean))
    .map((include) =>
      include.startsWith('<') || include.startsWith('"')
        ? `#include ${include}`
        : `#include <${include}>`
    )
    .join('\n')
  const fields = type.fields
    .map((field) => {
      const initializer = field.value.trim() ? ` = ${field.value.trim()}` : '{}'
      return `  ${field.type.trim()} ${cppIdentifier(field.name)}${initializer};`
    })
    .join('\n')

  if (type.kind === 'context') {
    const parameters = type.fields
      .map((field) => `${field.type.trim()}& ${cppIdentifier(field.name)}`)
      .join(', ')
    const initializers = type.fields
      .map((field) => `${cppIdentifier(field.name)}_{&${cppIdentifier(field.name)}}`)
      .join(', ')
    const accessors = type.fields
      .map(
        (field) =>
          `  ${field.type.trim()}& ${cppIdentifier(field.name)}() const { return *${cppIdentifier(field.name)}_; }`
      )
      .join('\n')
    const pointers = type.fields
      .map((field) => `  ${field.type.trim()}* ${cppIdentifier(field.name)}_{};`)
      .join('\n')
    const constructor = type.fields.length
      ? `  ${name}(${parameters}) : ${initializers} {}`
      : `  ${name}() = default;`

    return `#pragma once
${includes ? `${includes}\n` : ''}
namespace ${ns} {

struct ${name} {
${constructor}

${accessors}

private:
${pointers}
};

} // namespace ${ns}
`
  }

  return `#pragma once
${includes ? `${includes}\n` : ''}
namespace ${ns} {

struct ${name} {
${fields}
};

} // namespace ${ns}
`
}

export function generateEventsHeader(machine: Machine): string {
  const ns = cppIdentifier(machine.namespace, 'global')
  const cls = cppIdentifier(machine.name, 'StateMachine')
  const events = eventNames(machine)
  const registeredEvents = events.length ? events : ['NoopEvent']
  const qualifiedEvents = registeredEvents.map((event) => `${cls}Events::${event}`)

  return `#pragma once
#include <type_traits>
#include <typeindex>
#include <utility>

#include <eventpp/hetereventdispatcher.h>

namespace ${ns} {

// Event payloads can be extended with fields after generation.
namespace ${cls}Events {
${registeredEvents.map((event) => `struct ${event} {};`).join('\n')}
} // namespace ${cls}Events

template <class... Events>
class ${cls}TypedEventBus {
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

using ${cls}EventBus = ${cls}TypedEventBus<${qualifiedEvents.join(', ')}>;

} // namespace ${ns}
`
}

export function generateMachineHeader(
  machine: Machine,
  types: CppType[] = [],
  forwardHeader = ''
): string {
  const ns = cppIdentifier(machine.namespace, 'global')
  const cls = cppIdentifier(machine.name, 'StateMachine')
  const events = eventNames(machine)
  const context = selectedContext(machine, types)
  const ctor = context
    ? `${context.requiresArgument ? '' : `  ${cls}();\n`}  explicit ${cls}(${context.name} context);`
    : `  ${cls}();`
  const contextAccessors = context
    ? `\n  ${context.name}& context() noexcept;\n  const ${context.name}& context() const noexcept;`
    : ''

  const dependencyIncludes = forwardHeader
    ? `#include "${forwardHeader}"`
    : `#include "${cls}_events.hpp"\n${context?.include ?? ''}`.trimEnd()

  return `#pragma once
#include <memory>

${dependencyIncludes}

namespace ${ns} {

${context?.definition ?? ''}class ${cls} {
public:
${ctor}
  ~${cls}();

  ${cls}(${cls}&&) noexcept;
  ${cls}& operator=(${cls}&&) noexcept;

  ${cls}(const ${cls}&) = delete;
  ${cls}& operator=(const ${cls}&) = delete;

${events.length ? events.map((event) => `  void ${event}();`).join('\n') : '  // No public events are defined.'}

  ${cls}EventBus& event_bus() noexcept;
  const ${cls}EventBus& event_bus() const noexcept;${contextAccessors}

private:
  struct Impl;
  std::unique_ptr<Impl> impl_;
};

} // namespace ${ns}
`
}

function indentedBody(code: string, fallback: string): string {
  const body = code.trim() || fallback
  return body
    .split('\n')
    .map((line) => `    ${line}`)
    .join('\n')
}

export function generateMachineSource(machine: Machine, types: CppType[] = []): string {
  const ns = cppIdentifier(machine.namespace, 'global')
  const cls = cppIdentifier(machine.name, 'StateMachine')
  const events = eventNames(machine)
  const eventNamespace = `${cls}Events`
  const states = unique(machine.states.map((state) => cppIdentifier(state)))
  const guards = unique(machine.guards.map((guard) => cppIdentifier(guard)))
  const actions = unique(machine.actions.map((action) => cppIdentifier(action)))
  const context = selectedContext(machine, types)
  const contextName = context?.name ?? ''
  const fallbackState = states[0] ?? 'InitialState'
  const initialState = cppIdentifier(
    machine.initial_state || machine.transitions[0]?.start_state || fallbackState
  )
  const transitions = machine.transitions.map((transition) => ({
    event: cppIdentifier(transition.event),
    start: cppIdentifier(transition.start_state),
    target: cppIdentifier(transition.target_state),
    guard: transition.guard ? cppIdentifier(transition.guard) : '',
    actions: transition.actions.map((action) => cppIdentifier(action)),
  }))
  const allStates = unique([
    ...states,
    initialState,
    ...transitions.flatMap((transition) => [transition.start, transition.target]),
  ])
  const needsInitialMarker =
    transitions.length > 0 && !transitions.some((transition) => transition.start === initialState)

  const actionDefinitions = actions.length
    ? actions
        .map((action, index) => {
          const originalName = machine.actions[index]
          const parameter = context ? `${contextName}& context` : ''
          const fallback = context
            ? '(void)context;\n// Add action side effects here.'
            : '// Add action side effects here.'
          return `struct ${action} {\n  void operator()(${parameter}) const {\n${indentedBody(machine.action_code?.[originalName] ?? '', fallback)}\n  }\n};`
        })
        .join('\n\n')
    : '// (none)'
  const guardDefinitions = guards.length
    ? guards
        .map((guard, index) => {
          const originalName = machine.guards[index]
          const parameter = context ? `${contextName}& context` : ''
          const expression = machine.guard_code?.[originalName]?.trim() || 'true'
          return `struct ${guard} {\n  bool operator()(${parameter}) const {\n    return (${expression});\n  }\n};`
        })
        .join('\n\n')
    : '// (none)'

  const rows: string[] = []
  if (transitions.length) {
    let initialMarked = needsInitialMarker
    if (needsInitialMarker) {
      rows.push(
        `      *state<${initialState}> + event<InitialStateMarkerEvent> = state<${initialState}>`
      )
    }
    for (const transition of transitions) {
      const isInitial = !initialMarked && transition.start === initialState
      if (isInitial) initialMarked = true
      const guard = transition.guard ? ` [${transition.guard}{}]` : ''
      const action = transition.actions.length
        ? ` / ${transition.actions.length === 1 ? `${transition.actions[0]}{}` : `(${transition.actions.map((item) => `${item}{}`).join(', ')})`}`
        : ''
      rows.push(
        `      ${isInitial ? '*' : ' '}state<${transition.start}> + event<${transition.event}>${guard}${action} = state<${transition.target}>`
      )
    }
  } else {
    const event = events[0] ?? 'NoopEvent'
    rows.push(`      *state<${initialState}> + event<${event}> = state<${initialState}>`)
  }

  const listenerSetup = events.length
    ? events
        .map(
          (event) =>
            `    bus.on<${ns}::${eventNamespace}::${event}>([this](const ${ns}::${eventNamespace}::${event}& value) { sm.process_event(value); });`
        )
        .join('\n')
    : '    // No public events to connect.'
  const members = context
    ? `  ${contextName} context;\n  sml::sm<${cls}Table> sm;\n  ${cls}EventBus bus;`
    : `  sml::sm<${cls}Table> sm;\n  ${cls}EventBus bus;`
  const implCtor = context
    ? `  explicit Impl(${contextName} initial_context)\n    : context(std::move(initial_context)), sm{context} {\n${listenerSetup}\n  }`
    : `  Impl() {\n${listenerSetup}\n  }`
  const publicCtor = context
    ? `${context.requiresArgument ? '' : `${cls}::${cls}() : ${cls}(${contextName}{}) {}\n`}${cls}::${cls}(${contextName} context) : impl_(std::make_unique<Impl>(std::move(context))) {}`
    : `${cls}::${cls}() : impl_(std::make_unique<Impl>()) {}`
  const contextMethods = context
    ? `\n${contextName}& ${cls}::context() noexcept { return impl_->context; }\nconst ${contextName}& ${cls}::context() const noexcept { return impl_->context; }`
    : ''

  return `#include "${cls}.hpp"
#include "${cls}_events.hpp"
${context?.include ?? ''}#include <boost/sml.hpp>
#include <memory>
#include <utility>

namespace sml = boost::sml;

namespace ${ns} {
namespace {

${events.map((event) => `using ${event} = ${eventNamespace}::${event};`).join('\n')}${events.length ? '\n\n' : ''}${needsInitialMarker ? 'struct InitialStateMarkerEvent {};\n\n' : ''}// State tags
${allStates.map((state) => `struct ${state} {};`).join('\n')}

// Actions
${actionDefinitions}

// Guards
${guardDefinitions}

struct ${cls}Table {
  auto operator()() const {
    using namespace sml;

    return make_transition_table(
${rows.join(',\n')}
    );
  }
};

} // namespace

struct ${cls}::Impl {
${members}

${implCtor}
};

${publicCtor}
${cls}::~${cls}() = default;
${cls}::${cls}(${cls}&&) noexcept = default;
${cls}& ${cls}::operator=(${cls}&&) noexcept = default;

${events.map((event) => `void ${cls}::${event}() { impl_->bus.emit(${ns}::${eventNamespace}::${event}{}); }`).join('\n')}

${cls}EventBus& ${cls}::event_bus() noexcept { return impl_->bus; }
const ${cls}EventBus& ${cls}::event_bus() const noexcept { return impl_->bus; }${contextMethods}

} // namespace ${ns}
`
}

export function generateMachineFiles(machine: Machine, types: CppType[] = []): GeneratedFile[] {
  const cls = cppIdentifier(machine.name, 'StateMachine')
  return [
    { name: `${cls}_events.hpp`, contents: generateEventsHeader(machine) },
    { name: `${cls}.hpp`, contents: generateMachineHeader(machine, types) },
    { name: `${cls}.cpp`, contents: generateMachineSource(machine, types) },
  ]
}
