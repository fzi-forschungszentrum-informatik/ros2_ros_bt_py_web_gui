export interface NodeData {
    key: string,
    serialized_value: string,
    serialized_type: string
}

export interface NodeMsg {
    module: string,
    node_class: string,
    version: string,
    max_children: number,
    name: string,
    state: string,
    child_names: string[],
    options: NodeData[],
    inputs: NodeData[],
    outputs: NodeData[],
    node_type?: string
}

export interface NodeDataLocation {
    node_name: string,
    data_kind: string
    data_key: string
}

export interface NodeDataWiring {
    source: NodeDataLocation,
    target: NodeDataLocation
}

export interface TreeMsg {
    name: string,
    path: string,
    root_name: string,
    nodes: NodeMsg[],
    data_wirings: NodeDataWiring[],
    trick_frequency_hz: number,
    state: string,
    public_node_data: NodeDataLocation
}

export interface DebugInfo {
    current_recursion_depth: number,
    max_recursion_depth: number,
    subtree_states: TreeMsg[]
}

export interface Package {
    package: string,
    path: string
}

export interface Packages {
    ros_root: string,
    packages: Package[]
}

export interface Message {
    msg: string,
    service: boolean
}

export interface Messages {
    messages: Message[],
}

export interface DocumentedNode extends NodeMsg {
    doc: string,
    tags: string[],
}

export interface Error {
    id: number,
    time: number,
    text: string
}

export interface DebugSettings {
    single_step: boolean,
    collect_performance_data: boolean,
    publish_subtrees: boolean,
    collect_node_diagnostics: boolean,
    breakpoint_names: string[]
}

export interface PackageStructure {
    name: string,
    item_id: number,
    parent: number,
    type: string,
    children?: PackageStructure[]
}
