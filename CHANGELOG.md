# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [8.0.1] - 2026-08-06

### Changed
- Add codegraph to gitignore. by @Oberacda

### Fixed
- Handle slow ROS service calls by @Oberacda


## [8.0.0] - 2026-05-21

### Added
- Add reference list and dict types
- Add ros name param
- Add handling for ros messages
- Add handling for ros types
- Add dict and list json inputs

### Changed
- Bump to version 8.0.0. by @Oberacda
- Merge branch 'main' into node-data-rework by @Oberacda
- Update readme. by @Oberacda
- Fix issues in the github build file. by @Oberacda
- Change bun versions. by @Oberacda
- Adapt github workflows. by @Oberacda
- Switch to bun for building an packaging. by @Oberacda
- Minor fixes
- Simplify handling of generic type fields
- Update WiringData display
- Fix ros type updates through name field
- Update data serialization
- Set default value if input is switched to static
- Fix ros type validation
- Fix ros type serialization
- Update data value serialization
- Fix node update handling
- Update type input handling
- Update builtin type handling
- Fix tree display and wiring
- Fix type param handling
- Handle all simple inputs (no iterables no ros types)
- Update to new data types, no inputs no ros types
- Enable nested tree display in [#48](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/48)

### Removed
- Remove linting from build step. by @Oberacda
- Remove node versioning
- Removed unused services
- Remove getShortDoc utility, IO is no longer included in docstring
- Remove blank type, improve validation
- Remove strict length strings


## [7.1.0] - 2026-03-04

### Changed
- Bump version. by @Oberacda

### Removed
- Remove bad default and auto-update options in [#47](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/47)


## [7.0.1] - 2026-02-17

### Changed
- Bump version. by @Oberacda
- Use new tree_ref to associate nodes and subtrees in [#46](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/46)


## [7.0.0] - 2026-02-10

### Added
- Add EnumSwitchIcon by @nspielbau in [#43](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/43)

### Changed
- Bump verison to 7.0.0 by @Oberacda
- Logging display in [#45](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/45)

## New Contributors
* @nspielbau made their first contribution in [#43](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/43)

## [6.0.2] - 2026-01-27

### Added
- Adds support for the `bytes` type in [#42](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/42)
- Add skip rule for 'Update changelog' message by @Oberacda

### Changed
- Bump version. by @Oberacda
- Use node_id for wiring targets in [#44](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/44)
- Exclude CHANGELOG.md from Prettier checks by @Oberacda


## [6.0.1] - 2026-01-14

### Changed
- Bump version. by @Oberacda
- Fix lint workflow. by @Oberacda


## [6.0.0] - 2026-01-14

### Changed
- Bump version to 6.0.0 by @Oberacda
- Fix changelog. by @Oberacda
- Disable do not commit to main check. by @Oberacda
- Fix pre-commit issues. by @Oberacda
- Use UUIDs for BTNodes in [#38](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/38)
- Auto connect in [#40](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/40)
- Highlight nodes in broken state in [#41](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/41)
- Merge pull request #39 from Doomse/remove-shutdown-on-save by @Oberacda in [#39](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/39)

### Removed
- Remove shutdown call when saving tree


## [5.0.0] - 2025-09-08

### Changed
- Bump version. by @Oberacda
- Merge pull request #36 from Doomse/data-vert-update by @Oberacda in [#36](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/36)
- Correctly id and update data vertices
- Merge pull request #35 from Doomse/quick-save by @Oberacda in [#35](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/35)
- Update editor store for quickSave
- Quick save function and icon
- Initial Quick Save button
- Merge pull request #34 from Doomse/quick-select-icon-colors by @Oberacda in [#34](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/34)
- Update vite config to include new module
- Use updated svgs inline to allow css styling.
- Merge pull request #33 from Doomse/pure-svg-editor by @Oberacda in [#33](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/33)
- Properly redraw tree when display mode changes


## [4.1.0] - 2025-08-18

### Added
- Add changelog ci job. by @Oberacda
- Add changelog. by @Oberacda

### Changed
- Merge pull request #32 from Doomse/pure-svg-editor by @Oberacda in [#32](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/32)
- Align root drop target
- Fix lint issues
- Merge branch 'main' into pure-svg-editor

## New Contributors
* @github-actions[bot] made their first contribution

## [4.0.1] - 2025-05-22

### Changed
- Fix build issue. by @Oberacda


## [4.0.0] - 2025-05-22

### Added
- Add settings panel for configuration, allow toggle for data publishing
- Add basic output for tree data

### Changed
- Increase version to 4.0.0 by @Oberacda
- Make ros connections shallowRefs. by @Oberacda
- Update editor store. by @Oberacda
- Update messages fuese. by @Oberacda
- Update nodes fuse. by @Oberacda
- Update package fuse. by @Oberacda
- Merge pull request #31 from Doomse/tree-message-rework by @Oberacda in [#31](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/31)
- Reset persistent editor state on disconnect (assumes backend restart)
- Always display tree state of main tree
- Fix linting errors
- Persist publish settings
- Handle updated tree topics
- Tree data subscriber
- Fix data edge drawing indicator
- Update linking between selected nodes and edges
- Seperate IOData and OptionData
- Revert to explicitly specifying "serialized" on message fields
- Update message type definitions and basic tree drawing
- Merge pull request #30 from Doomse/main by @Oberacda in [#30](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/30)
- Color data-edge drawing indicator on valid target
- Simplify node text line breaks
- Disable text interactions
- Update resetview function
- Fix root drop target
- Line breaks and state icons
- Simple svg editor nodes
- Update d3 version
- Update vue version
- Major updates that don't cause breaking changes
- Minor updates, patches and removal of unused packages
- Specify file extensions in eslint config
- Update vite config (remove unused package)
- Fix sizing of editor canvas
- Second batch of (manual) eslint changes
- Change casing for fontawesome icon component
- Use default js extension for eslint
- First batch of eslint changes
- Properly specify the use of ESModule js in configs
- Update GitHub workflow and README
- Update project configs, mainly eslint
- Fix width of main column to avoid display issues
- Update package versions. by @Oberacda


## [release/3.3.1] - 2025-02-26

### Changed
- Fix missing icons. by @Oberacda


## [release/3.3.0] - 2025-02-26

### Added
- Add Icons for Quick Select
- Add Quick Select for Flow Control Nodes
- Add node list icons
- Add selection color for lightmode
- Add placeholder text to search bars
- Add text for node state
- Add searcher with partial messages

### Changed
- Merge pull request #29 from Doomse/editor-updates by @Oberacda in [#29](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/29)
- Update icons, add hover text
- Update Node with, collapse package loader
- Update node state icon display
- Switch to localStorage to persist data
- Change Decorator definition
- Fix lint errors
- Update data edge drawing
- Update node state display
- Update node list display and descriptions
- Update RosType Defaults
- Compact node list display
- Merge pull request #28 from Doomse/tree-manip-updates by @Oberacda in [#28](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/28)
- Typing and linting changes
- Fix str type for node options
- Use tree manip helpers in node edit components
- Use replace service for center drop target
- Redo node drag handling, center target missing
- Move service calls to Promise based helper
- Merge pull request #27 from Doomse/enum-values by @Oberacda in [#27](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/27)
- Merge pull request #26 from Doomse/type-hints by @Oberacda in [#26](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/26)
- Generic handling for TypeWrapper info
- Fix rebase issues
- Handle new type wrapper with support for builtin types and ros dicts
- Fetch message fields into json editor when appropriate
- Parse type hints and change search fuse
- Fully hide type hints in prettyprint
- Revert changes coming from a different branch/feature
- Allow node options to give type hints


## [release/3.2.3] - 2025-01-23

### Added
- Add tree undefined checks to editor
- Add state icons

### Changed
- Merge pull request #22 from Doomse/editor-display by @Oberacda in [#22](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/22)
- Update colors
- Nodes have their min-height dynamically changed if their number in- or outputs changes
- Change initial node list loading to happen after namespace adjustment
- Update tree editor
- Merge pull request #24 from Doomse/main by @Oberacda in [#24](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/24)
- Fix path building for packages (use name instead of full path)


## [release/3.2.2] - 2025-01-14

### Added
- Add default values to Ros Message types

### Changed
- Merge pull request #21 from Doomse/main by @Oberacda in [#21](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/21)
- Change action default type. by @Oberacda
- Do not consider current type value when filtering for Names


## [release/3.2.0] - 2025-01-13

### Added
- Add CI workflow. by @Oberacda

### Changed
- Merge pull request #20 from Doomse/type_system by @Oberacda in [#20](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/20)
- Fix node versions in CI. by @Oberacda
- Fix Math type imports
- Reduce some lint rules to warnings.
- Fix file type regex
- Reapply changes for handling math types
- Apply lint and format changes
- Fix setting node options for existing node
- Update search result display
- Redo default value registration for python types
- Update node option handling
- Unify handling of NodeMsg and builtin types
- Restructure Message Type publishing
- Reset names for math types
- Clone default values when using them
- Handle Ros Topic types
- Handle Ros Action types
- Handle Ros Channel Names
- Handle Ros Types
- Apply formatter changes
- Apply linting changes
- Move python type information into separate file
- Use new module for math types
- Implement FilePath param
- Merge pull request #16 from Doomse/fix-operation-node by @Oberacda in [#16](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/16)
- Fix MathOperandType assigning to the wrong param
- Fix formatting issues. by @Oberacda

### Removed
- Remove usage of deleted type
- Remove GetMessageFields usage


## [release/3.1.0] - 2024-12-16

### Added
- Add multi-delete option

### Changed
- Update pr script. by @Oberacda
- Merge pull request #12 from Doomse/main by @Oberacda in [#12](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/12)
- Fixed handling of zoom when drawing tree
- Fix node morphing
- Multi-delete confirmation
- Disable loadsave when viewing subtrees
- Filter package folders
- Minor todos
- Cleanup editor css
- Update Edit Node Display
- Unify Math Node Params
- Revert "remove unused components"
- Use scoped styles to avoid interference between components
- Clean up minor editor todos
- Delay node dragging start
- Clean up minor todos
- Update layout of namespace component
- Update nodelist layout
- Update editor color scheme
- Update editor coloring
- Tree name and state display consideres selected subtree
- Update multi-selection
- Generate and Save Subtrees
- Update scrollable components
- Edge select component and highlighting update

### Fixed
- Fix top-bar height

### Removed
- Remove unused component
- Remove unused components


## [release/3.0.0] - 2024-11-04

### Added
- Add PR creation script. by @Oberacda
- Added save tree modal
- Add modal specific buttons, clean up type PackageStructure
- Add ui icons, notes on backend changes
- Add datadraw indicator and highlights, clean up comments
- Add listener names
- Add layer and tree display modes, pending icons
- Add tree msg subscriber, temporarily remove selected_subtree logic
- Add license headers for vue files. by @Oberacda
- Add license headers by @Oberacda
- Add license header. by @Oberacda
- Add vitests. by @Oberacda
- Add EditorSkinSelection and SelectSubtree components. by @Oberacda
- Add NodeList and PackageManager components. by @Oberacda
- Add vue modal to project. by @Oberacda
- Add vue-notification library by @Oberacda

### Changed
- Fix invalid store in BehaviorTreeEdge.vue by @Oberacda
- Merge pull request #10 from Doomse/dev-vue by @Oberacda in [#10](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/10)
- Clean up minor todos
- Enable multi-selecting nodes iteratively
- Update LoadSave modals
- Consistent spacing in node list
- Move scroll component to node list
- Redo button spacing css
- Minor styling fix
- Layout and styling updates, dark mode toggle for window
- Allow manual changes for tree name, disable auto rename on save
- Visual update for control bars
- Update data graph hover highlighting
- Update fuzzy search functions
- Reenable svg-use elements, they ignore pointer-events
- Change data graph display
- Update JSONInput and ROS Messages
- Rename tree after saving it
- Use the new edit_node store in favor over passing props.
- Move data about selecting and editing nodes into new store
- Allow to search messages based on ros type (msg/srv/action)
- Move filtered_nodes logic to nodes_store as it seems more appropriate
- Update message_type handling
- The JSONinput is WIP, message fields service is working but results look weird
- Update load-save modal visuals
- Reposition notifications, hold them active on hover
- Load tree modal function
- Various minor cleanups
- Normalize logic to always use the Package type
- Merge branch 'fzi-forschungszentrum-informatik:dev-vue' into dev-vue
- Implement tree editor. by @Oberacda in [#9](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/9)
- Remote file browser part2
- Remote file browser part1
- Layout remote file browser
- Update selected node display
- Implement OptionRef handling
- Revert node id change, backend takes care of this
- Node update component is populated but disabled on subtrees
- Receive and display subtrees
- Collect subtree info, enable subtree selection
- Move d3 relevant css classes to constants
- Adjust data edge drawing
- Data edge creation, move hightlighted edge to foreground
- Set up data for edge drawing, also fix node dropping for siblings
- Adjust namespace selection to work on init
- Edit appearence control buttons
- Adapt curve type
- Draw data edges, includes mouse events
- Fix data edge collection
- Finish data vertex drawing, start data edge collection
- Draw data graph vertices
- Allow to move existing nodes
- Allow click and drag of canvas nodes
- Fix Editor sizing
- Drop new nodes into the tree
- Implement drag&drop for new nodes
- Auto-draw tree
- Fix dragging mouseup
- Draw drop targets
- Draw tree layout
- Move more editor styling
- Shuffle some scss to more fitting places
- Draw node boxes and names
- Revert "Add license headers" by @Oberacda
- Begin implementing the D3 editor by @Oberacda
- Implement multiple selection by @Oberacda
- Implement node editor selection and edge selection by @Oberacda
- Implement node creation by @Oberacda
- Implement NewNode and EditableNode components by @Oberacda
- Rename spacer to RightAlignSpacer by @Oberacda
- Finish load save control by @Oberacda
- Change icon and update gitlab pipeline by @Oberacda
- Fix style issues. by @Oberacda
- Initial commit. by @Oberacda

### Fixed
- Fix resolving optionref default values
- Fix basic paraminputs
- Fix fuse option config
- Fix node type-param dropdown

### Removed
- Remove svg-use elements as they break event handlers
- Remove the now unused components

## New Contributors
* @Oberacda made their first contribution
* @ made their first contribution

[8.0.1]: https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/compare/8.0.0..8.0.1
[8.0.0]: https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/compare/7.1.0..8.0.0
[7.1.0]: https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/compare/7.0.1..7.1.0
[7.0.1]: https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/compare/7.0.0..7.0.1
[7.0.0]: https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/compare/6.0.2..7.0.0
[6.0.2]: https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/compare/6.0.1..6.0.2
[6.0.1]: https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/compare/6.0.0..6.0.1
[6.0.0]: https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/compare/5.0.0..6.0.0
[5.0.0]: https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/compare/4.1.0..5.0.0
[4.1.0]: https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/compare/4.0.1..4.1.0
[4.0.1]: https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/compare/4.0.0..4.0.1
[4.0.0]: https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/compare/release/3.3.1..4.0.0
[release/3.3.1]: https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/compare/release/3.3.0..release/3.3.1
[release/3.3.0]: https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/compare/release/3.2.3..release/3.3.0
[release/3.2.3]: https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/compare/release/3.2.2..release/3.2.3
[release/3.2.2]: https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/compare/release/3.2.0..release/3.2.2
[release/3.2.0]: https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/compare/release/3.1.0..release/3.2.0
[release/3.1.0]: https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/compare/release/3.0.0..release/3.1.0
[release/3.0.0]: https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/compare/release/2.0.5..release/3.0.0

<!-- generated by git-cliff -->
