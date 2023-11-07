import { TreeMsg } from "../types";

export interface SaveTreeRequest {
  filename: string;
  filepath: string;
  storage_path: string;
  tree: TreeMsg;
  allow_overwrite: boolean;
  allow_rename: boolean;
}

export interface SaveTreeResponse {
  success: boolean;
  error_message: string;
  file_path: string;
}
