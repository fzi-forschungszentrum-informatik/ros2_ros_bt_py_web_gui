export type ReplaceNodeRequest = {
  old_node_name: string
  new_node_name: string
}

export type ReplaceNodeResponse = {
  success: boolean
  error_message: string
}
