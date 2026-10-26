import { computed, reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import pako from 'pako'

import {
  cppTypeKey,
  generateEventsHeader,
  generateMachineFiles,
  generateMachineHeader,
  generateMachineSource,
  machineValidationErrors,
} from '@/generators/cpp'
import {
  allCompilationUnits,
  generateCMakeLists,
  generateProjectFiles,
  machineSourcePath,
  machineTestPath,
  projectBuildValidationErrors,
} from '@/generators/project'
import type {
  ActionName,
  CompilationUnit,
  ContextEntry,
  CppType,
  EventName,
  GuardName,
  Machine,
  LibraryKind,
  LibraryTarget,
  OptionalDependency,
  NamespaceName,
  Project,
  StateName,
  TestTarget,
  Transition,
} from '@/types'

function nonBlankUniquePush(values: string[], raw: string): boolean {
  const value = raw.trim()
  if (!value || values.includes(value)) return false
  values.push(value)
  return true
}

function normalizeMachine(machine: Machine): Machine {
  machine.events ??= []
  machine.states ??= []
  machine.transitions ??= []
  machine.guards ??= []
  machine.actions ??= []
  machine.context ??= false
  machine.action_code ??= {}
  machine.guard_code ??= {}
  for (const transition of machine.transitions) transition.actions ??= []
  return machine
}

function normalizeProject(project: Project): Project {
  project.name ??= ''
  project.namespaces ??= []
  project.machines = (project.machines ?? []).map(normalizeMachine)
  project.version ??= '0.1.0'
  project.cxx_standard ??= 17
  project.types ??= []
  project.compilation_units ??= []
  project.libraries ??= []
  project.libraries.forEach((library) => {
    library.types ??= []
    library.dependencies ??= []
  })
  project.test_targets ??= []
  return project
}

export const useProjectStore = defineStore('project', () => {
  const project = ref<Project>({
    name: '',
    namespaces: [],
    machines: [],
    version: '0.1.0',
    cxx_standard: 17,
    types: [],
    compilation_units: [],
    libraries: [],
    test_targets: [],
  })

  function setProjectName(name: string) {
    project.value.name = name.trim()
  }

  function ensureDefaultTargets(): { library: LibraryTarget; tests: TestTarget } {
    project.value.libraries ??= []
    project.value.test_targets ??= []
    let library = project.value.libraries[0]
    if (!library) {
      library = {
        name: 'machines',
        kind: 'STATIC',
        compilation_units: [],
        types: [],
        dependencies: [],
      }
      project.value.libraries.push(library)
    }
    let tests = project.value.test_targets[0]
    if (!tests) {
      tests = { name: 'machine_tests', compilation_units: [], libraries: [library.name] }
      project.value.test_targets.push(tests)
    }
    return { library, tests }
  }

  function addMachine(name: string, namespace: string): Machine {
    const machine = reactive<Machine>({
      name: name.trim(),
      namespace: namespace.trim(),
      events: [],
      states: [],
      transitions: [],
      guards: [],
      actions: [],
      context: false,
      action_code: {},
      guard_code: {},
    })
    project.value.machines.push(machine)
    const targets = ensureDefaultTargets()
    targets.library.compilation_units.push(machineSourcePath(machine))
    targets.tests.compilation_units.push(machineTestPath(machine))
    return machine
  }

  function addNamespace(name: NamespaceName): boolean {
    return nonBlankUniquePush(project.value.namespaces, name)
  }

  function removeMachine(machineToRemove: Machine) {
    const sourcePath = machineSourcePath(machineToRemove)
    const testPath = machineTestPath(machineToRemove)
    project.value.machines = project.value.machines.filter((machine) => machine !== machineToRemove)
    project.value.libraries?.forEach((library) => {
      library.compilation_units = library.compilation_units.filter((path) => path !== sourcePath)
    })
    project.value.test_targets?.forEach((target) => {
      target.compilation_units = target.compilation_units.filter((path) => path !== testPath)
    })
  }

  function removeNamespace(namespaceToRemove: NamespaceName) {
    const machines = project.value.machines.filter(
      (machine) => machine.namespace === namespaceToRemove
    )
    machines.forEach(removeMachine)
    project.value.namespaces = project.value.namespaces.filter((item) => item !== namespaceToRemove)
  }

  function addEventToMachine(name: EventName, machine: Machine): boolean {
    return nonBlankUniquePush(machine.events, name)
  }

  function removeEventFromMachine(eventToRemove: EventName, machine: Machine) {
    machine.events = machine.events.filter((event) => event !== eventToRemove)
    machine.transitions = machine.transitions.filter(
      (transition) => transition.event !== eventToRemove
    )
  }

  function addStateToMachine(name: StateName, machine: Machine): boolean {
    const added = nonBlankUniquePush(machine.states, name)
    if (added && !machine.initial_state) machine.initial_state = name.trim()
    return added
  }

  function setInitialState(machine: Machine, state: StateName) {
    if (machine.states.includes(state)) machine.initial_state = state
  }

  function removeStateFromMachine(stateToRemove: StateName, machine: Machine) {
    machine.states = machine.states.filter((state) => state !== stateToRemove)
    machine.transitions = machine.transitions.filter(
      (transition) =>
        transition.start_state !== stateToRemove && transition.target_state !== stateToRemove
    )
    if (machine.initial_state === stateToRemove) machine.initial_state = machine.states[0]
  }

  function addActionToMachine(name: ActionName, machine: Machine): boolean {
    return nonBlankUniquePush(machine.actions, name)
  }

  function removeActionFromMachine(actionToRemove: ActionName, machine: Machine) {
    machine.actions = machine.actions.filter((action) => action !== actionToRemove)
    machine.transitions.forEach((transition) => {
      transition.actions = transition.actions.filter((action) => action !== actionToRemove)
    })
    delete machine.action_code?.[actionToRemove]
  }

  function setActionCode(machine: Machine, action: ActionName, code: string) {
    machine.action_code ??= {}
    machine.action_code[action] = code
  }

  function addActionToTransition(name: ActionName, transition: Transition): boolean {
    return nonBlankUniquePush(transition.actions, name)
  }

  function removeActionFromTransition(name: ActionName, transition: Transition) {
    transition.actions = transition.actions.filter((action) => action !== name)
  }

  function addGuardToMachine(name: GuardName, machine: Machine): boolean {
    return nonBlankUniquePush(machine.guards, name)
  }

  function removeGuardFromMachine(guardToRemove: GuardName, machine: Machine) {
    machine.guards = machine.guards.filter((guard) => guard !== guardToRemove)
    machine.transitions.forEach((transition) => {
      if (transition.guard === guardToRemove) delete transition.guard
    })
    delete machine.guard_code?.[guardToRemove]
  }

  function setGuardCode(machine: Machine, guard: GuardName, expression: string) {
    machine.guard_code ??= {}
    machine.guard_code[guard] = expression
  }

  function addGuardToTransition(name: GuardName, transition: Transition) {
    transition.guard = name.trim() || undefined
  }

  function clearGuardFromTransition(transition: Transition) {
    delete transition.guard
  }

  function addTransitionToMachine(
    startState: StateName,
    event: EventName,
    targetState: StateName,
    machine: Machine
  ): Transition {
    if (
      !machine.states.includes(startState) ||
      !machine.states.includes(targetState) ||
      !machine.events.includes(event)
    )
      throw new Error('Transitions require existing start state, event, and target state.')

    const transition = reactive<Transition>({
      event,
      start_state: startState,
      target_state: targetState,
      actions: [],
    })
    machine.transitions.push(transition)
    return transition
  }

  function removeTransitionFromMachine(transitionToRemove: Transition, machine: Machine) {
    machine.transitions = machine.transitions.filter(
      (transition) => transition !== transitionToRemove
    )
  }

  function enableContext(machine: Machine, name = `${machine.name || 'Machine'}Context`) {
    if (!machine.context) machine.context = { name, entries: [] }
  }

  function disableContext(machine: Machine) {
    machine.context = false
  }

  function addContextEntry(machine: Machine, entry: ContextEntry): boolean {
    if (!machine.context || !entry.name.trim() || !entry.type.trim()) return false
    if (machine.context.entries.some((item) => item.name === entry.name.trim())) return false
    machine.context.entries.push({
      name: entry.name.trim(),
      type: entry.type.trim(),
      value: entry.value.trim(),
    })
    return true
  }

  function removeContextEntry(machine: Machine, entryToRemove: ContextEntry) {
    if (!machine.context) return
    machine.context.entries = machine.context.entries.filter((entry) => entry !== entryToRemove)
  }

  function setMachineContextType(machine: Machine, typeKey: string) {
    machine.context_type = typeKey || undefined
    if (typeKey) machine.context = false
  }

  function addType(name: string, namespace: string): CppType | undefined {
    const candidate: CppType = {
      name: name.trim(),
      namespace: namespace.trim(),
      fields: [],
      includes: [],
    }
    project.value.types ??= []
    if (!candidate.name || !candidate.namespace) return undefined
    if (project.value.types.some((type) => cppTypeKey(type) === cppTypeKey(candidate))) {
      return undefined
    }
    project.value.types.push(candidate)
    if (project.value.libraries?.[0]) project.value.libraries[0].types.push(cppTypeKey(candidate))
    return candidate
  }

  function removeType(typeToRemove: CppType) {
    const key = cppTypeKey(typeToRemove)
    project.value.types = (project.value.types ?? []).filter((type) => type !== typeToRemove)
    project.value.machines.forEach((machine) => {
      if (machine.context_type === key) machine.context_type = undefined
    })
    project.value.libraries?.forEach((library) => {
      library.types = library.types.filter((type) => type !== key)
    })
  }

  function addFieldToType(type: CppType, entry: ContextEntry): boolean {
    if (!entry.name.trim() || !entry.type.trim()) return false
    if (type.fields.some((field) => field.name === entry.name.trim())) return false
    type.fields.push({
      name: entry.name.trim(),
      type: entry.type.trim(),
      value: entry.value.trim(),
    })
    return true
  }

  function removeFieldFromType(type: CppType, entry: ContextEntry) {
    type.fields = type.fields.filter((field) => field !== entry)
  }

  function setTypeIncludes(type: CppType, includes: string) {
    type.includes = includes
      .split(',')
      .map((include) => include.trim())
      .filter(Boolean)
  }

  function addCompilationUnit(
    path: string,
    kind: CompilationUnit['kind']
  ): CompilationUnit | undefined {
    project.value.compilation_units ??= []
    const normalizedPath = path.trim()
    if (
      !normalizedPath ||
      allCompilationUnits(project.value).some((unit) => unit.path === normalizedPath)
    ) {
      return undefined
    }
    const unit = reactive<CompilationUnit>({ path: normalizedPath, kind, content: '' })
    project.value.compilation_units.push(unit)
    return unit
  }

  function removeCompilationUnit(unitToRemove: CompilationUnit) {
    project.value.compilation_units = (project.value.compilation_units ?? []).filter(
      (unit) => unit !== unitToRemove
    )
    project.value.libraries?.forEach((library) => {
      library.compilation_units = library.compilation_units.filter(
        (path) => path !== unitToRemove.path
      )
    })
    project.value.test_targets?.forEach((target) => {
      target.compilation_units = target.compilation_units.filter(
        (path) => path !== unitToRemove.path
      )
    })
  }

  function addLibrary(name: string, kind: LibraryKind): LibraryTarget | undefined {
    project.value.libraries ??= []
    const normalizedName = name.trim()
    if (
      !normalizedName ||
      project.value.libraries.some((library) => library.name === normalizedName)
    ) {
      return undefined
    }
    const library = reactive<LibraryTarget>({
      name: normalizedName,
      kind,
      compilation_units: [],
      types: [],
      dependencies: [],
    })
    project.value.libraries.push(library)
    return library
  }

  function removeLibrary(libraryToRemove: LibraryTarget) {
    project.value.libraries = (project.value.libraries ?? []).filter(
      (library) => library !== libraryToRemove
    )
    project.value.test_targets?.forEach((target) => {
      target.libraries = target.libraries.filter((library) => library !== libraryToRemove.name)
    })
  }

  function toggleLibraryUnit(library: LibraryTarget, path: string, selected: boolean) {
    library.compilation_units = selected
      ? [...new Set([...library.compilation_units, path])]
      : library.compilation_units.filter((item) => item !== path)
  }

  function toggleLibraryType(library: LibraryTarget, type: string, selected: boolean) {
    library.types = selected
      ? [...new Set([...library.types, type])]
      : library.types.filter((item) => item !== type)
  }

  function toggleLibraryDependency(
    library: LibraryTarget,
    dependency: OptionalDependency,
    selected: boolean
  ) {
    if (selected && (dependency === 'sdl2' || dependency === 'sdl3')) {
      const other = dependency === 'sdl2' ? 'sdl3' : 'sdl2'
      project.value.libraries?.forEach((target) => {
        target.dependencies = target.dependencies.filter((item) => item !== other)
      })
    }
    library.dependencies = selected
      ? [...new Set([...library.dependencies, dependency])]
      : library.dependencies.filter((item) => item !== dependency)
  }

  function addTestTarget(name: string): TestTarget | undefined {
    project.value.test_targets ??= []
    const normalizedName = name.trim()
    if (
      !normalizedName ||
      project.value.test_targets.some((target) => target.name === normalizedName)
    ) {
      return undefined
    }
    const target = reactive<TestTarget>({
      name: normalizedName,
      compilation_units: [],
      libraries: [],
    })
    project.value.test_targets.push(target)
    return target
  }

  function removeTestTarget(targetToRemove: TestTarget) {
    project.value.test_targets = (project.value.test_targets ?? []).filter(
      (target) => target !== targetToRemove
    )
  }

  function toggleTestUnit(target: TestTarget, path: string, selected: boolean) {
    target.compilation_units = selected
      ? [...new Set([...target.compilation_units, path])]
      : target.compilation_units.filter((item) => item !== path)
  }

  function toggleTestLibrary(target: TestTarget, library: string, selected: boolean) {
    target.libraries = selected
      ? [...new Set([...target.libraries, library])]
      : target.libraries.filter((item) => item !== library)
  }

  function generateExport(): string {
    const gzippedData = pako.gzip(JSON.stringify(project.value))
    const base64Encoded = globalThis.btoa(String.fromCharCode(...gzippedData))
    return (
      base64Encoded
        .match(/.{1,78}/g)
        ?.map((line) => `# ${line}`)
        .join('\n') ?? ''
    )
  }

  function hydrateExport(exportText: string): void {
    let parsed: Project
    try {
      parsed = JSON.parse(exportText) as Project
    } catch {
      const base64Data = exportText
        .split('\n')
        .map((line) => line.replace(/^#\s?/, ''))
        .join('')
      const binaryString = globalThis.atob(base64Data)
      const binaryData = Uint8Array.from(binaryString, (char) => char.charCodeAt(0))
      parsed = JSON.parse(pako.inflate(binaryData, { to: 'string' })) as Project
    }
    project.value = normalizeProject(parsed)
  }

  type MachinesByNamespace = Record<NamespaceName, Machine[]>
  const machinesByNamespace = computed(() => {
    const results: MachinesByNamespace = {}
    project.value.namespaces.forEach((namespace) => {
      results[namespace] = []
    })
    project.value.machines.forEach((machine) => {
      ;(results[machine.namespace] ??= []).push(machine)
    })
    return results
  })

  const get_machine_header = computed(
    () => (machine: Machine) => generateMachineHeader(machine, project.value.types ?? [])
  )
  const get_machine_events_header = computed(() => generateEventsHeader)
  const get_machine_source = computed(
    () => (machine: Machine) => generateMachineSource(machine, project.value.types ?? [])
  )
  const get_machine_files = computed(
    () => (machine: Machine) => generateMachineFiles(machine, project.value.types ?? [])
  )
  const validate_machine = computed(() => machineValidationErrors)
  const compilation_units = computed(() => allCompilationUnits(project.value))
  const source_compilation_units = computed(() =>
    compilation_units.value.filter((unit) => unit.kind === 'source')
  )
  const test_compilation_units = computed(() =>
    compilation_units.value.filter((unit) => unit.kind === 'test')
  )
  const get_cmake = computed(() => generateCMakeLists(project.value))
  const get_project_files = computed(() => generateProjectFiles(project.value))
  const build_validation_errors = computed(() => projectBuildValidationErrors(project.value))

  return {
    project,
    setProjectName,
    addMachine,
    addNamespace,
    removeMachine,
    removeNamespace,
    addEventToMachine,
    removeEventFromMachine,
    addStateToMachine,
    setInitialState,
    removeStateFromMachine,
    addActionToMachine,
    removeActionFromMachine,
    setActionCode,
    addActionToTransition,
    removeActionFromTransition,
    addGuardToMachine,
    removeGuardFromMachine,
    setGuardCode,
    addGuardToTransition,
    clearGuardFromTransition,
    addTransitionToMachine,
    removeTransitionFromMachine,
    enableContext,
    disableContext,
    addContextEntry,
    removeContextEntry,
    setMachineContextType,
    addType,
    removeType,
    addFieldToType,
    removeFieldFromType,
    setTypeIncludes,
    addCompilationUnit,
    removeCompilationUnit,
    addLibrary,
    removeLibrary,
    toggleLibraryUnit,
    toggleLibraryType,
    toggleLibraryDependency,
    addTestTarget,
    removeTestTarget,
    toggleTestUnit,
    toggleTestLibrary,
    machinesByNamespace,
    generateExport,
    hydrateExport,
    get_machine_header,
    get_machine_events_header,
    get_machine_source,
    get_machine_files,
    validate_machine,
    compilation_units,
    source_compilation_units,
    test_compilation_units,
    get_cmake,
    get_project_files,
    build_validation_errors,
  }
})
