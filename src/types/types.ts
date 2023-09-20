export interface NodeData {
  key: string;
  serialized_value: string;
  serialized_type: string;
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

export interface DebugInfo {
  current_recursion_depth: number;
  max_recursion_depth: number;
  subtree_states: TreeMsg[];
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

export interface DebugSettings {
  single_step: boolean;
  collect_performance_data: boolean;
  publish_subtrees: boolean;
  collect_node_diagnostics: boolean;
  breakpoint_names: string[];
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
