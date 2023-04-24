export interface ReplaceNodeRequest {
    old_node_name: string,
    new_node_name: string
}

export interface ReplaceNodeResponse {
    success: boolean,
    error_message: string
}