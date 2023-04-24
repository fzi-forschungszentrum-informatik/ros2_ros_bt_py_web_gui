import { NodeData } from "../types";

export interface SetOptionsRequest {
  node_name: string;
  rename_node: boolean;
  new_name: string;
  options: NodeData[];
}

export interface SetOptionsResponse {
  success: boolean;
  error_message: string;
}
