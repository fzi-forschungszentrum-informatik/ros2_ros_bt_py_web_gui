import type { TreeMsg } from '../types'

export type LoadTreeRequest = {
  tree: TreeMsg
  permissive: boolean
}

export type LoadTreeResponse = {
  success: boolean
  error_message: string
}
