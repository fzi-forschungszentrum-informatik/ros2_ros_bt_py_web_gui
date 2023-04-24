import { NodeMsg } from "../types";

export interface AddNodeRequest {
    parent_name: string,
    node: NodeMsg,
    allow_rename: boolean
}

export interface AddNodeResponse {
    success: boolean,
    actual_node_name: string,
    error_message: string
}