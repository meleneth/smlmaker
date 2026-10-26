import {
  cppIdentifier,
  cppTypeKey,
  generateMachineFiles,
  generateMachineHeader,
  generateTypeHeader,
} from '@/generators/cpp'
import {
  eventHeaderPath,
  generateEventBusHeader,
  generateEventHeader,
  generateEventHandlersHeader,
} from '@/generators/events'
import type {
  CompilationUnit,
  GeneratedFile,
  LibraryTarget,
  Machine,
  OptionalDependency,
  Project,
} from '@/types'

export const SML_VERSION = 'v1.2.0'
export const EVENTPP_VERSION = 'v0.1.3'
export const CATCH2_VERSION = 'v3.16.0'
export const CPM_VERSION = '0.43.2'

export const OPTIONAL_DEPENDENCIES: Array<{ id: OptionalDependency; label: string }> = [
  { id: 'ftxui', label: 'FTXUI' },
  { id: 'glm', label: 'GLM' },
  { id: 'sdl2', label: 'SDL2' },
  { id: 'sdl3', label: 'SDL3' },
  { id: 'imgui', label: 'Dear ImGui' },
  { id: 'qt6', label: 'Qt 6 (system)' },
  { id: 'gtk4', label: 'GTK 4 (system)' },
]

const dependencyTargets: Record<OptionalDependency, string[]> = {
  ftxui: ['ftxui::component', 'ftxui::dom', 'ftxui::screen'],
  glm: ['glm::glm'],
  sdl2: ['SDL2::SDL2'],
  sdl3: ['SDL3::SDL3'],
  imgui: ['imgui::imgui'],
  qt6: ['Qt6::Core', 'Qt6::Widgets'],
  gtk4: ['PkgConfig::GTK4'],
}

function optionalDependencyCmake(dependencies: Set<OptionalDependency>): string[] {
  const lines: string[] = []
  if (dependencies.has('ftxui')) {
    lines.push('CPMAddPackage(')
    lines.push('  NAME ftxui')
    lines.push('  GITHUB_REPOSITORY ArthurSonzogni/FTXUI')
    lines.push('  GIT_TAG v7.0.3')
    lines.push(
      '  OPTIONS "FTXUI_BUILD_DOCS OFF" "FTXUI_BUILD_EXAMPLES OFF" "FTXUI_BUILD_TESTS OFF"'
    )
    lines.push(')')
  }
  if (dependencies.has('glm')) lines.push('CPMAddPackage("gh:g-truc/glm#1.0.3")')
  if (dependencies.has('sdl2')) {
    lines.push('CPMAddPackage(')
    lines.push('  NAME SDL2')
    lines.push('  GITHUB_REPOSITORY libsdl-org/SDL')
    lines.push('  GIT_TAG release-2.32.10')
    lines.push('  OPTIONS "SDL_TEST OFF"')
    lines.push(')')
  }
  if (dependencies.has('sdl3')) {
    lines.push('CPMAddPackage(')
    lines.push('  NAME SDL3')
    lines.push('  GITHUB_REPOSITORY libsdl-org/SDL')
    lines.push('  GIT_TAG release-3.4.18')
    lines.push('  OPTIONS "SDL_TEST_LIBRARY OFF" "SDL_TESTS OFF"')
    lines.push(')')
  }
  if (dependencies.has('imgui')) {
    lines.push('CPMAddPackage(')
    lines.push('  NAME imgui')
    lines.push('  GITHUB_REPOSITORY ocornut/imgui')
    lines.push('  GIT_TAG v1.92.8')
    lines.push('  DOWNLOAD_ONLY YES')
    lines.push(')')
    lines.push('if(imgui_ADDED)')
    lines.push('  add_library(smlmaker_imgui STATIC')
    lines.push('    "${imgui_SOURCE_DIR}/imgui.cpp"')
    lines.push('    "${imgui_SOURCE_DIR}/imgui_draw.cpp"')
    lines.push('    "${imgui_SOURCE_DIR}/imgui_tables.cpp"')
    lines.push('    "${imgui_SOURCE_DIR}/imgui_widgets.cpp"')
    lines.push('  )')
    lines.push('  target_include_directories(smlmaker_imgui PUBLIC "${imgui_SOURCE_DIR}")')
    lines.push('  add_library(imgui::imgui ALIAS smlmaker_imgui)')
    lines.push('endif()')
  }
  if (dependencies.has('qt6')) lines.push('find_package(Qt6 REQUIRED COMPONENTS Core Widgets)')
  if (dependencies.has('gtk4')) {
    lines.push('find_package(PkgConfig REQUIRED)')
    lines.push('pkg_check_modules(GTK4 REQUIRED IMPORTED_TARGET gtk4)')
  }
  if (lines.length) lines.push('')
  return lines
}

export function generateCpmBootstrap(): string {
  return `set(CPM_DOWNLOAD_VERSION ${CPM_VERSION})
set(CPM_DOWNLOAD_LOCATION "${'${CMAKE_BINARY_DIR}'}/cmake/CPM_${'${CPM_DOWNLOAD_VERSION}'}.cmake")

if(NOT EXISTS "${'${CPM_DOWNLOAD_LOCATION}'}")
  file(DOWNLOAD
    "https://github.com/cpm-cmake/CPM.cmake/releases/download/v${'${CPM_DOWNLOAD_VERSION}'}/CPM.cmake"
    "${'${CPM_DOWNLOAD_LOCATION}'}"
    TLS_VERIFY ON
  )
endif()

include("${'${CPM_DOWNLOAD_LOCATION}'}")
`
}

export function machineSourcePath(machine: Machine): string {
  return `src/${cppIdentifier(machine.namespace, 'global')}/${cppIdentifier(machine.name, 'StateMachine')}.cpp`
}

export function machineTestPath(machine: Machine): string {
  return `tests/${cppIdentifier(machine.namespace, 'global')}/${cppIdentifier(machine.name, 'StateMachine')}Tests.cpp`
}

export function generatedCompilationUnits(project: Project): CompilationUnit[] {
  return project.machines.flatMap((machine) => [
    { path: machineSourcePath(machine), kind: 'source' as const, content: '' },
    { path: machineTestPath(machine), kind: 'test' as const, content: '' },
  ])
}

export function allCompilationUnits(project: Project): CompilationUnit[] {
  return [...generatedCompilationUnits(project), ...(project.compilation_units ?? [])]
}

export function projectBuildValidationErrors(project: Project): string[] {
  const errors: string[] = []
  const libraries = project.libraries ?? []
  const testTargets = project.test_targets ?? []
  const customUnits = project.compilation_units ?? []
  const types = project.types ?? []
  const events = project.events ?? []
  const dependencies = libraries.flatMap((library) => library.dependencies ?? [])
  const sourcePaths = new Set([
    ...project.machines.map(machineSourcePath),
    ...customUnits.filter((unit) => unit.kind === 'source').map((unit) => unit.path),
  ])
  const testPaths = new Set([
    ...project.machines.map(machineTestPath),
    ...customUnits.filter((unit) => unit.kind === 'test').map((unit) => unit.path),
  ])

  if (!project.name.trim()) errors.push('Project name is required for CMake generation.')
  if (libraries.length === 0) errors.push('Define at least one library target.')
  if (dependencies.includes('sdl2') && dependencies.includes('sdl3')) {
    errors.push('SDL2 and SDL3 are mutually exclusive; select only one.')
  }
  if (new Set(libraries.map((library) => cppIdentifier(library.name))).size !== libraries.length) {
    errors.push('Library target names must produce unique C++ identifiers.')
  }
  const eventIdentifiers = events.map(
    (event) => `${cppIdentifier(event.namespace, 'global')}::${cppIdentifier(event.name, 'Event')}`
  )
  if (new Set(eventIdentifiers).size !== eventIdentifiers.length) {
    errors.push('eventpp event names must produce unique qualified C++ identifiers.')
  }
  for (const event of events) {
    if (!event.name.trim() || !event.namespace.trim()) {
      errors.push('eventpp events require both a namespace and a name.')
    }
    for (const handler of event.handlers ?? []) {
      const machine = project.machines.find(
        (candidate) =>
          candidate.namespace === handler.machine_namespace &&
          candidate.name === handler.machine_name
      )
      if (!machine?.events.includes(handler.machine_event)) {
        errors.push(
          `eventpp handler ${event.namespace}::${event.name} references unknown machine event ${handler.machine_namespace}::${handler.machine_name}.${handler.machine_event}.`
        )
      }
    }
  }
  for (const library of libraries) {
    if (!library.name.trim()) errors.push('Library target names cannot be blank.')
    if (library.compilation_units.length === 0) {
      errors.push(`Library ${library.name || '(unnamed)'} has no compilation units.`)
    }
    for (const path of library.compilation_units) {
      if (!sourcePaths.has(path))
        errors.push(`Library ${library.name} references unknown unit ${path}.`)
    }
  }
  for (const path of sourcePaths) {
    const ownerCount = libraries.filter((library) =>
      library.compilation_units.includes(path)
    ).length
    if (ownerCount === 0) {
      errors.push(`Source compilation unit ${path} is not assigned to a library.`)
    } else if (ownerCount > 1) {
      errors.push(`Source compilation unit ${path} is assigned to more than one library.`)
    }
  }
  for (const target of testTargets) {
    if (!target.name.trim()) errors.push('Test target names cannot be blank.')
    if (target.compilation_units.length === 0) {
      errors.push(`Test target ${target.name || '(unnamed)'} has no compilation units.`)
    }
    for (const path of target.compilation_units) {
      if (!testPaths.has(path))
        errors.push(`Test target ${target.name} references unknown unit ${path}.`)
    }
    for (const library of target.libraries) {
      if (!libraries.some((candidate) => candidate.name === library)) {
        errors.push(`Test target ${target.name} references unknown library ${library}.`)
      }
    }
  }
  const validTypeKeys = new Set(types.map((type) => `${type.namespace}::${type.name}`))
  for (const type of types) {
    const key = cppTypeKey(type)
    const ownerCount = libraries.filter((library) => (library.types ?? []).includes(key)).length
    if (ownerCount === 0) errors.push(`Type ${key} is not assigned to a library.`)
    else if (ownerCount > 1) errors.push(`Type ${key} is assigned to more than one library.`)
  }
  for (const machine of project.machines) {
    if (machine.context_type && !validTypeKeys.has(machine.context_type)) {
      errors.push(
        `Machine ${machine.name} references unknown context type ${machine.context_type}.`
      )
    }
  }
  for (const unit of customUnits) {
    if (!/^(src|tests)\/[a-zA-Z0-9_./-]+\.cpp$/.test(unit.path) || unit.path.includes('..')) {
      errors.push(`Compilation unit path is invalid: ${unit.path || '(blank)'}.`)
    }
  }
  return [...new Set(errors)]
}

function cmakeList(items: string[], indent = '  '): string {
  return items.map((item) => `${indent}${item}`).join('\n')
}

export function generateCMakeLists(project: Project): string {
  const projectName = cppIdentifier(project.name, 'smlmaker_project')
  const version = project.version?.trim() || '0.1.0'
  const standard = project.cxx_standard ?? 17
  const libraries = project.libraries ?? []
  const testTargets = project.test_targets ?? []
  const optionalDependencies = new Set(libraries.flatMap((library) => library.dependencies ?? []))
  const hasTests = testTargets.length > 0
  const lines = [
    'cmake_minimum_required(VERSION 3.24)',
    `project(${projectName} VERSION ${version} LANGUAGES CXX)`,
    '',
    'set(CMAKE_CXX_EXTENSIONS OFF)',
    '',
    'include(cmake/CPM.cmake)',
    'CPMAddPackage(',
    '  NAME sml',
    '  GITHUB_REPOSITORY boost-ext/sml',
    `  GIT_TAG ${SML_VERSION}`,
    ')',
    'CPMAddPackage(',
    '  NAME eventpp',
    '  GITHUB_REPOSITORY wqking/eventpp',
    `  GIT_TAG ${EVENTPP_VERSION}`,
    '  OPTIONS "EVENTPP_INSTALL OFF"',
    ')',
    '',
    ...optionalDependencyCmake(optionalDependencies),
  ]

  for (const library of libraries) {
    const target = cppIdentifier(library.name, 'library')
    lines.push(`add_library(${target} ${library.kind}`)
    if (library.compilation_units.length) lines.push(cmakeList(library.compilation_units))
    lines.push(')')
    lines.push(`target_compile_features(${target} PUBLIC cxx_std_${standard})`)
    lines.push(
      `target_include_directories(${target} PUBLIC "${'${CMAKE_CURRENT_SOURCE_DIR}'}/src")`
    )
    const links = [
      'sml::sml',
      'eventpp::eventpp',
      ...(library.dependencies ?? []).flatMap((dependency) => dependencyTargets[dependency]),
    ]
    lines.push(`target_link_libraries(${target} PUBLIC ${links.join(' ')})`)
    lines.push('')
  }

  if (hasTests) {
    lines.push('include(CTest)')
    lines.push('if(BUILD_TESTING)')
    lines.push('  CPMAddPackage(')
    lines.push('    NAME Catch2')
    lines.push('    GITHUB_REPOSITORY catchorg/Catch2')
    lines.push(`    GIT_TAG ${CATCH2_VERSION}`)
    lines.push('  )')
    lines.push('  list(APPEND CMAKE_MODULE_PATH "${Catch2_SOURCE_DIR}/extras")')
    lines.push('  include(Catch)')
    lines.push('')
    for (const testTarget of testTargets) {
      const target = cppIdentifier(testTarget.name, 'tests')
      lines.push(`  add_executable(${target}`)
      if (testTarget.compilation_units.length) {
        lines.push(cmakeList(testTarget.compilation_units, '    '))
      }
      lines.push('  )')
      const dependencies = [
        ...testTarget.libraries.map((library) => cppIdentifier(library, 'library')),
        'Catch2::Catch2WithMain',
      ]
      lines.push(`  target_link_libraries(${target} PRIVATE ${dependencies.join(' ')})`)
      lines.push(`  target_compile_features(${target} PRIVATE cxx_std_${standard})`)
      lines.push(`  catch_discover_tests(${target})`)
      lines.push('')
    }
    lines.push('endif()')
    lines.push('')
  }

  return lines.join('\n')
}

export function libraryForwardPath(library: LibraryTarget): string {
  return `src/${cppIdentifier(library.name, 'library')}_fwd.hpp`
}

export function generateLibraryForwardHeader(project: Project, library: LibraryTarget): string {
  const machines = project.machines.filter((machine) =>
    library.compilation_units.includes(machineSourcePath(machine))
  )
  const types = (project.types ?? []).filter((type) =>
    (library.types ?? []).includes(cppTypeKey(type))
  )
  const lines = ['#pragma once', '']

  for (const type of types) {
    const ns = cppIdentifier(type.namespace, 'global')
    lines.push(`namespace ${ns} {`)
    lines.push(`struct ${cppIdentifier(type.name, 'Context')};`)
    lines.push(`} // namespace ${ns}`)
    lines.push('')
  }
  for (const machine of machines) {
    const ns = cppIdentifier(machine.namespace, 'global')
    const cls = cppIdentifier(machine.name, 'StateMachine')
    const events = [...new Set(machine.events.map((event) => cppIdentifier(event)))]
    const registeredEvents = events.length ? events : ['NoopEvent']
    lines.push(`namespace ${ns} {`)
    lines.push(`namespace ${cls}Events {`)
    registeredEvents.forEach((event) => lines.push(`struct ${event};`))
    lines.push(`} // namespace ${cls}Events`)
    lines.push('')
    lines.push('template <class... Events>')
    lines.push(`class ${cls}TypedEventBus;`)
    lines.push(
      `using ${cls}EventBus = ${cls}TypedEventBus<${registeredEvents
        .map((event) => `${cls}Events::${event}`)
        .join(', ')}>;`
    )
    lines.push(`class ${cls};`)
    lines.push(`} // namespace ${ns}`)
    lines.push('')
  }
  return lines.join('\n')
}

export function generateMachineTest(machine: Machine, types: Project['types'] = []): string {
  const ns = cppIdentifier(machine.namespace, 'global')
  const cls = cppIdentifier(machine.name, 'StateMachine')
  const context = types?.find((type) => cppTypeKey(type) === machine.context_type)
  if (context?.kind === 'context' && context.fields.length) {
    return `#include <catch2/catch_test_macros.hpp>
#include <type_traits>

#include "${ns}/${cls}.hpp"

TEST_CASE("${cls} requires its borrowed context", "[${cls}]") {
  STATIC_REQUIRE(!std::is_default_constructible_v<${ns}::${cls}>);
}
`
  }
  return `#include <catch2/catch_test_macros.hpp>

#include "${ns}/${cls}.hpp"

TEST_CASE("${cls} can be constructed", "[${cls}]") {
  REQUIRE_NOTHROW(${ns}::${cls}{});
}
`
}

export function generateProjectFiles(project: Project): GeneratedFile[] {
  const types = project.types ?? []
  const events = project.events ?? []
  const files: GeneratedFile[] = [
    { name: 'smlmaker.project.json', contents: `${JSON.stringify(project, null, 2)}\n` },
    { name: 'CMakeLists.txt', contents: generateCMakeLists(project) },
    { name: 'cmake/CPM.cmake', contents: generateCpmBootstrap() },
  ]

  for (const library of project.libraries ?? []) {
    files.push({
      name: libraryForwardPath(library),
      contents: generateLibraryForwardHeader(project, library),
    })
  }

  for (const type of types) {
    const ns = cppIdentifier(type.namespace, 'global')
    const name = cppIdentifier(type.name, 'Context')
    files.push({ name: `src/${ns}/${name}.hpp`, contents: generateTypeHeader(type) })
  }
  if (events.length) {
    files.push({ name: 'src/events.hpp', contents: generateEventBusHeader(project.name, events) })
    for (const event of events) {
      files.push({ name: eventHeaderPath(event), contents: generateEventHeader(event) })
    }
    if (events.some((event) => event.handlers?.length)) {
      files.push({ name: 'src/event_handlers.hpp', contents: generateEventHandlersHeader(project) })
    }
  }
  for (const machine of project.machines) {
    const directory = `src/${cppIdentifier(machine.namespace, 'global')}`
    const owner = project.libraries?.find((library) =>
      library.compilation_units.includes(machineSourcePath(machine))
    )
    const forwardHeader = owner ? `${cppIdentifier(owner.name, 'library')}_fwd.hpp` : ''
    const machineFiles = generateMachineFiles(machine, types)
    machineFiles[1] = {
      ...machineFiles[1],
      contents: generateMachineHeader(machine, types, forwardHeader),
    }
    for (const file of machineFiles) {
      files.push({ name: `${directory}/${file.name}`, contents: file.contents })
    }
    files.push({ name: machineTestPath(machine), contents: generateMachineTest(machine, types) })
  }
  for (const unit of project.compilation_units ?? []) {
    files.push({ name: unit.path, contents: unit.content })
  }
  return files
}
