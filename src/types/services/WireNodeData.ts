import type { NodeDataWiring } from '../types'

export type WireNodeDataRequest = {
  wirings: NodeDataWiring[]
  ignore_failure: boolean
}

export type WireNodeDataResponse = {
  success: boolean
  error_message: string
}
