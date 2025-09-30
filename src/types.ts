export type NamespaceName = string
export type StateName = string
export type EventName = string
export type MachineName = string

export interface Transition {
  event: EventName
  start_state: StateName
  end_state: StateName
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
export interface Guard {
  name: string
}
export interface Machine {
  name: string
  namespace: NamespaceName
  events: EventName[]
  states: StateName[]
  transitions: Transition[]
  guards: Guard[]
  context: Context | false
}
export interface Project {
  name: string
  namespaces: NamespaceName[]
  machines: Machine[]
}
