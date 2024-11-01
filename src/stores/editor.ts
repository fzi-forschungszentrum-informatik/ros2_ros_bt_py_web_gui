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
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { TreeExecutionCommands } from '@/types/services/ControlTreeExecution'
import type { NodeDataWiring, DocumentedNode, TreeMsg, NodeMsg, TrimmedNode, DataEdgeTerminal } from '@/types/types'
import { useNodesStore } from './nodes'
import { notify } from '@kyvg/vue3-notification'

export enum EditorSkin {
  DARK = 'darkmode',
  LIGHT = 'lightmode'
}

export type SelectedSubtree = {
  name: string
  is_subtree: boolean
  tree: TreeMsg | undefined
}

export const useEditorStore = defineStore('editor', () => {
  const nodes_store = useNodesStore()

  const tree = ref<TreeMsg | undefined>(undefined)
  //const debug_info = ref<DebugInfo | undefined>(undefined)
  const subtree_states = ref<TreeMsg[]>([])
  const publish_subtrees = ref<boolean>(false)
  const debug = ref<boolean>(false)
  const running_commands = ref<Set<TreeExecutionCommands>>(new Set<TreeExecutionCommands>())

  /* The dragging_new_node msg is set if we drag a new node from the node list, 
    the dragging_existing_node is set if we drag a node from the editor canvas.
    The is_dragging boolean is set in both cases and thus can be used for general styling and such.*/
  const dragging_new_node = ref<DocumentedNode | undefined>()
  const dragging_existing_node = ref<d3.HierarchyNode<TrimmedNode> | undefined>()
  const data_edge_endpoint = ref<DataEdgeTerminal | undefined>()
  const is_dragging = computed<boolean>(() => {
    return dragging_new_node.value !== undefined || 
    dragging_existing_node.value !== undefined ||
    data_edge_endpoint.value !== undefined
  })

  const show_data_graph = ref<boolean>(true)

  const skin = ref<EditorSkin>(EditorSkin.DARK)

  const selected_subtree = ref<SelectedSubtree>({
    name: '',
    is_subtree: false,
    tree: undefined
  })

  const subtree_names = computed<string[]>(() => 
    subtree_states.value.map((tree: TreeMsg) => tree.name)
  )

  const selected_edge = ref<NodeDataWiring | undefined>(undefined)

  const is_layer_mode = ref<boolean>(false)

  function enableSubtreePublishing(enable: boolean) {
    publish_subtrees.value = enable
  }

  function enableDebugging(enable: boolean) {
    debug.value = enable
  }

  function runNewCommand(new_command: TreeExecutionCommands) {
    running_commands.value.add(new_command)
  }

  function removeRunningCommand(command: TreeExecutionCommands) {
    running_commands.value.delete(command)
  }

  //TODO add timer to allow for early cancelling the drag on "click" (fast mousedown and mouseup)
  // This is not a functional change, but would avoid having the drop targets flicker when clicking
  function startDraggingNewNode(new_dragging_node: DocumentedNode) {
    dragging_new_node.value = new_dragging_node
  }

  function startDraggingExistingNode(existing_dragging_node: d3.HierarchyNode<TrimmedNode>) {
    dragging_existing_node.value = existing_dragging_node
  }

  function startDrawingDataEdge(data_edge_start: DataEdgeTerminal) {
    data_edge_endpoint.value = data_edge_start
  }

  function stopDragging() {
    dragging_new_node.value = undefined
    dragging_existing_node.value = undefined
    data_edge_endpoint.value = undefined
  }

  function stopDrawingDataEdge() {
    data_edge_endpoint.value = undefined
  }

  function enableShowDataGraph(enable: boolean) {
    show_data_graph.value = enable
  }

  function cycleEditorSkin() {
    switch (skin.value) {
      case EditorSkin.DARK:
        skin.value = EditorSkin.LIGHT
        return
      case EditorSkin.LIGHT:
        skin.value = EditorSkin.DARK
        return
      default:
        skin.value = EditorSkin.DARK
        return
    }
  }

  function selectSubtree(name: string, is_subtree: boolean) {
    let tree_msg = undefined
    if (is_subtree) {
      if (subtree_states.value.length === 0) {
        notify({
          title: 'No Subtree Information received!',
          type: 'error'
        })
        return
      }
      tree_msg = subtree_states.value.find((x: TreeMsg) => x.name === name)
    }

    selected_subtree.value = {
      name: name,
      is_subtree: is_subtree,
      tree: tree_msg
    }
  }

  function selectEdge(edge: NodeDataWiring) {
    selected_edge.value = edge
  }

  function unselectEdge() {
    selected_edge.value = undefined
  }

  return {
    tree,
    publish_subtrees,
    debug,
    subtree_states,
    running_commands,
    dragging_new_node,
    dragging_existing_node,
    data_edge_endpoint,
    is_dragging,
    is_layer_mode,
    runNewCommand,
    removeRunningCommand,
    enableSubtreePublishing,
    enableDebugging,
    startDraggingNewNode,
    startDraggingExistingNode,
    startDrawingDataEdge,
    stopDragging,
    stopDrawingDataEdge,
    show_data_graph,
    enableShowDataGraph,
    skin,
    cycleEditorSkin,
    selected_subtree,
    selectSubtree,
    subtree_names,
    selected_edge,
    selectEdge,
    unselectEdge,
  }
})
