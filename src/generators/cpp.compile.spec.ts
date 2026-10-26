import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import process from 'node:process'
import { describe, expect, it } from 'vitest'

import { generateMachineFiles } from './cpp'
import type { Machine } from '@/types'

const smlInclude = process.env.SML_INCLUDE_DIR
const eventppInclude = process.env.EVENTPP_INCLUDE_DIR

describe.skipIf(!smlInclude || !eventppInclude)('generated C++ integration', () => {
  it('compiles and runs with Boost.SML and eventpp', () => {
    const directory = mkdtempSync(join(tmpdir(), 'smlmaker-cpp-'))
    try {
      const machine: Machine = {
        name: 'Door',
        namespace: 'game',
        states: ['Closed', 'Open'],
        events: ['OpenRequested', 'CloseRequested'],
        guards: ['CanOpen'],
        actions: ['RecordOpen', 'Notify'],
        initial_state: 'Closed',
        context: {
          name: 'DoorContext',
          entries: [{ name: 'open_count', type: 'int', value: '0' }],
        },
        guard_code: { CanOpen: 'context.open_count < 3' },
        action_code: {
          RecordOpen: '++context.open_count;',
          Notify: 'context.open_count += 0;',
        },
        transitions: [
          {
            start_state: 'Closed',
            event: 'OpenRequested',
            target_state: 'Open',
            guard: 'CanOpen',
            actions: ['RecordOpen', 'Notify'],
          },
          {
            start_state: 'Open',
            event: 'CloseRequested',
            target_state: 'Closed',
            actions: [],
          },
        ],
      }

      for (const file of generateMachineFiles(machine)) {
        writeFileSync(join(directory, file.name), file.contents)
      }
      const secondMachine: Machine = {
        name: 'Light',
        namespace: 'game',
        states: ['Off', 'On'],
        events: ['OpenRequested'],
        guards: [],
        actions: ['Log'],
        initial_state: 'Off',
        context: false,
        transitions: [
          {
            start_state: 'Off',
            event: 'OpenRequested',
            target_state: 'On',
            actions: ['Log'],
          },
        ],
      }
      for (const file of generateMachineFiles(secondMachine)) {
        writeFileSync(join(directory, file.name), file.contents)
      }
      writeFileSync(
        join(directory, 'main.cpp'),
        `#include "Door.hpp"
#include "Light.hpp"
#include <cassert>
int main() {
  game::Door door;
  game::Light light;
  int observed = 0;
  auto handle = door.event_bus().on<game::DoorEvents::OpenRequested>(
    [&observed](const game::DoorEvents::OpenRequested&) { ++observed; });
  door.OpenRequested();
  assert(observed == 1);
  assert(door.context().open_count == 1);
  assert(door.event_bus().remove<game::DoorEvents::OpenRequested>(handle));
  door.event_bus().emit(game::DoorEvents::CloseRequested{});
  light.OpenRequested();
}
`
      )

      const compiler = process.env.CXX || 'c++'
      const executable = join(directory, 'smoke')
      const compile = spawnSync(
        compiler,
        [
          '-std=c++17',
          '-Wall',
          '-Wextra',
          '-Werror',
          `-I${directory}`,
          `-I${smlInclude}`,
          `-I${eventppInclude}`,
          join(directory, 'Door.cpp'),
          join(directory, 'Light.cpp'),
          join(directory, 'main.cpp'),
          '-o',
          executable,
        ],
        { encoding: 'utf8' }
      )
      expect(compile.stderr).toBe('')
      expect(compile.status).toBe(0)

      const run = spawnSync(executable, [], { encoding: 'utf8' })
      expect(run.stderr).toBe('')
      expect(run.status).toBe(0)
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })
})
