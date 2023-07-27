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
export interface NodeData {
  key: string;
  serialized_value: string;
  serialized_type: string;
}

export interface BoolMsg {
  data: boolean
}

export interface NodeMsg {
  module: string;
  node_class: string;
  version: string;
  max_children: number;
  name: string;
  state: string;
  child_names: string[];
  options: NodeData[];
  inputs: NodeData[];
  outputs: NodeData[];
  node_type?: string;
}

export interface NodeDataLocation {
  node_name: string;
  data_kind: string;
  data_key: string;
}

export interface NodeDataWiring {
  source: NodeDataLocation;
  target: NodeDataLocation;
}

export interface TreeMsg {
  name: string;
  path: string;
  root_name: string;
  nodes: NodeMsg[];
  data_wirings: NodeDataWiring[];
  trick_frequency_hz: number;
  state: string;
  public_node_data: NodeDataLocation;
}

export interface SubtreeStates {
  subtrees: TreeMsg[]
}

export interface Package {
  package: string;
  path: string;
}

export interface Packages {
  ros_root: string;
  packages: Package[];
}

export interface Message {
  msg: string;
  service: boolean;
  action: boolean;
}

export interface Messages {
  messages: Message[];
}

export interface DocumentedNode extends NodeMsg {
  doc: string;
  tags: string[];
}

export interface Error {
  id: number;
  time: number;
  text: string;
}

export interface PackageStructure {
  name: string;
  item_id: number;
  parent: number;
  type: string;
  children?: PackageStructure[];
}

export type PyType = { "py/type": string };
export type PyTuple = { "py/tuple": never[][] };
export type PyLogger = {
  "py/object": string;
  logger_level: number;
};
export type PyOperator = {
  "py/object": string;
  operator: string;
};
export type PyOperand = {
  "py/object": string;
  operand_type: string;
};
export type PyEnum = {
  "py/object": string;
  enum_value: string;
  field_names: string[];
};

export type PyReduce = { "py/reduce": (PyType | PyTuple | null)[] };

export type ValueTypes =
  | string
  | boolean
  | number
  | []
  | Record<string, never>
  | PyReduce
  | PyLogger
  | PyOperator
  | PyOperand
  | PyEnum;

export type ParamType = {
  type: string;
  value: ValueTypes;
};

export interface ParamData {
  key: string;
  value: ParamType;
}
