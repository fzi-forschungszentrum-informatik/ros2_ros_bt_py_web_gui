# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.0.1] - 2025-05-22

### Changed
- Fix build issue.

## [4.0.0] - 2025-05-22

### Added
- Add settings panel for configuration, allow toggle for data publishing
- Add basic output for tree data

### Changed
- Increase version to 4.0.0
- Make ros connections shallowRefs.
- Update editor store.
- Update messages fuese.
- Update nodes fuse.
- Update package fuse.
- Merge pull request #31 from Doomse/tree-message-rework
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
- Update d3 version
- Update vue version
- Major updates that don't cause breaking changes
- Minor updates, patches and removal of unused packages
- Merge pull request #30 from Doomse/main
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
- Update package versions.

## [release/3.3.1] - 2025-02-26

### Changed
- Fix missing icons.

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
- Merge pull request #29 from Doomse/editor-updates
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
- Merge pull request #28 from Doomse/tree-manip-updates
- Typing and linting changes
- Fix str type for node options
- Use tree manip helpers in node edit components
- Use replace service for center drop target
- Redo node drag handling, center target missing
- Move service calls to Promise based helper
- Merge pull request #27 from Doomse/enum-values
- Merge pull request #26 from Doomse/type-hints
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
- Merge pull request #22 from Doomse/editor-display
- Update colors
- Nodes have their min-height dynamically changed if their number in- or outputs changes
- Change initial node list loading to happen after namespace adjustment
- Update tree editor
- Merge pull request #24 from Doomse/main
- Fix path building for packages (use name instead of full path)

## [release/3.2.2] - 2025-01-14

### Added
- Add default values to Ros Message types

### Changed
- Merge pull request #21 from Doomse/main
- Change action default type.
- Do not consider current type value when filtering for Names

## [release/3.2.0] - 2025-01-13

### Added
- Add CI workflow.

### Changed
- Merge pull request #20 from Doomse/type_system
- Fix node versions in CI.
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
- Merge pull request #16 from Doomse/fix-operation-node
- Fix MathOperandType assigning to the wrong param
- Fix formatting issues.

### Removed
- Remove usage of deleted type
- Remove GetMessageFields usage

## [release/3.1.0] - 2024-12-16

### Added
- Add multi-delete option

### Changed
- Update pr script.
- Merge pull request #12 from Doomse/main
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
- Add PR creation script.
- Added save tree modal
- Add modal specific buttons, clean up type PackageStructure
- Add ui icons, notes on backend changes
- Add datadraw indicator and highlights, clean up comments
- Add listener names
- Add layer and tree display modes, pending icons
- Add tree msg subscriber, temporarily remove selected_subtree logic
- Add license headers for vue files.
- Add license headers
- Add license header.
- Add vitests.
- Add EditorSkinSelection and SelectSubtree components.
- Add NodeList and PackageManager components.
- Add vue modal to project.
- Add vue-notification library

### Changed
- Fix invalid store in BehaviorTreeEdge.vue
- Merge pull request #10 from Doomse/dev-vue
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
- Implement tree editor.
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
- Revert "Add license headers"
- Begin implementing the D3 editor
- Implement multiple selection
- Implement node editor selection and edge selection
- Implement node creation
- Implement NewNode and EditableNode components
- Rename spacer to RightAlignSpacer
- Finish load save control
- Change icon and update gitlab pipeline
- Fix style issues.
- Initial commit.

### Fixed
- Fix resolving optionref default values
- Fix basic paraminputs
- Fix fuse option config
- Fix node type-param dropdown

### Removed
- Remove svg-use elements as they break event handlers
- Remove the now unused components

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
