import { describe, expect, it } from 'vitest'

import {
  generateCMakeLists,
  generateLibraryForwardHeader,
  generateProjectFiles,
  projectBuildValidationErrors,
} from './project'
import type { Project } from '@/types'

function projectFixture(): Project {
  return {
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
        transitions: [{ start_state: 'Idle', event: 'Start', target_state: 'Active', actions: [] }],
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
}

describe('project generation', () => {
  it('generates CMake libraries and Catch2/CTest integration', () => {
    const cmake = generateCMakeLists(projectFixture())
    expect(cmake).toContain('project(fairlanes_demo VERSION 1.2.3 LANGUAGES CXX)')
    expect(cmake).toContain('include(cmake/CPM.cmake)')
    expect(cmake).toContain('CPMAddPackage(')
    expect(cmake).toContain('GITHUB_REPOSITORY boost-ext/sml')
    expect(cmake).toContain('add_library(lanes STATIC')
    expect(cmake).toContain('src/fairlanes/LaneMachine.cpp')
    expect(cmake).toContain('target_link_libraries(lanes PUBLIC sml::sml eventpp::eventpp)')
    expect(cmake).toContain('GIT_TAG v3.16.0')
    expect(cmake).toContain('Catch2::Catch2WithMain')
    expect(cmake).toContain('catch_discover_tests(lane_tests)')
  })

  it('generates one forward header per library', () => {
    const project = projectFixture()
    const forward = generateLibraryForwardHeader(project, project.libraries![0])
    expect(forward).toContain('struct LaneContext;')
    expect(forward).toContain('namespace LaneMachineEvents')
    expect(forward).toContain('struct Start;')
    expect(forward).toContain('class LaneMachine;')
    expect(forward).toContain('using LaneMachineEventBus')
  })

  it('lays out CMake, sources, types, tests, and forward declarations', () => {
    const files = generateProjectFiles(projectFixture())
    expect(files.map((file) => file.name)).toEqual(
      expect.arrayContaining([
        'smlmaker.project.json',
        'CMakeLists.txt',
        'cmake/CPM.cmake',
        'src/lanes_fwd.hpp',
        'src/fairlanes/LaneContext.hpp',
        'src/fairlanes/LaneMachine_events.hpp',
        'src/fairlanes/LaneMachine.hpp',
        'src/fairlanes/LaneMachine.cpp',
        'tests/fairlanes/LaneMachineTests.cpp',
      ])
    )
    const header = files.find((file) => file.name.endsWith('/LaneMachine.hpp'))!.contents
    const source = files.find((file) => file.name.endsWith('/LaneMachine.cpp'))!.contents
    const exportedProject = JSON.parse(
      files.find((file) => file.name === 'smlmaker.project.json')!.contents
    ) as Project
    expect(exportedProject).toEqual(projectFixture())
    expect(header).toContain('#include "lanes_fwd.hpp"')
    expect(header).not.toContain('#include "fairlanes/LaneContext.hpp"')
    expect(source).toContain('#include "fairlanes/LaneContext.hpp"')
    expect(source).toContain('#include "LaneMachine_events.hpp"')
  })

  it('validates unit and type ownership', () => {
    const project = projectFixture()
    project.libraries![0].compilation_units = []
    project.libraries![0].types = []
    expect(projectBuildValidationErrors(project)).toEqual(
      expect.arrayContaining([
        'Source compilation unit src/fairlanes/LaneMachine.cpp is not assigned to a library.',
        'Type fairlanes::LaneContext is not assigned to a library.',
      ])
    )
  })

  it('generates optional CPM dependencies and enforces the SDL choice', () => {
    const project = projectFixture()
    project.libraries![0].dependencies = ['ftxui', 'glm', 'sdl3', 'imgui']
    const cmake = generateCMakeLists(project)
    expect(cmake).toContain('GITHUB_REPOSITORY ArthurSonzogni/FTXUI')
    expect(cmake).toContain('CPMAddPackage("gh:g-truc/glm#1.0.3")')
    expect(cmake).toContain('GIT_TAG release-3.4.18')
    expect(cmake).toContain('add_library(imgui::imgui ALIAS smlmaker_imgui)')
    expect(cmake).toContain('SDL3::SDL3')

    project.libraries![0].dependencies.push('sdl2')
    expect(projectBuildValidationErrors(project)).toContain(
      'SDL2 and SDL3 are mutually exclusive; select only one.'
    )
  })
})
