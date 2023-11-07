import type { TreeMsg } from "../types";

export type MigrateTreeRequest = {
  tree: TreeMsg;
}

export type MigrateTreeResponse = {
  tree: TreeMsg;
  migrated: boolean;
  success: boolean;
  error_message: string;
}
