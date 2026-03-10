/*
 * Copyright 2024-2026 FZI Forschungszentrum Informatik
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *    * Redistributions of source code must retain the above copyright
 *      notice, this list of conditions and the following disclaimer.
 *
 *    * Redistributions in binary form must reproduce the above copyright
 *      notice, this list of conditions and the following disclaimer in the
 *      documentation and/or other materials provided with the distribution.
 *
 *    * Neither the name of the {copyright_holder} nor the names of its
 *      contributors may be used to endorse or promote products derived from
 *      this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

import type { FlextreeNode } from 'd3-flextree'

export type UUIDMsg = string
export type UUIDString = string

export type RosTime = {
  sec: number
  nanosec: number
}

export type NodeIO = {
  key: string
  serialized_type: string
}

export type NodeOption = NodeIO & {
  serialized_value: string
}

export type NodeStructure = {
  node_id: UUIDMsg
  name: string

  module: string
  node_class: string
  version: string

  max_children: number
  child_ids: UUIDMsg[]

  options: NodeOption[]
  inputs: NodeIO[]
  outputs: NodeIO[]

  tree_ref: UUIDMsg | ''
}

export type DocumentedNode = {
  module: string
  node_class: string
  version: string

  max_children: number

  options: NodeOption[]
  inputs: NodeIO[]
  outputs: NodeIO[]

  doc: string
  tags: string[]
  node_type?: string
}

export type NodeDataLocation = {
  node_id: UUIDMsg
  data_kind: string
  data_key: string
}

export type Wiring = {
  source: NodeDataLocation
  target: NodeDataLocation
}

export type TreeStructure = {
  tree_id: UUIDMsg
  name: string
  path: string
  root_id: UUIDMsg
  nodes: NodeStructure[]
  data_wirings: Wiring[]
  trick_frequency_hz: number
  public_node_data: NodeDataLocation[]
}

export type TreeStructureList = {
  tree_structures: TreeStructure[]
}

export const enum NodeStateValues {
  RUNNING = 'RUNNING',
  IDLE = 'IDLE',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  SHUTDOWN = 'SHUTDOWN',
  UNINITIALIZED = 'UNINITIALIZED',

  UNASSIGNED = 'UNASSIGNED',
  ASSIGNED = 'ASSIGNED',
  BROKEN = 'BROKEN',
  PAUSED = 'PAUSED'
}

export type NodeState = {
  node_id: UUIDMsg
  state: NodeStateValues
}

export const enum TreeStateValues {
  IDLE = 'IDLE',
  EDITABLE = 'EDITABLE',
  TICKING = 'TICKING',
  WAITING_FOR_TICK = 'WAITING_FOR_TICK',
  STOP_REQUESTED = 'STOP_REQUESTED',
  ERROR = 'ERROR'
}

export type TreeState = {
  tree_id: UUIDMsg
  state: TreeStateValues
  node_states: NodeState[]
}

export type TreeStateList = {
  tree_states: TreeState[]
}

export type WiringData = {
  wiring: Wiring
  serialized_data: string
  serialized_type: string
  serialized_expected_type: string
}

export type TreeData = {
  tree_id: UUIDMsg
  wiring_data: WiringData[]
}

export type TreeDataList = {
  tree_data: TreeData[]
}

export type DataEdgePoint = {
  x: number
  y: number
}

export type IdentifiedDataEdgePoint = DataEdgePoint & {
  tree_id: UUIDString
  node_id: UUIDString
  kind: IOKind
  key: string
}

export type DataEdgeTerminal = DataEdgePoint & {
  node: FlextreeNode<BTEditorNode>
  index: number
  kind: IOKind
  key: string
  type: string
}

export const enum IOKind {
  INPUT = 'inputs',
  OUTPUT = 'outputs',
  OTHER = 'other'
}

export type IdentifiedDataEdge = {
  p1: IdentifiedDataEdgePoint
  p2: IdentifiedDataEdgePoint
  key: string
}

export type DataEdge = {
  source: DataEdgeTerminal
  target: DataEdgeTerminal
  wiring: Wiring
}

export type DropTarget = {
  node: FlextreeNode<BTEditorNode>
  position: Position
}

export const enum Position {
  TOP = 'top',
  BOTTOM = 'bottom',
  LEFT = 'left',
  RIGHT = 'right',
  CENTER = 'center',
  ROOT = 'root'
}

export type TrimmedNodeData = {
  key: string
  serialized_type: string
}

export type BTEditorNode = {
  node_id: UUIDString
  name: string

  node_class: string
  module: string

  max_children: number
  child_ids: UUIDString[]

  inputs: TrimmedNodeData[]
  outputs: TrimmedNodeData[]
  options: TrimmedNodeData[]

  // Reference to contained tree, if at all
  tree_ref: UUIDString | ''

  // Reference to own tree for global identification
  tree_id: UUIDString

  size: { width: number; height: number }
  offset: { x: number; y: number }

  state?: NodeStateValues
}

export type Package = {
  package: string
  path: string
}

export type Packages = {
  ros_root: string
  packages: Package[]
}

export type MessageTypes = {
  topics: string[]
  services: string[]
  actions: string[]
}

export type Channel = {
  name: string
  type: string
}

export type Channels = {
  topics: Channel[]
  services: Channel[]
  actions: Channel[]
}

export type Error = {
  id: number
  time: number
  text: string
}

export type DebugSettings = {
  single_step: boolean
  collect_performance_data: boolean
  publish_subtrees: boolean
  collect_node_diagnostics: boolean
  breakpoint_names: string[]
}

export const enum FileType {
  FILE = 'file',
  DIR = 'directory'
}

export type PackageStructure = {
  name: string
  item_id: number
  type: FileType
}

export type PyB64 = { 'py/b64': string }

export type PyObject = { 'py/object': string }

export type PyType = { 'py/type': string }
export type PyTuple = { 'py/tuple': never[][] }

export type PyReduce = { 'py/reduce': (PyType | PyTuple | null)[] }

export type ValueTypes =
  | string
  | boolean
  | number
  | []
  | Record<string, never>
  | PyB64
  | PyReduce
  | PyObject

export type ParamType = {
  type: string
  value: ValueTypes
}

export type OptionData = {
  key: string
  value: ParamType
}

export type IOData = {
  key: string
  type: string
}

export enum LogLevel {
  DEBUG = 10,
  INFO = 20,
  WARN = 30,
  ERROR = 40,
  FATAL = 50
}

export type RosLogMsg = {
  stamp: RosTime
  level: LogLevel
  msg: string
  tree_id: UUIDMsg | ''
  tree_name: string
  node_id: UUIDMsg | ''
  node_name: string
  file: string
  function: string
  line: number
}

export type LogMessage = {
  stamp: Date
  level: LogLevel
  tree:
    | {
        id: UUIDString
        name: string
      }
    | undefined
  node:
    | {
        id: UUIDString
        name: string
      }
    | undefined
  msg: string
  file: string
  function: string
  line: number
}
