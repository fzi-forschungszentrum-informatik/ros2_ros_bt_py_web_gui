# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [7.0.1] - 2026-02-17

### Changed
- Bump version. by @Oberacda
- Use new tree_ref to associate nodes and subtrees by @Doomse in [#46](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/46)


## [7.0.0] - 2026-02-10

### Added
- Add EnumSwitchIcon by @nspielbau in [#43](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/43)

### Changed
- Bump verison to 7.0.0 by @Oberacda
- Logging display by @Doomse in [#45](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/45)

## New Contributors
* @nspielbau made their first contribution in [#43](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/43)

## [6.0.2] - 2026-01-27

### Added
- Adds support for the `bytes` type by @Doomse in [#42](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/42)
- Add skip rule for 'Update changelog' message by @Oberacda

### Changed
- Bump version. by @Oberacda
- Use node_id for wiring targets by @Doomse in [#44](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/44)
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
- Use UUIDs for BTNodes by @Doomse in [#38](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/38)
- Auto connect by @Doomse in [#40](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/40)
- Highlight nodes in broken state by @Doomse in [#41](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/41)
- Merge pull request #39 from Doomse/remove-shutdown-on-save by @Oberacda in [#39](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/39)

### Removed
- Remove shutdown call when saving tree by @Doomse


## [5.0.0] - 2025-09-08

### Changed
- Bump version. by @Oberacda
- Merge pull request #36 from Doomse/data-vert-update by @Oberacda in [#36](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/36)
- Correctly id and update data vertices by @Doomse
- Merge pull request #35 from Doomse/quick-save by @Oberacda in [#35](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/35)
- Update editor store for quickSave by @Doomse
- Quick save function and icon by @Doomse
- Initial Quick Save button by @Doomse
- Merge pull request #34 from Doomse/quick-select-icon-colors by @Oberacda in [#34](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/34)
- Update vite config to include new module by @Doomse
- Use updated svgs inline to allow css styling. by @Doomse
- Merge pull request #33 from Doomse/pure-svg-editor by @Oberacda in [#33](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/33)
- Properly redraw tree when display mode changes by @Doomse


## [4.1.0] - 2025-08-18

### Added
- Add changelog ci job. by @Oberacda
- Add changelog. by @Oberacda

### Changed
- Merge pull request #32 from Doomse/pure-svg-editor by @Oberacda in [#32](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/32)
- Align root drop target by @Doomse
- Fix lint issues by @Doomse
- Merge branch 'main' into pure-svg-editor by @Doomse

## New Contributors
* @github-actions[bot] made their first contribution

## [4.0.1] - 2025-05-22

### Changed
- Fix build issue. by @Oberacda


## [4.0.0] - 2025-05-22

### Added
- Add settings panel for configuration, allow toggle for data publishing by @Doomse
- Add basic output for tree data by @Doomse

### Changed
- Increase version to 4.0.0 by @Oberacda
- Make ros connections shallowRefs. by @Oberacda
- Update editor store. by @Oberacda
- Update messages fuese. by @Oberacda
- Update nodes fuse. by @Oberacda
- Update package fuse. by @Oberacda
- Merge pull request #31 from Doomse/tree-message-rework by @Oberacda in [#31](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/31)
- Reset persistent editor state on disconnect (assumes backend restart) by @Doomse
- Always display tree state of main tree by @Doomse
- Fix linting errors by @Doomse
- Persist publish settings by @Doomse
- Handle updated tree topics by @Doomse
- Tree data subscriber by @Doomse
- Fix data edge drawing indicator by @Doomse
- Update linking between selected nodes and edges by @Doomse
- Seperate IOData and OptionData by @Doomse
- Revert to explicitly specifying "serialized" on message fields by @Doomse
- Update message type definitions and basic tree drawing by @Doomse
- Merge pull request #30 from Doomse/main by @Oberacda in [#30](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/30)
- Color data-edge drawing indicator on valid target by @Doomse
- Simplify node text line breaks by @Doomse
- Disable text interactions by @Doomse
- Update resetview function by @Doomse
- Fix root drop target by @Doomse
- Line breaks and state icons by @Doomse
- Simple svg editor nodes by @Doomse
- Update d3 version by @Doomse
- Update vue version by @Doomse
- Major updates that don't cause breaking changes by @Doomse
- Minor updates, patches and removal of unused packages by @Doomse
- Specify file extensions in eslint config by @Doomse
- Update vite config (remove unused package) by @Doomse
- Fix sizing of editor canvas by @Doomse
- Second batch of (manual) eslint changes by @Doomse
- Change casing for fontawesome icon component by @Doomse
- Use default js extension for eslint by @Doomse
- First batch of eslint changes by @Doomse
- Properly specify the use of ESModule js in configs by @Doomse
- Update GitHub workflow and README by @Doomse
- Update project configs, mainly eslint by @Doomse
- Fix width of main column to avoid display issues by @Doomse
- Update package versions. by @Oberacda


## [release/3.3.1] - 2025-02-26

### Changed
- Fix missing icons. by @Oberacda


## [release/3.3.0] - 2025-02-26

### Added
- Add Icons for Quick Select by @Doomse
- Add Quick Select for Flow Control Nodes by @Doomse
- Add node list icons by @Doomse
- Add selection color for lightmode by @Doomse
- Add placeholder text to search bars by @Doomse
- Add text for node state by @Doomse
- Add searcher with partial messages by @Doomse

### Changed
- Merge pull request #29 from Doomse/editor-updates by @Oberacda in [#29](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/29)
- Update icons, add hover text by @Doomse
- Update Node with, collapse package loader by @Doomse
- Update node state icon display by @Doomse
- Switch to localStorage to persist data by @Doomse
- Change Decorator definition by @Doomse
- Fix lint errors by @Doomse
- Update data edge drawing by @Doomse
- Update node state display by @Doomse
- Update node list display and descriptions by @Doomse
- Update RosType Defaults by @Doomse
- Compact node list display by @Doomse
- Merge pull request #28 from Doomse/tree-manip-updates by @Oberacda in [#28](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/28)
- Typing and linting changes by @Doomse
- Fix str type for node options by @Doomse
- Use tree manip helpers in node edit components by @Doomse
- Use replace service for center drop target by @Doomse
- Redo node drag handling, center target missing by @Doomse
- Move service calls to Promise based helper by @Doomse
- Merge pull request #27 from Doomse/enum-values by @Oberacda in [#27](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/27)
- Merge pull request #26 from Doomse/type-hints by @Oberacda in [#26](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/26)
- Generic handling for TypeWrapper info by @Doomse
- Fix rebase issues by @Doomse
- Handle new type wrapper with support for builtin types and ros dicts by @Doomse
- Fetch message fields into json editor when appropriate by @Doomse
- Parse type hints and change search fuse by @Doomse
- Fully hide type hints in prettyprint by @Doomse
- Revert changes coming from a different branch/feature by @Doomse
- Allow node options to give type hints by @Doomse


## [release/3.2.3] - 2025-01-23

### Added
- Add tree undefined checks to editor by @Doomse
- Add state icons by @Doomse

### Changed
- Merge pull request #22 from Doomse/editor-display by @Oberacda in [#22](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/22)
- Update colors by @Doomse
- Nodes have their min-height dynamically changed if their number in- or outputs changes by @Doomse
- Change initial node list loading to happen after namespace adjustment by @Doomse
- Update tree editor by @Doomse
- Merge pull request #24 from Doomse/main by @Oberacda in [#24](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/24)
- Fix path building for packages (use name instead of full path) by @Doomse


## [release/3.2.2] - 2025-01-14

### Added
- Add default values to Ros Message types by @Doomse

### Changed
- Merge pull request #21 from Doomse/main by @Oberacda in [#21](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/21)
- Change action default type. by @Oberacda
- Do not consider current type value when filtering for Names by @Doomse


## [release/3.2.0] - 2025-01-13

### Added
- Add CI workflow. by @Oberacda

### Changed
- Merge pull request #20 from Doomse/type_system by @Oberacda in [#20](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/20)
- Fix node versions in CI. by @Oberacda
- Fix Math type imports by @Doomse
- Reduce some lint rules to warnings. by @Doomse
- Fix file type regex by @Doomse
- Reapply changes for handling math types by @Doomse
- Apply lint and format changes by @Doomse
- Fix setting node options for existing node by @Doomse
- Update search result display by @Doomse
- Redo default value registration for python types by @Doomse
- Update node option handling by @Doomse
- Unify handling of NodeMsg and builtin types by @Doomse
- Restructure Message Type publishing by @Doomse
- Reset names for math types by @Doomse
- Clone default values when using them by @Doomse
- Handle Ros Topic types by @Doomse
- Handle Ros Action types by @Doomse
- Handle Ros Channel Names by @Doomse
- Handle Ros Types by @Doomse
- Apply formatter changes by @Doomse
- Apply linting changes by @Doomse
- Move python type information into separate file by @Doomse
- Use new module for math types by @Doomse
- Implement FilePath param by @Doomse
- Merge pull request #16 from Doomse/fix-operation-node by @Oberacda in [#16](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/16)
- Fix MathOperandType assigning to the wrong param by @Doomse
- Fix formatting issues. by @Oberacda

### Removed
- Remove usage of deleted type by @Doomse
- Remove GetMessageFields usage by @Doomse


## [release/3.1.0] - 2024-12-16

### Added
- Add multi-delete option by @Doomse

### Changed
- Update pr script. by @Oberacda
- Merge pull request #12 from Doomse/main by @Oberacda in [#12](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/12)
- Fixed handling of zoom when drawing tree by @Doomse
- Fix node morphing by @Doomse
- Multi-delete confirmation by @Doomse
- Disable loadsave when viewing subtrees by @Doomse
- Filter package folders by @Doomse
- Minor todos by @Doomse
- Cleanup editor css by @Doomse
- Update Edit Node Display by @Doomse
- Unify Math Node Params by @Doomse
- Revert "remove unused components" by @Doomse
- Use scoped styles to avoid interference between components by @Doomse
- Clean up minor editor todos by @Doomse
- Delay node dragging start by @Doomse
- Clean up minor todos by @Doomse
- Update layout of namespace component by @Doomse
- Update nodelist layout by @Doomse
- Update editor color scheme by @Doomse
- Update editor coloring by @Doomse
- Tree name and state display consideres selected subtree by @Doomse
- Update multi-selection by @Doomse
- Generate and Save Subtrees by @Doomse
- Update scrollable components by @Doomse
- Edge select component and highlighting update by @Doomse

### Fixed
- Fix top-bar height by @Doomse

### Removed
- Remove unused component by @Doomse
- Remove unused components by @Doomse


## [release/3.0.0] - 2024-11-04

### Added
- Add PR creation script. by @Oberacda
- Added save tree modal by @Doomse
- Add modal specific buttons, clean up type PackageStructure by @Doomse
- Add ui icons, notes on backend changes by @Doomse
- Add datadraw indicator and highlights, clean up comments by @Doomse
- Add listener names by @Doomse
- Add layer and tree display modes, pending icons by @Doomse
- Add tree msg subscriber, temporarily remove selected_subtree logic by @Doomse
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
- Clean up minor todos by @Doomse
- Enable multi-selecting nodes iteratively by @Doomse
- Update LoadSave modals by @Doomse
- Consistent spacing in node list by @Doomse
- Move scroll component to node list by @Doomse
- Redo button spacing css by @Doomse
- Minor styling fix by @Doomse
- Layout and styling updates, dark mode toggle for window by @Doomse
- Allow manual changes for tree name, disable auto rename on save by @Doomse
- Visual update for control bars by @Doomse
- Update data graph hover highlighting by @Doomse
- Update fuzzy search functions by @Doomse
- Reenable svg-use elements, they ignore pointer-events by @Doomse
- Change data graph display by @Doomse
- Update JSONInput and ROS Messages by @Doomse
- Rename tree after saving it by @Doomse
- Use the new edit_node store in favor over passing props. by @Doomse
- Move data about selecting and editing nodes into new store by @Doomse
- Allow to search messages based on ros type (msg/srv/action) by @Doomse
- Move filtered_nodes logic to nodes_store as it seems more appropriate by @Doomse
- Update message_type handling by @Doomse
- The JSONinput is WIP, message fields service is working but results look weird by @Doomse
- Update load-save modal visuals by @Doomse
- Reposition notifications, hold them active on hover by @Doomse
- Load tree modal function by @Doomse
- Various minor cleanups by @Doomse
- Normalize logic to always use the Package type by @Doomse
- Merge branch 'fzi-forschungszentrum-informatik:dev-vue' into dev-vue by @Doomse
- Implement tree editor. by @Oberacda in [#9](https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/pull/9)
- Remote file browser part2 by @Doomse
- Remote file browser part1 by @Doomse
- Layout remote file browser by @Doomse
- Update selected node display by @Doomse
- Implement OptionRef handling by @Doomse
- Revert node id change, backend takes care of this by @Doomse
- Node update component is populated but disabled on subtrees by @Doomse
- Receive and display subtrees by @Doomse
- Collect subtree info, enable subtree selection by @Doomse
- Move d3 relevant css classes to constants by @Doomse
- Adjust data edge drawing by @Doomse
- Data edge creation, move hightlighted edge to foreground by @Doomse
- Set up data for edge drawing, also fix node dropping for siblings by @Doomse
- Adjust namespace selection to work on init by @Doomse
- Edit appearence control buttons by @Doomse
- Adapt curve type by @Doomse
- Draw data edges, includes mouse events by @Doomse
- Fix data edge collection by @Doomse
- Finish data vertex drawing, start data edge collection by @Doomse
- Draw data graph vertices by @Doomse
- Allow to move existing nodes by @Doomse
- Allow click and drag of canvas nodes by @Doomse
- Fix Editor sizing by @Doomse
- Drop new nodes into the tree by @Doomse
- Implement drag&drop for new nodes by @Doomse
- Auto-draw tree by @Doomse
- Fix dragging mouseup by @Doomse
- Draw drop targets by @Doomse
- Draw tree layout by @Doomse
- Move more editor styling by @Doomse
- Shuffle some scss to more fitting places by @Doomse
- Draw node boxes and names by @Doomse
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
- Fix resolving optionref default values by @Doomse
- Fix basic paraminputs by @Doomse
- Fix fuse option config by @Doomse
- Fix node type-param dropdown by @Doomse

### Removed
- Remove svg-use elements as they break event handlers by @Doomse
- Remove the now unused components by @Doomse

## New Contributors
* @Oberacda made their first contribution
* @Doomse made their first contribution

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
