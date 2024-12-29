/*
 * Copyright 2024 FZI Forschungszentrum Informatik
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

export type NodeData = {
  key: string
  serialized_value: string
  serialized_type: string
}

export type NodeMsg = {
  module: string
  node_class: string
  version: string
  max_children: number
  name: string
  state: string
  child_names: string[]
  options: NodeData[]
  inputs: NodeData[]
  outputs: NodeData[]
  node_type?: string
}

export type NodeDataLocation = {
  node_name: string
  data_kind: string
  data_key: string
}

export type NodeDataWiring = {
  source: NodeDataLocation
  target: NodeDataLocation
}

export type TreeMsg = {
  name: string
  path: string
  root_name: string
  nodes: NodeMsg[]
  data_wirings: NodeDataWiring[]
  trick_frequency_hz: number
  state: string
  public_node_data: NodeDataLocation[]
}

export type SubtreeInfo = {
  subtree_states: TreeMsg[]
}

export type Package = {
  package: string
  path: string
}

export type Packages = {
  ros_root: string
  packages: Package[]
}

export type Message = {
  msg: string
  service: boolean
  action: boolean
  type: MessageType
}

export const enum MessageType {
  MESSAGE = 0,
  REQUEST = 1,
  RESPONSE = 2,
  GOAL = 3,
  FEEDBACK = 4,
  RESULT = 5
}

export type Messages = {
  messages: Message[]
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

export type DocumentedNode = NodeMsg & {
  doc: string
  tags: string[]
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
  | PyReduce
  | PyObject

export type ParamType = {
  type: string
  value: ValueTypes
}

export type ParamData = {
  key: string
  value: ParamType
}

export type DataEdgePoint = {
  x: number
  y: number
}

export type DataEdgeTerminal = DataEdgePoint & {
  node: FlextreeNode<TrimmedNode>
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

export type DataEdge = {
  source: DataEdgeTerminal
  target: DataEdgeTerminal
  wiring: NodeDataWiring
}

export type DropTarget = {
  node: FlextreeNode<TrimmedNode>
  position: Position
}

export const enum Position {
  TOP = 'top',
  BOTTOM = 'bottom',
  LEFT = 'left',
  RIGHT = 'right',
  CENTER = 'center'
}

export type TrimmedNodeData = {
  key: string
  serialized_type: string
}

export type TrimmedNode = {
  node_class: string
  module: string
  state: string
  max_children: number
  name: string
  child_names: string[]
  inputs: TrimmedNodeData[]
  outputs: TrimmedNodeData[]
  options: TrimmedNodeData[]
  size: { width: number; height: number }
}
