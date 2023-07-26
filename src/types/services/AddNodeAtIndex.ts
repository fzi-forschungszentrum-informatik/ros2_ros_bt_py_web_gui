import { NodeMsg } from "../types";

export interface AddNodeAtIndexRequest {
  parent_name: string;
  node: NodeMsg;
  allow_rename: boolean;
  new_child_index: number;
}

export interface AddNodeAtIndexResponse {
  success: boolean;
  actual_node_name: string;
  error_message: string;
}
