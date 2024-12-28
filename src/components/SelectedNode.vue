<!--
 *  Copyright 2024 FZI Forschungszentrum Informatik
 *
 *  Redistribution and use in source and binary forms, with or without
 *  modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *
 *     * Neither the name of the {copyright_holder} nor the names of its
 *       contributors may be used to endorse or promote products derived from
 *       this software without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 *  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 *  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 *  ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 *  LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 *  CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 *  SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 *  INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 *  CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 -->
<script setup lang="ts">
import { python_builtin_types } from '@/utils'
import { notify } from '@kyvg/vue3-notification'
import EditableNode from './EditableNode.vue'
import type { NodeData, NodeMsg } from '@/types/types'
import type { MorphNodeRequest, MorphNodeResponse } from '@/types/services/MorphNode'
import type { RemoveNodeRequest, RemoveNodeResponse } from '@/types/services/RemoveNode'
import type { SetOptionsRequest, SetOptionsResponse } from '@/types/services/SetOptions'

import { useEditorStore } from '@/stores/editor'
import { useROSStore } from '@/stores/ros'
import { useEditNodeStore } from '@/stores/edit_node'
import type { PyEnum, PyLogger, PyOperand, PyOperator } from '@/types/python_types'

const ros_store = useROSStore()
const editor_store = useEditorStore()
const edit_node_store = useEditNodeStore()

function buildNodeMsg(): NodeMsg {
  return {
    module: edit_node_store.new_node_module,
    node_class: edit_node_store.new_node_class,
    name: edit_node_store.new_node_name,
    //TODO Handle new python_types
    options: edit_node_store.new_node_options.map((x) => {
      const option: NodeData = {
        key: x.key,
        serialized_value: '',
        serialized_type: ''
      }
      if (x.value.type === 'type') {
        if (python_builtin_types.indexOf(x.value.value as string) >= 0) {
          x.value.value = '__builtin__.' + x.value.value
          //x.value.value = 'builtins.' + x.value.value;
        }
        option.serialized_value = JSON.stringify({
          'py/type': x.value.value
        })
      } else if (x.value.type.startsWith('__')) {
        const val = x.value.value as PyLogger | PyOperator | PyOperand | PyEnum
        val['py/object'] = x.value.type.substring('__'.length)
        option.serialized_value = JSON.stringify(x.value.value)
      } else {
        option.serialized_value = JSON.stringify(x.value.value)
      }
      return option
    }),
    inputs: [],
    outputs: [],
    max_children: 0,
    child_names: [],
    version: '',
    state: ''
  } as NodeMsg
}

function onClickDelete() {
  if (edit_node_store.selected_node === undefined) {
    console.error("Can't delete a node that doesn't exist")
    return
  }

  if (!window.confirm('Really delete node ' + edit_node_store.selected_node.name + '?')) {
    // Do nothing if user doesn't confirm
    return
  }

  ros_store.remove_node_service.callService(
    {
      node_name: edit_node_store.selected_node.name,
      remove_children: false
    } as RemoveNodeRequest,
    (response: RemoveNodeResponse) => {
      if (response.success) {
        notify({
          title: 'Removed ' + edit_node_store.selected_node!.name + ' successfully!',
          type: 'success'
        })
        edit_node_store.clearSelection()
      } else {
        notify({
          title: 'Failed to remove node ' + edit_node_store.selected_node!.name + '!',
          text: response.error_message,
          type: 'error'
        })
      }
    }
  )
}

function onClickDeleteWithChildren() {
  if (edit_node_store.selected_node === undefined) {
    console.error("Can't delete a node that doesn't exist")
    return
  }

  if (
    !window.confirm(
      'Really delete node ' + edit_node_store.selected_node.name + ' and all of its children?'
    )
  ) {
    // Do nothing if user doesn't confirm
    return
  }

  ros_store.remove_node_service.callService(
    {
      node_name: edit_node_store.selected_node.name,
      remove_children: true
    } as RemoveNodeRequest,
    (response: RemoveNodeResponse) => {
      if (response.success) {
        notify({
          title:
            'Removed ' + edit_node_store.selected_node!.name + ' and its children successfully!',
          type: 'success'
        })
        edit_node_store.clearSelection()
      } else {
        notify({
          title: 'Failed to remove node ' + edit_node_store.selected_node!.name + '!',
          text: response.error_message,
          type: 'error'
        })
      }
    }
  )
}

function updateNode() {
  if (edit_node_store.selected_node === undefined) {
    console.error("Can't update a node that doesn't exist")
    return
  }
  ros_store.set_options_service.callService(
    {
      node_name: edit_node_store.selected_node.name,
      rename_node: true,
      new_name: edit_node_store.new_node_name,
      options: edit_node_store.new_node_options.map((x) => {
        const option = {
          key: x.key,
          serialized_value: ''
        }
        if (x.value.type === 'type') {
          if (python_builtin_types.indexOf(x.value.value as string) >= 0) {
            x.value.value = ('__builtin__.' + x.value.value) as string
          }
          option.serialized_value = JSON.stringify({
            'py/type': x.value.value
          })
        } else if (x.value.type.startsWith('__')) {
          const val = x.value.value as PyOperand | PyLogger | PyOperator | PyOperand | PyEnum
          val['py/object'] = x.value.type.substring('__'.length)
          option.serialized_value = JSON.stringify(val)
        } else {
          option.serialized_value = JSON.stringify(x.value.value)
        }
        return option
      })
    } as SetOptionsRequest,
    (response: SetOptionsResponse) => {
      if (response.success) {
        notify({
          title: 'Updated node ' + edit_node_store.new_node_name + ' successfully!',
          type: 'success'
        })
        edit_node_store.clearNodeHasChanged()
        edit_node_store.editorSelectionChange(edit_node_store.new_node_name)
      } else {
        notify({
          title: 'Failed to update node ' + edit_node_store.selected_node!.name + '!',
          text: response.error_message,
          type: 'error'
        })
      }
    }
  )
}

function onClickUpdate() {
  if (edit_node_store.node_is_morphed) {
    const msg = buildNodeMsg()
    if (edit_node_store.selected_node === undefined) {
      console.error("Can't morph a node that doesn't exist")
      return
    }
    ros_store.morph_node_service.callService(
      {
        node_name: edit_node_store.selected_node.name,
        new_node: msg
      } as MorphNodeRequest,
      (response: MorphNodeResponse) => {
        if (response.success) {
          notify({
            title: 'Morphed node ' + edit_node_store.selected_node!.name + ' successfully!',
            type: 'success'
          })
          edit_node_store.node_is_morphed = false
          updateNode() //TODO Is updating after morphing necessary?
        } else {
          notify({
            title: 'Failed to morph node ' + edit_node_store.selected_node!.name + '!',
            text: response.error_message,
            type: 'error'
          })
        }
      }
    )
  } else {
    updateNode()
  }
}
</script>

<template>
  <div class="d-flex flex-column">
    <div class="row g-2 mb-3">
      <div class="btn-group col-4">
        <button
          class="btn btn-primary"
          @click="onClickUpdate"
          :disabled="!edit_node_store.node_is_valid || editor_store.selected_subtree.is_subtree"
        >
          Update Node
        </button>
      </div>
      <div class="btn-group col-8">
        <button
          class="btn btn-danger"
          @click="onClickDelete"
          :disabled="editor_store.selected_subtree.is_subtree"
        >
          Delete Node
        </button>
        <button
          class="btn btn-danger"
          @click="onClickDeleteWithChildren"
          :disabled="editor_store.selected_subtree.is_subtree"
        >
          Delete Node + Children
        </button>
      </div>
    </div>
    <EditableNode />
  </div>
</template>
