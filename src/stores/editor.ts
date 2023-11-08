import { ref } from 'vue'
import { defineStore } from 'pinia'
import { TreeExecutionCommands } from '@/types/services/ControlTreeExecution'
import type { DebugInfo, DocumentedNode, TreeMsg } from '@/types/types'
import { useNodesStore } from './nodes'
import { notify } from '@kyvg/vue3-notification'

export enum EditorSelectionSource {
  NODELIST = 'nodelist'
}

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
  const debug_info = ref<DebugInfo | undefined>(undefined)
  const publish_subtrees = ref<boolean>(false)
  const debug = ref<boolean>(false)
  const running_commands = ref<Set<TreeExecutionCommands>>(new Set<TreeExecutionCommands>())
  const dragging_node = ref<DocumentedNode | undefined>()

  const node_has_changed = ref<boolean>(false)

  const selected_node = ref<DocumentedNode | undefined>(undefined)

  const selected_node_names = ref<string[]>([])

  const last_seletion_source = ref<EditorSelectionSource>(EditorSelectionSource.NODELIST)

  const filtered_nodes = ref<DocumentedNode[]>([])

  const show_data_graph = ref<boolean>(true)

  const skin = ref<EditorSkin>(EditorSkin.DARK)

  const selected_subtree = ref<SelectedSubtree>({
    name: '',
    is_subtree: false,
    tree: undefined
  })

  const subtree_names = ref<string[]>([])

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

  function filterNodes(filter: string) {
    if (filter === '') {
      filtered_nodes.value = []
      return
    }
    filtered_nodes.value = nodes_store.nodes_fuse.search(filter).map((x) => x.item)
  }

  function clearFilteredNodes() {
    filtered_nodes.value = []
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

      selected_node.value = new_selected_node
      selected_node_names.value = []
      last_seletion_source.value = EditorSelectionSource.NODELIST
    }
  }

  function startDragging(new_dragging_node: DocumentedNode) {
    dragging_node.value = new_dragging_node
  }

  function stopDragging() {
    dragging_node.value = undefined
  }

  function enableShowDataGraph(enable: boolean) {
    show_data_graph.value = enable
  }

  function setEditorSkin(new_skin: EditorSkin) {
    skin.value = new_skin
  }

  function selectSubtree(name: string, is_subtree: boolean) {
    let tree_msg = undefined
    if (is_subtree) {
      if (debug_info.value === undefined) {
        notify({
          title: 'No Subtree Information received!',
          type: 'error'
        })
        return
      }
      tree_msg = debug_info.value.subtree_states.find((x: TreeMsg) => x.name === name)
    } else {
      tree_msg = tree.value
    }

    selected_subtree.value = {
      name: name,
      is_subtree: is_subtree,
      tree: tree_msg
    }
  }

  return {
    tree,
    publish_subtrees,
    filtered_nodes,
    debug,
    running_commands,
    dragging_node,
    last_seletion_source,
    selected_node,
    selected_node_names,
    node_has_changed,
    runNewCommand,
    removeRunningCommand,
    enableSubtreePublishing,
    enableDebugging,
    filterNodes,
    clearFilteredNodes,
    nodeListSelectionChange,
    startDragging,
    stopDragging,
    show_data_graph,
    enableShowDataGraph,
    skin,
    setEditorSkin,
    selected_subtree,
    selectSubtree,
    subtree_names
  }
})
