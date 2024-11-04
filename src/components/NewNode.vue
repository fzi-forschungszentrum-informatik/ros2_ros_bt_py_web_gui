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
import type {
  DocumentedNode,
  NodeData,
  NodeMsg,
  ParamData,
  PyEnum,
  PyLogger,
  PyOperand,
  PyOperator
} from '@/types/types'
import EditableNode from './EditableNode.vue'
import { ref } from 'vue'
import { getDefaultValue, prettyprint_type, python_builtin_types } from '@/utils'
import { useEditorStore } from '@/stores/editor'
import { useROSStore } from '@/stores/ros'
import { notify } from '@kyvg/vue3-notification'
import type { AddNodeRequest, AddNodeResponse } from '@/types/services/AddNode'
import { useEditNodeStore } from '@/stores/edit_node'

const props = defineProps<{
  parents: NodeMsg[]
}>()

const edit_node_store = useEditNodeStore()
const ros_store = useROSStore()

const selected_parent = ref<string | undefined>(
  props.parents.length > 0 ? props.parents[0].name : undefined
)

function buildNodeMessage(
  module: string,
  node_class: string,
  name: string,
  options: ParamData[]
): NodeMsg {
  return {
    module: module,
    node_class: node_class,
    name: name,
    options: options.map((x) => {
      const option: NodeData = {
        key: x.key,
        serialized_value: '',
        serialized_type: ''
      }
      if (x.value.type === 'type') {
        if (python_builtin_types.indexOf(x.value.value as string) >= 0) {
          x.value.value = '__builtin__.' + x.value.value
        }
        option.serialized_value = JSON.stringify({
          'py/type': x.value.value
        })
      } else if (x.value.type.startsWith('__')) {
        const py_value: PyLogger | PyOperator | PyOperand | PyEnum = x.value.value as
          | PyLogger
          | PyOperator
          | PyOperand
          | PyEnum
        py_value['py/object' as keyof typeof py_value] = x.value.type.substring('__'.length)
        option.serialized_value = JSON.stringify(x.value.value)
      } else {
        option.serialized_value = JSON.stringify(x.value.value)
      }
      return option
    }),
    child_names: [],
    inputs: [],
    outputs: [],
    version: '',
    max_children: 0,
    state: ''
  }
}

function addToTree() {
  if (!ros_store.connected) {
    notify({
      title: 'Service not available!',
      text: 'ROS not connected, cannot call services!',
      type: 'error'
    })
  }

  if (edit_node_store.reference_node === undefined) {
    console.error("Undefined node reference, can't add node to tree")
    return
  }

  const msg = buildNodeMessage(
    edit_node_store.reference_node.module, 
    edit_node_store.new_node_class, 
    edit_node_store.new_node_name, 
    edit_node_store.new_node_options
  )

  ros_store.add_node_service.callService(
    {
      parent_name: selected_parent.value,
      node: msg,
      allow_rename: true
    } as AddNodeRequest,
    (response: AddNodeResponse) => {
      if (response.success) {
        edit_node_store.clearNodeHasChanged()
        console.log('Added node to tree as ' + response.actual_node_name)
        edit_node_store.editorSelectionChange(response.actual_node_name)
        notify({
          title: 'Added not to tree!',
          text: 'Node added as: ' + response.actual_node_name,
          type: 'success'
        })
      } else {
        notify({
          title: 'Failed to add ' + msg.name + ' to the tree!',
          text: response.error_message,
          type: 'warn'
        })
      }
    },
    (failed: string) => {
      notify({
        title: 'Failed to call AddNode service',
        text: failed,
        type: 'error'
      })
    }
  )
}
</script>

<template>
  <div class="d-flex flex-column">
    <button class="btn btn-block btn-primary" :disabled="!edit_node_store.node_is_valid" @click="addToTree">
      Add to Tree
    </button>
    <label class="pt-2 pb-2">
      Parent
      <select
        class="custom-select d-block"
        :disabled="parents.length === 0"
        :value="selected_parent"
      >
        <option v-for="parent in parents" :key="parent.name" :value="parent.name">
          {{ parent.name }}
        </option>
      </select>
    </label>
    <EditableNode />
  </div>
</template>
