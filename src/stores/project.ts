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
    // Minimal sanitizer: make a reasonable C++ identifier from an input string
    const ident = (raw: string): string => {
      let s = raw.trim().replace(/[^a-zA-Z0-9_]/g, '_')
      if (!s) s = '_'
      if (/[0-9]/.test(s[0])) s = '_' + s
      return s
    }

    return (machine: Machine) => {
      const ns = ident(machine.namespace || 'global')
      const cls = ident(machine.name || 'StateMachine')
      const events = (machine.events || []).map(ident)

      const lines: string[] = []
      lines.push('#pragma once')
      lines.push('#include <memory>')
      lines.push('')
      lines.push(`namespace ${ns} {`)
      lines.push('')

      lines.push(`class ${cls} {`)
      lines.push('public:')
      lines.push(`  ${cls}();`)
      lines.push(`  ~${cls}();`)
      lines.push('')
      lines.push(`  ${cls}(${cls}&&) noexcept;`)
      lines.push(`  ${cls}& operator=(${cls}&&) noexcept;`)
      lines.push('')
      lines.push(`  ${cls}(const ${cls}&) = delete;`)
      lines.push(`  ${cls}& operator=(const ${cls}&) = delete;`)
      lines.push('')
      if (events.length === 0) {
        // keep a minimal API even if there are no events
        lines.push('  // No events defined in JSON.')
      } else {
        for (const ev of events) lines.push(`  void ${ev}();`)
      }
      lines.push('')
      lines.push('private:')
      lines.push('  struct Impl;') // forward-declared implementation
      lines.push('  std::unique_ptr<Impl> impl;') // PIMPL pointer (MSVC-safe)");
      lines.push('};')
      lines.push('')
      lines.push(`} // namespace ${ns}`)
      lines.push('')
      return lines.join('\n')
    }
  })

  const get_machine_source = computed(() => {
    // sanitize raw strings into valid C++ identifiers
    const ident = (raw: string): string => {
      let s = (raw ?? '').trim().replace(/[^a-zA-Z0-9_]/g, '_')
      if (!s) s = '_'
      if (/[0-9]/.test(s[0])) s = '_' + s
      return s
    }

    // helper to unique+stable sort while preserving original order
    const uniq = (arr: string[]) => {
      const seen = new Set<string>()
      const out: string[] = []
      for (const x of arr)
        if (!seen.has(x)) {
          seen.add(x)
          out.push(x)
        }
      return out
    }

    return (machine: Machine) => {
      const ns = ident(machine.namespace || 'global')
      const cls = ident(machine.name || 'StateMachine')

      const events = uniq((machine.events || []).map(ident))
      const states = uniq((machine.states || []).map(ident))
      const guards = uniq(((machine as any).guards || []).map(ident))
      const actions = uniq(((machine as any).actions || []).map(ident))

      type T = {
        event: string
        start_state: string
        target_state: string
        guard?: string | null
        actions?: string[] | null
      }
      const transitions: T[] = ((machine.transitions || []) as any[]).map((t) => ({
        event: ident(t.event),
        start_state: ident(t.start_state),
        target_state: ident(t.target_state),
        guard: t.guard ? ident(t.guard) : null,
        actions: (t.actions || []).map(ident),
      }))

      // choose an initial state (prefer first transition's start_state; else first listed state)
      const initialState = transitions[0]?.start_state ?? states[0] ?? '_Initial'

      const lines: string[] = []
      lines.push(`#include "${cls}.hpp"`)
      lines.push(`#include <boost/sml.hpp>`)
      lines.push(`#include <memory>`)
      lines.push(`#include <utility>`)
      lines.push('')
      lines.push(`namespace sml = boost::sml;`)
      lines.push('')
      lines.push(`namespace ${ns} {`)
      lines.push('')
      lines.push(`namespace { // TU-local internals (hidden from headers)`)

      // ---- events ----
      lines.push('')
      lines.push(`// ---- events ----`)
      if (events.length === 0) {
        // define a dummy event to keep the machine valid if someone forgot events
        lines.push(`struct _NoopEvent {};`)
      } else {
        for (const ev of events) lines.push(`struct ${ev} {};`)
      }

      // ---- state tags ----
      lines.push('')
      lines.push(`// ---- state tags ----`)
      const stateSet = new Set(states)
      // Also ensure every start/target from transitions has a state tag
      for (const t of transitions) {
        if (!stateSet.has(t.start_state)) {
          stateSet.add(t.start_state)
          states.push(t.start_state)
        }
        if (!stateSet.has(t.target_state)) {
          stateSet.add(t.target_state)
          states.push(t.target_state)
        }
      }
      if (stateSet.size === 0) {
        lines.push(`struct ${ident(initialState)} {};`)
      } else {
        for (const st of uniq([...stateSet])) lines.push(`struct ${st} {};`)
      }

      // ---- actions ----
      lines.push('')
      lines.push(`// ---- actions ----`)
      if (actions.length === 0 && transitions.some((t) => t.actions && t.actions.length)) {
        // fallback if transitions referenced actions but top-level list was empty
        const fromTrans = uniq(transitions.flatMap((t) => t.actions || []))
        for (const a of fromTrans) actions.push(a)
      }
      if (actions.length === 0) {
        lines.push(`// (none)`)
      } else {
        for (const a of actions) {
          // struct style to match your reference (MSVC-friendly)
          const evParam = events.length === 1 ? `${events[0]}&` : 'auto const&'
          lines.push(`struct ${a} {`)
          lines.push(`  void operator()(const ${evParam}) const noexcept {`)
          lines.push(`    // TODO: side-effects for action "${a}"`)
          lines.push(`  }`)
          lines.push(`};`)
        }
      }

      // ---- guards ----
      lines.push('')
      lines.push(`// ---- guards ----`)
      if (guards.length === 0 && transitions.some((t) => t.guard)) {
        const fromTrans = uniq(transitions.map((t) => t.guard).filter(Boolean) as string[])
        for (const g of fromTrans) guards.push(g)
      }
      if (guards.length === 0) {
        lines.push(`// (none)`)
      } else {
        for (const g of guards) {
          const evParam = events.length === 1 ? `${events[0]}&` : 'auto const&'
          lines.push(`struct ${g} {`)
          lines.push(`  bool operator()(const ${evParam}) const noexcept {`)
          lines.push(`    // TODO: predicate for guard "${g}"`)
          lines.push(`    return true;`)
          lines.push(`  }`)
          lines.push(`};`)
        }
      }

      // ---- transition table ----
      lines.push('')
      lines.push(`// ---- transition table ----`)
      lines.push(`struct ${cls}Table {`)
      lines.push(`  auto operator()() const {`)
      lines.push(`    using sml::event;`)
      lines.push(`    using sml::state;`)
      lines.push(`    using sml::make_transition_table;`)
      lines.push(``)
      lines.push(`    return make_transition_table(`)

      // Build transition rows
      const rows: string[] = []
      let initialMarked = false
      if (transitions.length === 0 && events.length > 0) {
        // fallback: a self-loop so machine compiles
        const ev = events[0]
        const st = initialState
        rows.push(`      *state<${st}> + event<${ev}> = state<${st}>`)
        initialMarked = true
      } else {
        for (const t of transitions) {
          const star = !initialMarked && t.start_state === initialState ? '*' : ' '
          if (star === '*') initialMarked = true

          const guardPart = t.guard ? ` [${t.guard}{}]` : ''
          let actionPart = ''
          const acts = t.actions || []
          if (acts.length === 1) actionPart = ` / ${acts[0]}{}`
          else if (acts.length > 1) {
            actionPart = ` / (${acts.map((a) => `${a}{}`).join(', ')})`
          }

          rows.push(
            `      ${star}state<${t.start_state}> + event<${t.event}>${guardPart}${actionPart} = state<${t.target_state}>`
          )
        }
      }

      // join rows with commas
      for (let i = 0; i < rows.length; i++) {
        const sep = i === rows.length - 1 ? '' : ','
        lines.push(rows[i] + sep)
      }
      lines.push(`    );`)
      lines.push(`  }`)
      lines.push(`};`)
      lines.push('')
      lines.push(`} // anonymous namespace`)
      lines.push('')

      // ---- PIMPL ----
      lines.push(`// ---- PIMPL ----`)
      lines.push(`struct ${cls}::Impl {`)
      lines.push(`  sml::sm<${cls}Table> sm;`)
      lines.push('')
      // per-event methods
      if (events.length === 0) {
        lines.push(`  void _noop() {}`)
      } else {
        for (const ev of events) {
          lines.push(`  void ${ev}() { sm.process_event(${ev}{}); }`)
        }
      }
      lines.push(`};`)
      lines.push('')
      // ---- public API ----
      lines.push(`// ---- public API ----`)
      lines.push(`${cls}::${cls}() : impl(std::make_unique<Impl>()) {}`)
      lines.push(`${cls}::~${cls}() = default;`)
      lines.push('')
      lines.push(`${cls}::${cls}(${cls}&&) noexcept = default;`)
      lines.push(`${cls}& ${cls}::operator=(${cls}&&) noexcept = default;`)
      lines.push('')
      // event forwarders
      for (const ev of events) {
        lines.push(`void ${cls}::${ev}() { impl->${ev}(); }`)
      }
      if (events.length === 0) {
        lines.push(`// No events defined; façade has no dispatchers.`)
      }
      lines.push('')
      lines.push(`} // namespace ${ns}`)
      lines.push('')

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
