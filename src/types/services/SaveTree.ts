import type { TreeMsg } from '../types'

export type SaveTreeRequest = {
  filename: string
  package: string
  tree: TreeMsg
  allow_overwrite: boolean
  allow_rename: boolean
}

export type SaveTreeResponse = {
  success: boolean
  error_message: string
  file_path: string
}
