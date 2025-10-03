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

export interface Machine {
  name: string
  namespace: NamespaceName
  events: EventName[]
  states: StateName[]
  transitions: Transition[]
  guards: GuardName[]
  actions: ActionName[]
  context: Context | false
}

export interface Project {
  name: string
  namespaces: NamespaceName[]
  machines: Machine[]
}
