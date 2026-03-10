/*
 * Copyright 2025-2026 FZI Forschungszentrum Informatik
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *    * Redistributions of source code must retain the above copyright
 *      notice, this list of conditions and the following disclaimer.
 *
 *    * Redistributions in binary form must reproduce the above copyright
 *      notice, this list of conditions and the following disclaimer in the
 *      documentation and/or other materials provided with the distribution.
 *
 *    * Neither the name of the {copyright_holder} nor the names of its
 *      contributors may be used to endorse or promote products derived from
 *      this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */
import * as uuid from 'uuid'
import { useROSStore } from './stores/ros'
import type { AddNodeAtIndexRequest, AddNodeAtIndexResponse } from './types/services/AddNodeAtIndex'
import type { MoveNodeRequest, MoveNodeResponse } from './types/services/MoveNode'
import type { RemoveNodeRequest, RemoveNodeResponse } from './types/services/RemoveNode'
import type { ReplaceNodeRequest, ReplaceNodeResponse } from './types/services/ReplaceNode'
import type { WireNodeDataRequest, WireNodeDataResponse } from './types/services/WireNodeData'
import type {
  UUIDString,
  NodeStructure,
  DataEdgeTerminal,
  Wiring,
  DocumentedNode,
  NodeOption,
  OptionData
} from './types/types'
import {
  getDefaultValue,
  prettyprint_type,
  rosToUuid,
  serializeNodeOptions,
  uuidToRos
} from './utils'
import { notify } from '@kyvg/vue3-notification'

export function buildDefaultNodeMessage(node: DocumentedNode): NodeStructure {
  const options = node.options.map((opt: NodeOption) => {
    return {
      key: opt.key,
      value: getDefaultValue(prettyprint_type(opt.serialized_type), node.options)
    } as OptionData
  })

  return {
    node_id: uuidToRos(uuid.v4()),
    name: node.node_class,
    module: node.module,
    node_class: node.node_class,
    version: '',
    max_children: 0,
    child_ids: [],
    options: serializeNodeOptions(options),
    inputs: [],
    outputs: [],
    tree_ref: ''
  }
}

export function addNode(
  msg: NodeStructure,
  parent_node_id: UUIDString,
  index: number,
  send_notify: boolean = true
): Promise<UUIDString> {
  const ros_store = useROSStore()

  // Supress notifications for all callbacks
  let local_notify: (args: object) => void
  if (send_notify) {
    local_notify = notify
  } else {
    local_notify = (args: object) => console.log(args)
  }

  return new Promise<string>((resolve, reject) => {
    ros_store.add_node_at_index_service.callService(
      {
        parent_node_id: uuidToRos(parent_node_id),
        node: msg,
        new_child_index: index
      } as AddNodeAtIndexRequest,
      (response: AddNodeAtIndexResponse) => {
        if (response.success) {
          local_notify({
            title: 'Added node ' + msg.name,
            type: 'success'
          })
          resolve(rosToUuid(response.node_id))
        } else {
          local_notify({
            title: 'Failed to add node ' + msg.name,
            text: response.error_message,
            type: 'warn'
          })
          reject(response.error_message)
        }
      },
      (error: string) => {
        local_notify({
          title: 'Failed to call addNodeAtIndex service',
          text: error,
          type: 'error'
        })
        reject(error)
      }
    )
  })
}

export function moveNode(
  node_id: UUIDString,
  node_name: string,
  parent_node_id: UUIDString,
  index: number,
  send_notify: boolean = true
): Promise<void> {
  const ros_store = useROSStore()

  // Supress notifications for all callbacks
  let local_notify: (args: object) => void
  if (send_notify) {
    local_notify = notify
  } else {
    local_notify = (args: object) => console.log(args)
  }

  return new Promise<void>((resolve, reject) => {
    ros_store.move_node_service.callService(
      {
        node_id: uuidToRos(node_id),
        parent_node_id: uuidToRos(parent_node_id),
        new_child_index: index
      } as MoveNodeRequest,
      (response: MoveNodeResponse) => {
        if (response.success) {
          local_notify({
            title: 'Moved node ' + node_name,
            type: 'success'
          })
          resolve()
        } else {
          local_notify({
            title: 'Failed to move node ' + node_name,
            text: response.error_message,
            type: 'warn'
          })
          reject(response.error_message)
        }
      },
      (error: string) => {
        local_notify({
          title: 'Failed to call moveNode service',
          text: error,
          type: 'error'
        })
        reject(error)
      }
    )
  })
}

export function removeNode(
  node_id: UUIDString,
  node_name: string,
  remove_children: boolean,
  send_notify: boolean = true
): Promise<void> {
  const ros_store = useROSStore()

  // Supress notifications for all callbacks
  let local_notify: (args: object) => void
  if (send_notify) {
    local_notify = notify
  } else {
    local_notify = (args: object) => console.log(args)
  }

  return new Promise<void>((resolve, reject) => {
    ros_store.remove_node_service.callService(
      {
        node_id: uuidToRos(node_id),
        remove_children: remove_children
      } as RemoveNodeRequest,
      (response: RemoveNodeResponse) => {
        if (response.success) {
          local_notify({
            title: 'Removed node ' + node_name,
            type: 'success'
          })
          resolve()
        } else {
          local_notify({
            title: 'Failed to remove node ' + node_name,
            text: response.error_message,
            type: 'warn'
          })
          reject(response.error_message)
        }
      },
      (error: string) => {
        local_notify({
          title: 'Failed to call removeNode service',
          text: error,
          type: 'error'
        })
        reject(error)
      }
    )
  })
}

export function replaceNode(
  old_node_id: UUIDString,
  old_node_name: string,
  new_node_id: UUIDString,
  new_node_name: string,
  send_notify: boolean = true
): Promise<void> {
  const ros_store = useROSStore()

  // Supress notifications for all callbacks
  let local_notify: (args: object) => void
  if (send_notify) {
    local_notify = notify
  } else {
    local_notify = (args: object) => console.log(args)
  }

  return new Promise<void>((resolve, reject) => {
    ros_store.replace_node_service.callService(
      {
        old_node_id: uuidToRos(old_node_id),
        new_node_id: uuidToRos(new_node_id)
      } as ReplaceNodeRequest,
      (response: ReplaceNodeResponse) => {
        if (response.success) {
          local_notify({
            title: 'Replaced node ' + old_node_name,
            text: 'with node ' + new_node_name,
            type: 'success'
          })
          resolve()
        } else {
          local_notify({
            title: 'Failed to replace node',
            text: response.error_message,
            type: 'warn'
          })
          reject(response.error_message)
        }
      },
      (error: string) => {
        local_notify({
          title: 'Failed to call ReplaceNode service',
          text: error,
          type: 'error'
        })
        reject(error)
      }
    )
  })
}

// Caller needs to ensure to pass the input as source
export function addDataEdge(
  source: DataEdgeTerminal,
  target: DataEdgeTerminal,
  send_notify: boolean = true
): Promise<void> {
  const ros_store = useROSStore()

  // Supress notifications for all callbacks
  let local_notify: (args: object) => void
  if (send_notify) {
    local_notify = notify
  } else {
    local_notify = (args: object) => console.log(args)
  }

  return new Promise<void>((resolve, reject) => {
    ros_store.wire_data_service.callService(
      {
        wirings: [
          {
            source: {
              node_id: uuidToRos(source.node.data.node_id),
              data_kind: source.kind,
              data_key: source.key
            },
            target: {
              node_id: uuidToRos(target.node.data.node_id),
              data_kind: target.kind,
              data_key: target.key
            }
          } as Wiring
        ],
        ignore_failure: false //TODO what does this do?
      } as WireNodeDataRequest,
      (response: WireNodeDataResponse) => {
        const source_name = source.node.data.name
        const target_name = target.node.data.name
        if (response.success) {
          local_notify({
            title: 'Added data edge: ' + source_name + ' -> ' + target_name + '!',
            type: 'success'
          })
          resolve()
        } else {
          local_notify({
            title: 'Failed to add data edge: ' + source_name + ' -> ' + target_name + '!',
            text: response.error_message,
            type: 'warn'
          })
          reject(response.error_message)
        }
      },
      (error: string) => {
        local_notify({
          title: 'Failed to call dataWiring service',
          text: error,
          type: 'error'
        })
        reject(error)
      }
    )
  })
}
