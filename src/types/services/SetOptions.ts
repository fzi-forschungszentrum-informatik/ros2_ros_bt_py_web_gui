import type { NodeData } from '../types'

export type SetOptionsRequest = {
  node_name: string
  rename_node: boolean
  new_name: string
  options: NodeData[]
}

export type SetOptionsResponse = {
  success: boolean
  error_message: string
}
