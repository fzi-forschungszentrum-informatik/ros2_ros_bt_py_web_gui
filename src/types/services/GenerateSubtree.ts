import type { TreeMsg } from '../types'

export type GenerateSubtreeRequest = {
  nodes: string[]
}

export type GenerateSubtreeResponse = {
  tree: TreeMsg
  success: boolean
  error_message: string
}
