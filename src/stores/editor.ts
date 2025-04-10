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
import type {
  Wiring,
  DocumentedNode,
  TreeStructure,
  TrimmedNode,
  DataEdgeTerminal,
  Tree,
  TreeState,
  TreeData
} from '@/types/types'
import { notify } from '@kyvg/vue3-notification'

export enum EditorSkin {
  DARK = 'darkmode',
  LIGHT = 'lightmode'
}

export const useEditorStore = defineStore('editor', () => {

  const tree_structure_list = ref<TreeStructure[]>([])
  const tree_state_list = ref<TreeState[]>([])
  const tree_data_list = ref<TreeData[]>([])

  const publish_subtrees = ref<boolean>(false)
  const publish_data = ref<boolean>(false)
  const debug = ref<boolean>(false)
  const running_commands = ref<Set<TreeExecutionCommands>>(new Set<TreeExecutionCommands>())

  let drag_start_timeout: number = 0
  const drag_start_delay = 200
  /* The dragging_new_node msg is set if we drag a new node from the node list, 
    the dragging_existing_node is set if we drag a node from the editor canvas.
    The is_dragging boolean is set in both cases and thus can be used for general styling and such.*/
  const dragging_new_node = ref<DocumentedNode | undefined>()
  const dragging_existing_node = ref<d3.HierarchyNode<TrimmedNode> | undefined>()
  const data_edge_endpoint = ref<DataEdgeTerminal | undefined>()
  const is_dragging = computed<boolean>(() => {
    return (
      dragging_new_node.value !== undefined ||
      dragging_existing_node.value !== undefined ||
      data_edge_endpoint.value !== undefined
    )
  })

  const show_data_graph = ref<boolean>(true)

  const skin = ref<EditorSkin>(EditorSkin.DARK)

  const selected_tree = ref<string>('')

  const has_selected_subtree = computed<boolean>(
    () => selected_tree.value !== ""
  )

  const current_tree = computed<Tree>(() => {
    return {
      structure: tree_structure_list.value.find(
        (tree) => tree.tree_id === selected_tree.value
      ),
      state: tree_state_list.value.find(
        (tree) => tree.tree_id === selected_tree.value
      ),
      data: tree_data_list.value.find(
        (tree) => tree.tree_id === selected_tree.value
      )
    }
  })

  /*const subtree_names = computed<string[]>(() =>
    subtree_states.value.map((tree) => tree.name)
  )*/

  const selected_edge = ref<Wiring | undefined>(undefined)

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

  function startDraggingNewNode(new_dragging_node: DocumentedNode) {
    drag_start_timeout = setTimeout(
      () => (dragging_new_node.value = new_dragging_node),
      drag_start_delay
    )
  }

  function startDraggingExistingNode(existing_dragging_node: d3.HierarchyNode<TrimmedNode>) {
    drag_start_timeout = setTimeout(
      () => (dragging_existing_node.value = existing_dragging_node),
      drag_start_delay
    )
  }

  function startDrawingDataEdge(data_edge_start: DataEdgeTerminal) {
    data_edge_endpoint.value = data_edge_start
  }

  function stopDragging() {
    clearTimeout(drag_start_timeout)
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

  /*function selectSubtree(name: string, is_subtree: boolean) {
    let tree: TreeStructure | undefined
    if (is_subtree) {
      if (subtree_states.value.length === 0) {
        notify({
          title: 'No Subtree Information received!',
          type: 'error'
        })
        return
      }
      tree = subtree_states.value.find((x) => x.name === name)
    }

    if (tree === undefined) {
      return
    }

    selected_subtree.value = {
      name: name,
      is_subtree: is_subtree,
      tree: tree
    }
  }*/

  function selectEdge(edge: Wiring) {
    selected_edge.value = edge
  }

  function unselectEdge() {
    selected_edge.value = undefined
  }

  return {
    selected_tree,
    has_selected_subtree,
    current_tree,
    publish_subtrees,
    publish_data,
    debug,
    tree_structure_list,
    tree_state_list,
    tree_data_list,
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
    selected_edge,
    selectEdge,
    unselectEdge
  }
},
{
  persist: {
    pick: ['publish_data', 'publish_subtrees'],
    storage: sessionStorage,
  }
})
