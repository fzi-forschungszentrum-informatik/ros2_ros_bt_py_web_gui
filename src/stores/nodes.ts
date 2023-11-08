import type { DocumentedNode } from '@/types/types'
import Fuse from 'fuse.js'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNodesStore = defineStore('nodes', () => {
  const nodes_fuse_options = {
    shouldSort: true,
    threshold: 0.3,
    location: 0,
    distance: 20,
    maxPatternLength: 100,
    minMatchCharLength: 3,
    keys: ['node_class', 'node_type', 'module', 'tags'],
    ignoreLocation: true,
    useExtendedSearch: true
  }
  const nodes = ref<DocumentedNode[]>([])
  const nodes_fuse = ref<Fuse<DocumentedNode>>(new Fuse([], nodes_fuse_options))

  function updateAvailableNode(new_nodes: DocumentedNode[]) {
    nodes.value = new_nodes
    const tagged_nodes = new_nodes.map((node: DocumentedNode) => {
      if (node.max_children < 0) {
        node.node_type = 'Flow control'
      } else if (node.max_children > 0) {
        node.node_type = 'Decorator'
      } else {
        node.node_type = 'Leaf'
      }
      return node
    })
    nodes_fuse.value = new Fuse(tagged_nodes, nodes_fuse_options)
  }

  return {
    nodes,
    nodes_fuse,
    updateAvailableNode
  }
})
