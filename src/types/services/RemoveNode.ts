export interface RemoveNodeRequest {
    node_name: string,
    remove_children: boolean
}

export interface RemoveNodeResponse {
    success: boolean,
    error_message: string
}