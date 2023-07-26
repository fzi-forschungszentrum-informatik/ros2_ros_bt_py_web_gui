import { TreeMsg } from "../types";

export interface GenerateSubtreeRequest {
  nodes: string[];
}

export interface GenerateSubtreeResponse {
  tree: TreeMsg;
  success: boolean;
  error_message: string;
}
