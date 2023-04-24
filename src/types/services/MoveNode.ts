export interface MoveNodeRequest {
    node_name: string,
    new_parent_name: string,
    new_child_index: number
}

export interface MoveNodeResponse {
    success: boolean,
    error_message: string
}