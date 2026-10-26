# SMLmaker

SMLmaker is a Vue application for defining state machines and complete CMake-based C++ source
trees backed by [Boost-ext.SML](https://github.com/boost-ext/sml) and an
[eventpp](https://github.com/wqking/eventpp) typed event bus.

## What it generates

Each machine produces three files under `src/<namespace>/`:

- `<Machine>_events.hpp` — public event types and an eventpp `HeterEventDispatcher` wrapper.
- `<Machine>.hpp` — the move-only machine facade, optional context, and event-bus access.
- `<Machine>.cpp` — the SML transition table, guard/action implementations, and eventpp-to-SML wiring.

Calling a generated event method or `machine.event_bus().emit(Event{})` synchronously sends
the event through eventpp. The machine's internal listener processes it with SML, while
application listeners can observe the same event. The UI downloads one machine or a complete
project ZIP with this layout:

```text
smlmaker.project.json
CMakeLists.txt
cmake/CPM.cmake
src/
  events.hpp
  event_handlers.hpp
  <library>_fwd.hpp
  <namespace>/<Event>.hpp
  <namespace>/<Machine>_events.hpp
  <namespace>/<Machine>.hpp
  <namespace>/<Machine>.cpp
  <namespace>/<ReusableType>.hpp
tests/
  <namespace>/<Machine>Tests.cpp
```

The JSON file is an importable copy of the entire SMLmaker project definition. The Libraries
screen defines static, shared, or object libraries and assigns every source compilation unit and
reusable type to its owning library. SMLmaker emits one forward-declaration header per library;
machine interfaces include it while concrete headers stay in implementation files wherever
possible. Catch2 executables are independently configurable and registered with CTest.

Event payload types are scoped as `<namespace>::<Machine>Events::<Event>`, preventing collisions
when several generated machines share a C++ namespace.

Reusable C++ types make context-heavy designs straightforward: define a namespaced type and its
fields once, assign it to a library, then select it as the context for any machine. Inline
machine-specific contexts remain available.

The Events screen defines the project-level typed messages carried by eventpp independently from
the transition events that drive individual state machines. An eventpp event can optionally be
connected to one or more machine events; `event_handlers.hpp` provides an RAII adapter that owns
those subscriptions and forwards each message to the selected machine method.

Reusable types can be ordinary value types or borrowed context objects. Context objects follow
the Fairlanes capability pattern: constructor references are stored as raw pointers and exposed
through reference-returning accessors. Machines using a non-empty context object require that
context at construction instead of attempting to default-construct borrowed dependencies.

Generated projects use CPM.cmake to acquire Boost-ext.SML, eventpp, Catch2, and selected optional
source dependencies. The Build screen's per-library checkboxes support FTXUI, GLM, SDL2, SDL3,
Dear ImGui, Qt 6, and GTK 4. SDL2 and SDL3 are mutually exclusive across the project. Qt and GTK
are discovered as system frameworks (`find_package`/pkg-config); the other dependencies are
acquired by CPM.

## Development

```sh
npm ci
npm run dev
```

Run the frontend checks with:

```sh
npm run type-check
npm test -- --run
npm run build
```

The optional integration test compiles and runs a generated machine against real library
headers:

```sh
SML_INCLUDE_DIR=/path/to/sml/include \
EVENTPP_INCLUDE_DIR=/path/to/eventpp/include \
npm run test:cpp
```

`CXX` may be set to choose a compiler. The integration test checks eventpp delivery, SML
transition processing, multiple action sequencing, guard evaluation, and context mutation.

The full-project integration test generates the source tree, configures it with CMake, builds its
libraries and Catch2 executable, and runs CTest:

```sh
SML_SOURCE_DIR=/path/to/sml \
EVENTPP_SOURCE_DIR=/path/to/eventpp \
CATCH2_SOURCE_DIR=/path/to/Catch2 \
CPM_FILE=/path/to/CPM.cmake \
npm run test:project-cpp
```

## Project data

Project definitions can be copied as compressed text and imported later. Plain JSON using the
`Project` shape in `src/types.ts` is also accepted. Older exports are normalized when loaded.
