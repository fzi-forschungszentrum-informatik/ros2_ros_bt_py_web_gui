import { DocumentedNode } from "../types";

export class GetAvailableNodesRequest {
  node_modules: string[] = [];

  constructor(node_modules: string[]) {
    this.node_modules = node_modules;
  }
}

export interface GetAvailableNodesResponse {
  available_nodes: DocumentedNode[];
  success: boolean;
  error_message: string;
}
