/*
 * Copyright 2024-2026 FZI Forschungszentrum Informatik
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

import type {
  DocumentedNode,
  IOData,
  NodeIO,
  NodeOption,
  NodeStructure,
  OptionData,
  UUIDString,
  ValueTypes
} from '@/types/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as uuid from 'uuid'
import { useEditorStore } from './editor'
import { useNodesStore } from './nodes'
import {
  getDefaultValue,
  parseOptionRef,
  prettyprint_type,
  serializeNodeOptions,
  uuidToRos
} from '@/utils'
import { findNodeInTreeList, getNodeStructures } from '@/tree_selection'

export enum EditorSelectionSource {
  NONE = 'none',
  NODELIST = 'nodelist',
  EDITOR = 'editor',
  MULTIPLE = 'multiple'
}

function parseNodeIO(data: NodeIO, options?: NodeOption[] | null): IOData {
  return {
    key: data.key,
    type: parseOptionRef(prettyprint_type(data.serialized_type), options)
  } as IOData
}

type TreeNodeIdPair = {
  tree: UUIDString
  node: UUIDString
}

export const useEditNodeStore = defineStore('edit_node', () => {
  const editor_store = useEditorStore()
  const nodes_store = useNodesStore()

  const is_new_node = ref<boolean>(false)
  const node_has_changed = ref<boolean>(false)
  const selected_node = ref<NodeStructure | undefined>(undefined)
  const selected_node_tree_id = ref<UUIDString | ''>('')
  const reference_node = ref<DocumentedNode | undefined>(undefined)
  const selected_node_id_pairs = ref<TreeNodeIdPair[]>([])
  const last_seletion_source = ref<EditorSelectionSource>(EditorSelectionSource.NONE)

  const new_node_name = ref<string>('')
  const new_node_class = ref<string>('')
  const new_node_module = ref<string>('')
  const new_node_options = ref<OptionData[]>([])
  const new_node_inputs = ref<IOData[]>([])
  const new_node_outputs = ref<IOData[]>([])
  const node_is_valid = ref<boolean>(false)
  const node_is_morphed = ref<boolean>(false)

  const flow_control_nodes = computed<DocumentedNode[]>(() => {
    return nodes_store.nodes.filter((item: DocumentedNode) => item.max_children == -1)
  })
  const is_flow_control_node = computed<boolean>(() => {
    return (
      flow_control_nodes.value.filter(
        (item: DocumentedNode) =>
          new_node_module.value === item.module && new_node_class.value === item.node_class
      ).length > 0
    )
  })

  //TODO this appears to be unused
  const copy_node_mode = ref<boolean>(false)

  function setNodeHasChanged() {
    node_has_changed.value = true
  }

  function clearNodeHasChanged() {
    node_has_changed.value = false
  }

  function clearSelection(): boolean {
    if (node_has_changed.value) {
      if (
        window.confirm('Are you sure you wish to discard all changes to the currently edited node?')
      ) {
        node_has_changed.value = false
      } else {
        return false
      }
    }
    selected_node.value = undefined
    reference_node.value = undefined
    selected_node_id_pairs.value = []
    last_seletion_source.value = EditorSelectionSource.NONE
    return true
  }

  function nodeListSelectionChange(new_selected_node: DocumentedNode) {
    if (node_has_changed.value) {
      if (
        window.confirm('Are you sure you wish to discard all changes to the currently edited node?')
      ) {
        node_has_changed.value = false
      } else {
        return
      }
    }

    selected_node.value = undefined
    selected_node_tree_id.value = ''
    reference_node.value = new_selected_node
    copy_node_mode.value = false
    is_new_node.value = true
    selected_node_id_pairs.value = []
    last_seletion_source.value = EditorSelectionSource.NODELIST

    // Initialize editable attributes

    new_node_name.value = new_selected_node.node_class
    new_node_class.value = new_selected_node.node_class
    new_node_module.value = new_selected_node.module
    node_is_valid.value = true
    node_is_morphed.value = false

    new_node_options.value = new_selected_node.options.map((data) => {
      return {
        key: data.key,
        value: getDefaultValue(prettyprint_type(data.serialized_type), new_selected_node.options)
      } as OptionData
    })
    new_node_inputs.value = new_selected_node.inputs.map((data) =>
      parseNodeIO(data, new_selected_node.options)
    )
    new_node_outputs.value = new_selected_node.outputs.map((data) =>
      parseNodeIO(data, new_selected_node.options)
    )
  }

  function editorSelectionChange(
    new_selected_node_tree_id: UUIDString,
    new_selected_node_id: UUIDString
  ) {
    if (node_has_changed.value) {
      if (
        window.confirm('Are you sure you wish to discard all changes to the currently edited node?')
      ) {
        node_has_changed.value = false
      } else {
        return
      }
    }

    const new_selected_node = findNodeInTreeList(
      editor_store.tree_structure_list,
      getNodeStructures,
      new_selected_node_tree_id,
      new_selected_node_id
    )

    if (new_selected_node === undefined) {
      console.error('Could not find node in tree')
      clearSelection()
      return
    }

    const new_reference_node = nodes_store.nodes.find(
      (node: DocumentedNode) =>
        node.node_class === new_selected_node.node_class && node.module === new_selected_node.module
    )

    if (new_reference_node === undefined) {
      console.error('Cannot recover node information')
    }

    selected_node.value = new_selected_node
    selected_node_tree_id.value = new_selected_node_tree_id
    reference_node.value = new_reference_node
    copy_node_mode.value = true
    is_new_node.value = false
    selected_node_id_pairs.value = [
      {
        tree: new_selected_node_tree_id,
        node: new_selected_node_id
      }
    ]
    last_seletion_source.value = EditorSelectionSource.EDITOR

    // Initialize editable attributes
    new_node_name.value = new_selected_node.name
    new_node_class.value = new_selected_node.node_class
    new_node_module.value = new_selected_node.module
    node_is_valid.value = true
    node_is_morphed.value = false

    new_node_options.value = new_selected_node.options.map((data) => {
      const type = prettyprint_type(data.serialized_type)
      let json_value = JSON.parse(data.serialized_value)
      if (type.startsWith('type')) {
        json_value = prettyprint_type(data.serialized_value)
      }
      return {
        key: data.key,
        value: {
          type: type,
          value: json_value
        }
      } as OptionData
    })
    new_node_inputs.value = new_selected_node.inputs.map((data) =>
      parseNodeIO(data, new_selected_node.options)
    )
    new_node_outputs.value = new_selected_node.outputs.map((data) =>
      parseNodeIO(data, new_selected_node.options)
    )
  }

  function selectMultipleNodes(new_selected_node_id_pairs: TreeNodeIdPair[]) {
    if (node_has_changed.value) {
      if (
        window.confirm('Are you sure you wish to discard all changes to the currently edited node?')
      ) {
        node_has_changed.value = false
      } else {
        return
      }
    }

    selected_node.value = undefined
    reference_node.value = undefined
    last_seletion_source.value = EditorSelectionSource.MULTIPLE

    selected_node_id_pairs.value.forEach((id_pair: TreeNodeIdPair) => {
      const index = new_selected_node_id_pairs.findIndex(
        (val) => val.tree === id_pair.tree && val.node === id_pair.node
      )
      if (index === -1) {
        new_selected_node_id_pairs.push(id_pair)
      } else {
        new_selected_node_id_pairs.splice(index, 1)
      }
    })

    //FIXME this explicit assignment is necessary to make watchers trigger (color nodes).
    // This shouldn't be an issue (watchers are supposed to be deep by default)
    selected_node_id_pairs.value = new_selected_node_id_pairs
  }

  function changeCopyMode(new_mode: boolean) {
    copy_node_mode.value = new_mode
  }

  function changeNodeName(value: string) {
    node_has_changed.value = true
    new_node_name.value = value
  }

  function changeNodeClass(node_module_class: string) {
    // Find new node to replace attributes
    const new_reference_node = flow_control_nodes.value.find(
      (node: DocumentedNode) => node.module + node.node_class === node_module_class
    )

    if (new_reference_node === undefined) {
      console.warn("Can't locate node morph target")
      return
    }

    reference_node.value = new_reference_node
    new_node_class.value = new_reference_node.node_class
    new_node_module.value = new_reference_node.module

    new_node_options.value = new_reference_node.options.map((data) => {
      return {
        key: data.key,
        value: getDefaultValue(prettyprint_type(data.serialized_type), new_reference_node.options)
      } as OptionData
    })
    new_node_inputs.value = new_reference_node.inputs.map((x) =>
      parseNodeIO(x, new_reference_node.options)
    )
    new_node_outputs.value = new_reference_node.outputs.map((x) =>
      parseNodeIO(x, new_reference_node.options)
    )

    node_has_changed.value = true
    node_is_morphed.value = true
  }

  function updateParamValue(paramType: 'options', key: string, new_value: ValueTypes) {
    node_has_changed.value = true
    function map_fun(x: OptionData): OptionData {
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

    if (paramType === 'options') {
      if (reference_node.value === undefined) {
        console.error('Cannot recover node information')
        return
      }

      // All of these are lists containing lists of [key, ref_key]
      // That is, if options = { foo : int, bar : OptionRef(foo) }
      // ref_keys will be [[bar, foo]]
      function findOptionRefs(ref_list: NodeIO[]): [string, string][] {
        return ref_list
          .filter((x) => prettyprint_type(x.serialized_type).startsWith('OptionRef('))
          .map((x): [string, string] => [
            x.key,
            prettyprint_type(x.serialized_type).substring(
              'OptionRef('.length,
              prettyprint_type(x.serialized_type).length - 1
            )
          ])
          .filter((x) => x[1] === key)
      }

      const option_ref_keys = findOptionRefs(reference_node.value.options)

      const input_ref_keys = findOptionRefs(reference_node.value.inputs)

      const output_ref_keys = findOptionRefs(reference_node.value.outputs)

      new_node_options.value = new_node_options.value.map(map_fun)
      function resolve_refs(refs: [string, string][], current_item: OptionData): OptionData {
        // See if the current option references the changed key
        const refData = refs.find((ref) => ref[0] === current_item.key)!
        if (refData) {
          // If it does, find the type of the referred key
          const optionType = new_node_options.value.find((opt) => opt.key === refData[1])
          if (optionType) {
            const opt_value = optionType.value.value as string
            // Get a default value for the type indicated by the
            // referenced option
            return {
              key: current_item.key,
              value: getDefaultValue(opt_value)
            }
          }
        }
        return current_item
      }
      new_node_options.value = new_node_options.value.map((item) =>
        resolve_refs(option_ref_keys, item)
      )

      function resolve_io_refs(refs: [string, string][], current_item: IOData): IOData {
        // See if the current option references the changed key
        const refData = refs.find((ref) => ref[0] === current_item.key)!
        if (refData) {
          // If it does, find the type of the referred key
          const optionType = new_node_options.value.find((opt) => opt.key === refData[1])
          if (optionType) {
            const opt_value = optionType.value.value as string
            // Get a default value for the type indicated by the
            // referenced option
            return {
              key: current_item.key,
              type: opt_value
            }
          }
        }
        return current_item
      }
      if (input_ref_keys.length > 0) {
        new_node_inputs.value = new_node_inputs.value.map((item) =>
          resolve_io_refs(input_ref_keys, item)
        )
      }
      if (output_ref_keys.length > 0) {
        new_node_outputs.value = new_node_outputs.value.map((item) =>
          resolve_io_refs(output_ref_keys, item)
        )
      }
    }
  }

  function buildNodeMsg(): NodeStructure {
    return {
      node_id: uuidToRos(uuid.v4()),
      name: new_node_name.value,
      module: new_node_module.value,
      node_class: new_node_class.value,
      version: '',
      max_children: 0,
      child_ids: [],
      options: serializeNodeOptions(new_node_options.value),
      inputs: [],
      outputs: [],
      tree_ref: ''
    }
  }

  return {
    selected_node,
    selected_node_tree_id,
    reference_node,
    selected_node_id_pairs,
    last_seletion_source,
    node_has_changed,
    copy_node_mode,
    node_is_valid,
    node_is_morphed,
    new_node_name,
    new_node_class,
    new_node_module,
    new_node_options,
    new_node_inputs,
    new_node_outputs,
    flow_control_nodes,
    is_flow_control_node,
    nodeListSelectionChange,
    editorSelectionChange,
    selectMultipleNodes,
    clearSelection,
    setNodeHasChanged,
    clearNodeHasChanged,
    changeCopyMode,
    changeNodeName,
    changeNodeClass,
    updateParamValue,
    buildNodeMsg
  }
})
