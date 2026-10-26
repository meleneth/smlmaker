import { describe, expect, it } from 'vitest'

import { generateEventBusHeader, generateEventHandlersHeader, generateEventHeader } from './events'
import type { EventDefinition, Project } from '@/types'

const event: EventDefinition = {
  name: 'Race Started',
  namespace: 'game',
  includes: ['cstdint'],
  fields: [{ name: 'race_id', type: 'std::uint64_t', value: '0' }],
  handlers: [
    {
      machine_namespace: 'game',
      machine_name: 'Race',
      machine_event: 'Start',
    },
  ],
}

describe('eventpp generation', () => {
  it('generates a strongly typed payload and project event bus', () => {
    expect(generateEventHeader(event)).toContain('struct Race_Started')
    expect(generateEventHeader(event)).toContain('std::uint64_t race_id = 0;')

    const bus = generateEventBusHeader('Fair Lanes', [event])
    expect(bus).toContain('#include "game/Race_Started.hpp"')
    expect(bus).toContain('using EventBus = TypedEventBus<::game::Race_Started>;')
  })

  it('generates an RAII bridge from eventpp to an SML machine event', () => {
    const project = {
      name: 'Fair Lanes',
      namespaces: ['game'],
      machines: [],
      events: [event],
    } satisfies Project
    const handlers = generateEventHandlersHeader(project)

    expect(handlers).toContain('#include "game/Race.hpp"')
    expect(handlers).toContain('bus_.on<::game::Race_Started>')
    expect(handlers).toContain('game_race_.Start();')
    expect(handlers).toContain('bus_.remove<::game::Race_Started>(handler_0_)')
  })
})
