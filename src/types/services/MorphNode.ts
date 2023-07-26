import { NodeMsg } from "../types";

export interface MorphNodeRequest {
  node_name: string;
  new_node: NodeMsg;
}

export interface MorphNodeResponse {
  success: boolean;
  error_message: string;
}
