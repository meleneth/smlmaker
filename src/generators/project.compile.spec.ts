import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import process from 'node:process'
import { describe, expect, it } from 'vitest'

import { generateProjectFiles } from './project'
import type { Project } from '@/types'

const dependencies = {
  sml: process.env.SML_SOURCE_DIR,
  eventpp: process.env.EVENTPP_SOURCE_DIR,
  catch2: process.env.CATCH2_SOURCE_DIR,
  cpm: process.env.CPM_FILE,
}
const hasDependencies = Object.values(dependencies).every(Boolean)

describe.skipIf(!hasDependencies)('generated CMake project integration', () => {
  it('configures, builds, and runs Catch2 tests through CPM', () => {
    const directory = mkdtempSync(join(tmpdir(), 'smlmaker-cmake-'))
    try {
      const project: Project = {
        name: 'fairlanes_demo',
        version: '1.2.3',
        cxx_standard: 20,
        namespaces: ['fairlanes'],
        types: [
          {
            name: 'LaneContext',
            namespace: 'fairlanes',
            includes: ['cstdint'],
            fields: [{ name: 'lane_count', type: 'std::uint32_t', value: '2' }],
          },
        ],
        machines: [
          {
            name: 'LaneMachine',
            namespace: 'fairlanes',
            states: ['Idle', 'Active'],
            events: ['Start'],
            guards: [],
            actions: [],
            transitions: [
              {
                start_state: 'Idle',
                event: 'Start',
                target_state: 'Active',
                actions: [],
              },
            ],
            initial_state: 'Idle',
            context: false,
            context_type: 'fairlanes::LaneContext',
          },
        ],
        compilation_units: [],
        libraries: [
          {
            name: 'lanes',
            kind: 'STATIC',
            compilation_units: ['src/fairlanes/LaneMachine.cpp'],
            types: ['fairlanes::LaneContext'],
            dependencies: [],
          },
        ],
        test_targets: [
          {
            name: 'lane_tests',
            compilation_units: ['tests/fairlanes/LaneMachineTests.cpp'],
            libraries: ['lanes'],
          },
        ],
      }

      for (const file of generateProjectFiles(project)) {
        const path = join(directory, file.name)
        mkdirSync(dirname(path), { recursive: true })
        writeFileSync(path, file.contents)
      }
      copyFileSync(dependencies.cpm!, join(directory, 'cmake/CPM.cmake'))

      const buildDirectory = join(directory, 'build')
      const commandEnvironment = { ...process.env, TMPDIR: directory, XDG_RUNTIME_DIR: directory }
      const configure = spawnSync(
        'cmake',
        [
          '-S',
          directory,
          '-B',
          buildDirectory,
          `-DCPM_sml_SOURCE=${dependencies.sml}`,
          `-DCPM_eventpp_SOURCE=${dependencies.eventpp}`,
          `-DCPM_Catch2_SOURCE=${dependencies.catch2}`,
        ],
        { encoding: 'utf8', env: commandEnvironment }
      )
      expect(configure.status, `${configure.stdout}\n${configure.stderr}`).toBe(0)

      const build = spawnSync('cmake', ['--build', buildDirectory, '-j2'], {
        encoding: 'utf8',
        env: commandEnvironment,
      })
      expect(build.status, `${build.stdout}\n${build.stderr}`).toBe(0)

      const tests = spawnSync('ctest', ['--test-dir', buildDirectory, '--output-on-failure'], {
        encoding: 'utf8',
        env: commandEnvironment,
      })
      expect(tests.status, `${tests.stdout}\n${tests.stderr}`).toBe(0)
      expect(tests.stdout).toContain('100% tests passed')
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  }, 120_000)
})
