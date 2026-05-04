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

import type { DocumentedNode, NodeStructure, UUIDString } from '@/types/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as uuid from 'uuid'
import { useEditorStore } from './editor'
import { useNodesStore } from './nodes'
import { getTypeFromMsg, initializeReferenceContainers, uuidToRos } from '@/utils'
import { findNodeInTreeList, getNodeStructures } from '@/tree_selection'
import type { NodeData } from '@/types/editor_types'
import type { NodeIO } from '@/types/data_types'

export enum EditorSelectionSource {
  NONE = 'none',
  NODELIST = 'nodelist',
  EDITOR = 'editor',
  MULTIPLE = 'multiple'
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
  const new_node_inputs = ref<NodeData[]>([])
  const new_node_outputs = ref<NodeData[]>([])
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
    selected_node_tree_id.value = ''
    selected_node_id_pairs.value = []
    last_seletion_source.value = EditorSelectionSource.NONE
    return true
  }

  function nodeSetInputsOutputs(inputs: NodeIO[], outputs: NodeIO[]) {
    function mapIOtoData(io: NodeIO): NodeData {
      return {
        key: io.key,
        type: getTypeFromMsg(io.type),
        serialized_value: io.serialized_value
      }
    }

    new_node_inputs.value = inputs.map(mapIOtoData)
    new_node_outputs.value = outputs.map(mapIOtoData)

    initializeReferenceContainers(new_node_inputs.value, new_node_outputs.value)
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

    nodeSetInputsOutputs(new_selected_node.inputs, new_selected_node.outputs)
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

    nodeSetInputsOutputs(new_selected_node.inputs, new_selected_node.outputs)
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

    new_node_inputs.value = new_reference_node.inputs.map((input) => {
      return {
        key: input.key,
        type: getTypeFromMsg(input.type),
        serialized_value: input.serialized_value
      }
    })
    new_node_outputs.value = new_reference_node.outputs.map((output) => {
      return {
        key: output.key,
        type: getTypeFromMsg(output.type),
        serialized_value: output.serialized_value
      }
    })

    node_has_changed.value = true
    node_is_morphed.value = true
  }

  function buildNodeMsg(): NodeStructure {
    return {
      node_id: uuidToRos(uuid.v4()),
      name: new_node_name.value,
      module: new_node_module.value,
      node_class: new_node_class.value,
      max_children: 0,
      child_ids: [],
      inputs: new_node_inputs.value.map((input) => {
        return {
          key: input.key,
          type: input.type.toTypeMsg(),
          serialized_value: input.serialized_value
        }
      }),
      outputs: new_node_outputs.value.map((output) => {
        return {
          key: output.key,
          type: output.type.toTypeMsg(),
          serialized_value: output.serialized_value
        }
      }),
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
    buildNodeMsg
  }
})
