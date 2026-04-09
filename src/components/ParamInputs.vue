<!--
 *  Copyright 2024-2026 FZI Forschungszentrum Informatik
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
import { computed, watch } from 'vue'
import { useEditNodeStore } from '@/stores/edit_node'
import type { NodeData } from '@/types/editor_types'
import ParamTypeMultiplexer from './param_inputs/ParamTypeMultiplexer.vue'
import { useEditorStore } from '@/stores/editor'
import { findTree, findNode } from '@/tree_selection'
import type { Wiring, NodeDataLocation } from '@/types/data_types'
import type { TreeStructure } from '@/types/types'
import { replaceNameIdParts, compareRosUuid } from '@/utils'

const props = defineProps<{
  data_key: string
}>()

const editor_store = useEditorStore()
const edit_node_store = useEditNodeStore()

const param = computed<NodeData | undefined>(() =>
  edit_node_store.new_node_inputs.find((x) => x.key === props.data_key)
)
watch(
  () => {
    if (param.value === undefined) {
      return undefined
    }
    return param.value.type.is_static
  },
  (is_static: boolean | undefined) => {
    if (param.value === undefined) {
      return
    }
    if (is_static && param.value.serialized_value === '') {
      param.value.serialized_value = param.value.type.getSerializedDefault()
    }
  }
)

const display_key = computed<string>(() => {
  if (param.value === undefined) {
    return ''
  }
  if (edit_node_store.selected_node === undefined) {
    return param.value.key
  }
  return replaceNameIdParts(edit_node_store.selected_node.tree_ref, param.value.key)
})

const containing_tree = computed<TreeStructure | undefined>(() => {
  if (edit_node_store.selected_node === undefined) {
    return undefined
  }
  return findTree(editor_store.tree_structure_list, edit_node_store.selected_node_tree_id)
})

const connected_edges = computed<Wiring[]>(() => {
  if (containing_tree.value === undefined) {
    return []
  }
  return containing_tree.value.data_wirings.filter((wiring) => matchEndpoint(wiring.target))
})

function matchEndpoint(endpoint: NodeDataLocation): boolean {
  if (edit_node_store.selected_node === undefined) {
    return false
  }
  return (
    endpoint.data_key === props.data_key &&
    compareRosUuid(endpoint.node_id, edit_node_store.selected_node.node_id)
  )
}

function printOtherEndpoint(wiring: Wiring): string {
  if (containing_tree.value === undefined) {
    return 'Other Endpoint'
  }
  const endpoint = wiring.source
  const node = findNode(containing_tree.value.nodes, endpoint.node_id)
  if (node === undefined) {
    return 'Other Endpoint'
  }
  return node.name + '.' + endpoint.data_key
}
</script>

<template>
  <div v-if="param !== undefined" class="list-group-item">
    <div class="d-flex justify-content-between mb-1">
      <label>
        {{ display_key }}
      </label>
      <div class="form-check">
        <input
          v-model="param.type.is_static"
          type="checkbox"
          class="form-check-input"
          :disabled="!param.type.allow_dynamic || !param.type.allow_static"
        />
        <label class="form-check-label">Static</label>
      </div>
    </div>
    <div v-if="param.type.is_static">
      <ParamTypeMultiplexer v-model="param.serialized_value" :type="param.type" />
    </div>
    <div v-else-if="connected_edges" class="d-flex flex-wrap m-1">
      <button
        v-for="edge in connected_edges"
        class="btn btn-outline-primary m-1"
        @click="editor_store.selectEdge(containing_tree!.tree_id, edge)"
      >
        {{ printOtherEndpoint(edge) }}
      </button>
    </div>
    <div class="form-text">{{ param.type.prettyprint() }}</div>
  </div>
  <div v-else>Error loading param data</div>
</template>
