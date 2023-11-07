export type MoveNodeRequest = {
  node_name: string
  new_parent_name: string
  new_child_index: number
}

export type MoveNodeResponse = {
  success: boolean
  error_message: string
}
