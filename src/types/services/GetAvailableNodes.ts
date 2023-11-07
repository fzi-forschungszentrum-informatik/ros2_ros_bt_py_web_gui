import type { DocumentedNode } from '../types'

export type GetAvailableNodesRequest = {
  node_modules: string[]
}

export type GetAvailableNodesResponse = {
  available_nodes: DocumentedNode[]
  success: boolean
  error_message: string
}
