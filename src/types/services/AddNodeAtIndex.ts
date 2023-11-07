import type { NodeMsg } from '../types'

export type AddNodeAtIndexRequest = {
  parent_name: string
  node: NodeMsg
  allow_rename: boolean
  new_child_index: number
}

export type AddNodeAtIndexResponse = {
  success: boolean
  actual_node_name: string
  error_message: string
}
