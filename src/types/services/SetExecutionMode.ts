export interface SetExecutionModeRequest {
  single_step: boolean;
  collect_performance_data: boolean;
  publish_subtrees: boolean;
  collect_node_diagnostics: boolean;
}

export type SetExecutionModeResponse = Record<string, never>;
