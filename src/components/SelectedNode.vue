/*
 * Copyright 2024 FZI Forschungszentrum Informatik
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
<script setup lang="ts">
import { getDefaultValue, prettyprint_type, python_builtin_types } from '@/utils'
import { notify } from '@kyvg/vue3-notification'
import { ref } from 'vue'
import EditableNode from './EditableNode.vue'
import type {
  ParamData,
  NodeData,
  DocumentedNode,
  NodeMsg,
  PyEnum,
  PyLogger,
  PyOperand,
  PyOperator,
  ValueTypes
} from '@/types/types'
import type { MorphNodeRequest, MorphNodeResponse } from '@/types/services/MorphNode'
import type { RemoveNodeRequest, RemoveNodeResponse } from '@/types/services/RemoveNode'
import type { SetOptionsRequest, SetOptionsResponse } from '@/types/services/SetOptions'

import { useEditorStore } from '@/stores/editor'
import { useNodesStore } from '@/stores/nodes'
import { useROSStore } from '@/stores/ros'

const ros_store = useROSStore()
const editor_store = useEditorStore()
const node_store = useNodesStore()

function getValues(x: NodeData): ParamData {
  const type = prettyprint_type(x.serialized_type)
  let json_value = JSON.parse(x.serialized_value)
  if (type === 'type') {
    json_value = json_value['py/type'].replace('__builtin__.', '').replace('builtins.', '')
  }
  return {
    key: x.key,
    value: {
      type: type
        .replace(/^basestring$/, 'string')
        .replace(/^str$/, 'string')
        .replace(/^unicode$/, 'string'),
      value: json_value
    }
  } as ParamData
}

const name = ref<string>('')
const node_class = ref<string>('')
const module_name = ref<string>('')
const is_valid = ref<boolean>(false)
const options = ref<ParamData[]>([])
const inputs = ref<ParamData[]>([])
const outputs = ref<ParamData[]>([])
const is_morphed = ref<boolean>(false)

if (editor_store.selected_node !== undefined) {
  name.value = editor_store.selected_node.name
  node_class.value = editor_store.selected_node.node_class
  module_name.value = editor_store.selected_node.module
  is_valid.value = true
  options.value = editor_store.selected_node.options.map(getValues)
  inputs.value = editor_store.selected_node.inputs.map(getValues)
  outputs.value = editor_store.selected_node.outputs.map(getValues)
  is_morphed.value = false
}

function nameChangeHander(new_name: string) {
  editor_store.setNodeHasChanged()
  name.value = new_name
}

function getDefaultValues(paramList: NodeData[], options: NodeData[] = []): ParamData[] {
  options = options || []

  return paramList.map((x) => {
    return {
      key: x.key,
      value: getDefaultValue(prettyprint_type(x.serialized_value), options)
    } as ParamData
  })
}

function nodeClassChangeHandler(new_class: string) {
  const flow_control_nodes = node_store.nodes.filter((item: DocumentedNode) => {
    return item.max_children == -1 && item.module + item.node_class === new_class
  })

  if (flow_control_nodes && flow_control_nodes.length == 1) {
    const selected_flow_control_node = flow_control_nodes[0]

    node_class.value = selected_flow_control_node.node_class
    module_name.value = selected_flow_control_node.module
    options.value = getDefaultValues(selected_flow_control_node.options)
    inputs.value = getDefaultValues(
      selected_flow_control_node.inputs,
      selected_flow_control_node.options
    )
    outputs.value = getDefaultValues(
      selected_flow_control_node.outputs,
      selected_flow_control_node.options
    )
    is_morphed.value = true
  }
}

function buildNodeMsg(): NodeMsg {
  return {
    module: module_name.value,
    node_class: node_class.value,
    name: name.value,
    options: options.value.map((x) => {
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
  if (!window.confirm('Really delete node ' + name.value + '?')) {
    // Do nothing if user doesn't confirm
    return
  }
  ros_store.remove_node_service.callService(
    {
      node_name: editor_store.selected_node!.name,
      remove_children: false
    } as RemoveNodeRequest,
    (response: RemoveNodeResponse) => {
      if (response.success) {
        notify({
          title: 'Removed ' + editor_store.selected_node!.name + ' successfully!',
          type: 'success'
        })
        editor_store.editorSelectionChange(undefined)
      } else {
        notify({
          title: 'Failed to remove node ' + editor_store.selected_node!.name + '!',
          text: response.error_message,
          type: 'error'
        })
      }
    }
  )
}
function onClickDeleteWithChildren() {
  if (!window.confirm('Really delete node ' + name.value + ' and all of its children?')) {
    // Do nothing if user doesn't confirm
    return
  }
  ros_store.remove_node_service.callService(
    {
      node_name: editor_store.selected_node!.name,
      remove_children: true
    } as RemoveNodeRequest,
    (response: RemoveNodeResponse) => {
      if (response.success) {
        notify({
          title: 'Removed ' + editor_store.selected_node!.name + ' and its children successfully!',
          type: 'success'
        })
        editor_store.editorSelectionChange(undefined)
      } else {
        notify({
          title: 'Failed to remove node ' + editor_store.selected_node!.name + '!',
          text: response.error_message,
          type: 'error'
        })
      }
    }
  )
}

function updateNode() {
  ros_store.set_options_service.callService(
    {
      node_name: editor_store.selected_node!.name,
      rename_node: true,
      new_name: name.value,
      options: options.value.map((x) => {
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
          title: 'Updated node ' + name.value + ' successfully!',
          type: 'success'
        })
        editor_store.clearNodeHasChanged()
        editor_store.editorSelectionChange(name.value)
      } else {
        notify({
          title: 'Failed to update node ' + editor_store.selected_node!.name + '!',
          text: response.error_message,
          type: 'error'
        })
      }
    }
  )
}

function onClickUpdate() {
  if (is_morphed.value) {
    const msg = buildNodeMsg()
    ros_store.morph_node_service.callService(
      {
        node_name: editor_store.selected_node!.name,
        new_node: msg
      } as MorphNodeRequest,
      (response: MorphNodeResponse) => {
        if (response.success) {
          notify({
            title: 'Morphed node ' + editor_store.selected_node!.name + ' successfully!',
            type: 'success'
          })
          is_morphed.value = false
          updateNode()
        } else {
          notify({
            title: 'Failed to morph node ' + editor_store.selected_node!.name + '!',
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

function updateValidity(new_valididy: boolean) {
  editor_store.setNodeHasChanged()
  is_valid.value = new_valididy
}

function updateValue(paramType: string, key: string, new_value: ValueTypes) {
  editor_store.setNodeHasChanged()
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
    // All of these are lists containing lists of [key, ref_key]
    //
    // That is, if options = { foo : int, bar : OptionRef(foo) }
    // ref_keys will be [[bar, foo]]
    if (editor_store.selected_node === undefined) {
      console.error('Node info is null!')
      return
    }
    const ref_keys = editor_store.selected_node.options
      .filter((x) => prettyprint_type(x.serialized_value).startsWith('OptionRef('))
      .map((x) => [
        x.key,
        prettyprint_type(x.serialized_value).substring(
          'OptionRef('.length,
          prettyprint_type(x.serialized_value).length - 1
        )
      ])
      .filter((x) => x[1] === key)
    const input_option_ref_keys = editor_store.selected_node.inputs
      .filter((x) => prettyprint_type(x.serialized_value).startsWith('OptionRef('))
      .map((x) => [
        x.key,
        prettyprint_type(x.serialized_value).substring(
          'OptionRef('.length,
          prettyprint_type(x.serialized_value).length - 1
        )
      ])
      .filter((x) => x[1] === key)
    const output_option_ref_keys = editor_store.selected_node.inputs
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
    const resolve_refs = (current_item: ParamData) => {
      // See if the current option references the changed key
      const refData = ref_keys.find((ref) => ref[0] === current_item.key)!
      if (refData) {
        // If it does, find the type of the referred key
        const optionType = new_options.find((opt) => opt.key === refData[1])
        if (optionType) {
          const opt_value = optionType.value.value as string
          // Get a default value for the type indicated by the
          // referenced option
          return {
            key: current_item.key,
            value: getDefaultValue(opt_value.replace('__builtin__.', '').replace('builtins.', ''))
          }
        }
      }
      return current_item
    }
    options.value = new_options.map(resolve_refs)

    if (input_option_ref_keys.length > 0) {
      inputs.value = inputs.value.map(resolve_refs)
    }
    if (output_option_ref_keys.length > 0) {
      outputs.value = outputs.value.map(resolve_refs)
    }
  } else if (paramType.toLowerCase() === 'inputs') {
    inputs.value = inputs.value.map(map_fun)
  } else if (paramType.toLowerCase() === 'outputs') {
    outputs.value = outputs.value.map(map_fun)
  }
}
</script>

<template>
  <div class="d-flex flex-column">
    <div class="btn-group d-flex mb-2" role="group">
      <button class="btn btn-primary w-30" @disabled="!is_valid" @click="onClickUpdate">
        Update Node
      </button>
      <button class="btn btn-danger w-35" @click="onClickDelete">Delete Node</button>
      <button class="btn btn-danger w-35" @click="onClickDeleteWithChildren">
        Delete Node + Children
      </button>
    </div>
    <EditableNode
      :key="module_name + node_class + name"
      :name="name"
      :node_class="node_class"
      :module="module_name"
      :options="options"
      :inputs="inputs"
      :outputs="outputs"
      :updateValidity="updateValidity"
      :changeNodeClass="nodeClassChangeHandler"
      :changeNodeName="nameChangeHander"
      :updateValue="updateValue"
    />
  </div>
</template>
