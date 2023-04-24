import { TreeMsg } from "../types";

export interface MigrateTreeRequest {
    tree: TreeMsg
}

export interface MigrateTreeResponse {
    tree: TreeMsg,
    migrated: boolean,
    success: boolean,
    error_message: string
}