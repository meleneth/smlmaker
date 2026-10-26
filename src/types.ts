export type NamespaceName = string
export type StateName = string
export type EventName = string
export type GuardName = string
export type ActionName = string
export type MachineName = string

export interface Transition {
  event: EventName
  start_state: StateName
  target_state: StateName
  guard?: GuardName
  actions: ActionName[]
}

export interface Context {
  name: string
  entries: ContextEntry[]
}

export interface ContextEntry {
  name: string
  type: string
  value: string
}

export interface CppType {
  name: string
  namespace: NamespaceName
  fields: ContextEntry[]
  includes: string[]
}

export type CompilationUnitKind = 'source' | 'test'

export interface CompilationUnit {
  path: string
  kind: CompilationUnitKind
  content: string
}

export type LibraryKind = 'STATIC' | 'SHARED' | 'OBJECT'
export type OptionalDependency = 'ftxui' | 'glm' | 'sdl2' | 'sdl3' | 'imgui' | 'qt6' | 'gtk4'

export interface LibraryTarget {
  name: string
  kind: LibraryKind
  compilation_units: string[]
  types: string[]
  dependencies: OptionalDependency[]
}

export interface TestTarget {
  name: string
  compilation_units: string[]
  libraries: string[]
}

export interface Machine {
  name: string
  namespace: NamespaceName
  events: EventName[]
  states: StateName[]
  transitions: Transition[]
  guards: GuardName[]
  actions: ActionName[]
  context: Context | false
  initial_state?: StateName
  action_code?: Record<ActionName, string>
  guard_code?: Record<GuardName, string>
  context_type?: string
}

export interface GeneratedFile {
  name: string
  contents: string
}

export interface Project {
  name: string
  namespaces: NamespaceName[]
  machines: Machine[]
  version?: string
  cxx_standard?: 17 | 20 | 23
  types?: CppType[]
  compilation_units?: CompilationUnit[]
  libraries?: LibraryTarget[]
  test_targets?: TestTarget[]
}
