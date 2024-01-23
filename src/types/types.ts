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
  public_node_data: NodeDataLocation
}

export type DebugInfo = {
  current_recursion_depth: number
  max_recursion_depth: number
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
}

export type Messages = {
  messages: Message[]
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

export type PackageStructure = {
  name: string
  item_id: number
  parent: number
  type: string
  children?: PackageStructure[]
}

export type PyType = { 'py/type': string }
export type PyTuple = { 'py/tuple': never[][] }
export type PyLogger = {
  'py/object': string
  logger_level: string
}
export type PyOperator = {
  'py/object': string
  operator: string
}
export type PyOperand = {
  'py/object': string
  operand_type: string
}
export type PyEnum = {
  'py/object': string
  enum_value: string
  field_names: string[]
}

export type PyReduce = { 'py/reduce': (PyType | PyTuple | null)[] }

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
  | PyEnum

export type ParamType = {
  type: string
  value: ValueTypes
}

export interface ParamData {
  key: string
  value: ParamType
}

export type DataEdgePoint = {
  x: number
  y: number
}

export type DataEdgeTerminal = DataEdgePoint & {
  gripperSize: number
  nodeName: string
  key: string
  kind: string
  type: string
}

export type DataEdgePoints = (DataEdgeTerminal | DataEdgePoint)[]

export type DropTarget = {
  replace: boolean
  data: TrimmedNode | undefined
  position: number
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
}
