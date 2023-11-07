import type { NodeMsg } from '../types'

export type MorphNodeRequest = {
  node_name: string
  new_node: NodeMsg
}

export type MorphNodeResponse = {
  success: boolean
  error_message: string
}
