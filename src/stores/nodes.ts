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
import type { DocumentedNode } from '@/types/types'
import Fuse from 'fuse.js'
import { defineStore } from 'pinia'
import { shallowRef } from 'vue'
import { useROSStore } from './ros'
import type {
  GetAvailableNodesRequest,
  GetAvailableNodesResponse
} from '@/types/services/GetAvailableNodes'
import { notify } from '@kyvg/vue3-notification'

export const useNodesStore = defineStore('nodes', () => {
  const ros_store = useROSStore()

  const nodes_fuse_options = {
    shouldSort: true,
    threshold: 0.3,
    location: 0,
    distance: 20,
    maxPatternLength: 100,
    minMatchCharLength: 1,
    keys: ['node_class', 'node_type', 'module', 'tags'],
    ignoreLocation: true,
    useExtendedSearch: true
  }
  const nodes = shallowRef<DocumentedNode[]>([])
  const nodes_fuse = shallowRef<Fuse<DocumentedNode>>(new Fuse([], nodes_fuse_options))

  const filtered_nodes = shallowRef<DocumentedNode[]>([])

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

  function filterNodes(filter: string) {
    if (filter === '') {
      filtered_nodes.value = []
      return
    }
    filtered_nodes.value = nodes_fuse.value.search(filter).map((x) => x.item)
  }

  function clearFilteredNodes() {
    filtered_nodes.value = []
  }

  function getNodes(package_name: string) {
    ros_store.get_available_nodes_service.callService(
      {
        node_modules: [package_name]
      } as GetAvailableNodesRequest,
      (response: GetAvailableNodesResponse) => {
        if (response.success) {
          updateAvailableNode(response.available_nodes)
          notify({
            title: 'Updated available BT nodes!',
            type: 'success'
          })
        } else {
          notify({
            title: 'Failed to update available BT nodes!',
            text: response.error_message,
            type: 'error'
          })
        }
      },
      (failed: string) => {
        notify({
          title: 'Failed to call GetAvailableNodes service!',
          text: failed,
          type: 'error'
        })
      }
    )
  }

  return {
    nodes,
    nodes_fuse,
    filtered_nodes,
    updateAvailableNode,
    filterNodes,
    clearFilteredNodes,
    getNodes
  }
})
