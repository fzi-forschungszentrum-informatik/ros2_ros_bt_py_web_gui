import type { NodeMsg } from '../types'

export type AddNodeRequest = {
  parent_name: string
  node: NodeMsg
  allow_rename: boolean
}

export type AddNodeResponse = {
  success: boolean
  actual_node_name: string
  error_message: string
}
