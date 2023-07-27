export interface SetExecutionModeRequest {
  publish_subtrees: boolean;
  collect_performance_data: boolean;
  collect_node_diagnostics: boolean;
}

export type SetExecutionModeResponse = Record<string, never>;
