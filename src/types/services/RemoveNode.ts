export type RemoveNodeRequest = {
  node_name: string
  remove_children: boolean
}

export type RemoveNodeResponse = {
  success: boolean
  error_message: string
}
