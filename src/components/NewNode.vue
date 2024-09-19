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
  node: DocumentedNode
  parents: NodeMsg[]
}>()

const editor_store = useEditorStore()
const edit_node_store = useEditNodeStore()
const ros_store = useROSStore()

const is_valid = ref<boolean>(true)
const selected_parent = ref<string | undefined>(
  props.parents.length > 0 ? props.parents[0].name : undefined
)
const name = ref<string>(props.node.name)

const default_options = getDefaultValues(props.node.options)

const options = ref<ParamData[]>(
  default_options.map((x) => {
    if (x.value.type === 'unset_optionref') {
      const optionref: string = x.value.value as string
      const optionTypeName = optionref.substring('Ref to "'.length, optionref.length - 1)
      const optionType = default_options.find((x) => {
        return x.key === optionTypeName
      })
      if (optionType && optionType.value) {
        return {
          key: x.key,
          value: getDefaultValue(optionType.value.value as string)
        }
      }
    }
    return {
      key: x.key,
      value: x.value
    } as ParamData
  })
)
const inputs = ref<ParamData[]>(getDefaultValues(props.node.inputs, props.node.options))
const outputs = ref<ParamData[]>(getDefaultValues(props.node.outputs, props.node.options))

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

function updateValue(paramType: string, key: string, new_value: any) {
  edit_node_store.setNodeHasChanged()
  const map_fun = function (x: ParamData) {
    if (x.key === key) {
      return {
        key: key,
        value: {
          type: x.value.type,
          value: new_value
        }
      }
    } else {
      return x
    }
  }

  if (paramType.toLowerCase() === 'options') {
    const ref_keys = props.node.options
      .filter((x) => prettyprint_type(x.serialized_value).startsWith('OptionRef('))
      .map((x) => [
        x.key,
        prettyprint_type(x.serialized_value).substring(
          'OptionRef('.length,
          prettyprint_type(x.serialized_value).length - 1
        )
      ])
      .filter((x) => x[1] === key)
    const new_options = options.value.map(map_fun)
    // update the options in our state that are references to
    // the changed key - this will discard any values entered
    // already, but they'd be incompatible anyway

    const resolved_options = new_options.map((x) => {
      const refData = ref_keys.find((ref) => ref[0] === x.key)
      if (refData !== undefined && refData.length > 1) {
        const optionType = new_options.find((opt) => opt.key === refData![1])
        if (optionType) {
          return {
            key: x.key,
            value: getDefaultValue(
              optionType.value.value.replace('__builtin__.', '').replace('builtins.', '')
            )
          }
        }
      }
      return x
    })
    options.value = resolved_options
  } else if (paramType.toLowerCase() === 'inputs') {
    inputs.value = inputs.value.map(map_fun)
  } else if (paramType.toLowerCase() === 'outputs') {
    outputs.value = outputs.value.map(map_fun)
  }
}

function getDefaultValues(paramList: NodeData[], options?: NodeData[] | null) {
  options = options || []

  return paramList.map((x) => {
    return {
      key: x.key,
      value: getDefaultValue(prettyprint_type(x.serialized_value), options)
    }
  })
}

function updateValidity(valid: boolean) {
  is_valid.value = is_valid.value || valid
}

function handleNodeNameChange(new_name: string) {
  edit_node_store.setNodeHasChanged()
  name.value = new_name
}

function addToTree() {
  if (!ros_store.connected) {
    notify({
      title: 'Service not available!',
      text: 'ROS not connected, cannot call services!',
      type: 'error'
    })
  }
  const msg = buildNodeMessage(props.node.module, props.node.node_class, name.value, options.value)

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
        notify({
          title: 'Added not to tree!',
          text: 'Node added as: ' + response.actual_node_name,
          type: 'success'
        })
      } else {
        notify({
          title: 'Failed to add ' + name.value + ' to the tree!',
          text: response.error_message,
          type: 'error'
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
    <button class="btn btn-block btn-primary" :disabled="!is_valid" @click="addToTree">
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
    <EditableNode
      :key="node.module + node.node_class + node.name"
      :name="name"
      :module="node.module"
      :node_class="node.node_class"
      :options="options"
      :inputs="inputs"
      :outputs="outputs"
      :changeNodeName="handleNodeNameChange"
      :updateValidity="updateValidity"
      :changeNodeClass="
        (new_class: string) => {
          //Nothing happens!
        }
      "
      :updateValue="updateValue"
    ></EditableNode>
  </div>
</template>
