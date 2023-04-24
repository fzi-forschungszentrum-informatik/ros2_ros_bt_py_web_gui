import { TreeMsg } from "../types";

export interface LoadTreeRequest {
    tree: TreeMsg,
    permissive: boolean
}

export interface LoadTreeResponse {
    success: boolean,
    error_message: string
}