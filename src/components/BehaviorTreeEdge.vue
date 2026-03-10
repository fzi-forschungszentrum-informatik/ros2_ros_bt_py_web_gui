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
import { useEditorStore } from '@/stores/editor'
import { useEditNodeStore } from '@/stores/edit_node'
import { useROSStore } from '@/stores/ros'
import type { WireNodeDataRequest, WireNodeDataResponse } from '@/types/services/WireNodeData'
import { notify } from '@kyvg/vue3-notification'
import { computed } from 'vue'
import type { NodeStructure, WiringData } from '@/types/types'
import { prettyprint_type, rosToUuid, prettyprint_value, replaceNameIdParts } from '@/utils'
import {
  findNodeInTreeList,
  findWiringInTreeList,
  getNodeStructures,
  getWiringData
} from '@/tree_selection'

const ros_store = useROSStore()
const editor_store = useEditorStore()
const edit_node_store = useEditNodeStore()

const source_node = computed<NodeStructure | undefined>(() => {
  if (editor_store.selected_edge === undefined) {
    return
  }
  return findNodeInTreeList(
    editor_store.tree_structure_list,
    getNodeStructures,
    editor_store.selected_edge_tree_id,
    rosToUuid(editor_store.selected_edge.source.node_id)
  )
})

const source_name = computed<string>(() => {
  if (source_node.value === undefined) {
    return ''
  }
  return source_node.value.name
})

const source_key = computed<string>(() => {
  if (editor_store.selected_edge === undefined) {
    return ''
  }
  if (source_node.value === undefined) {
    return editor_store.selected_edge.source.data_key
  }
  return replaceNameIdParts(source_node.value.tree_ref, editor_store.selected_edge.source.data_key)
})

const target_node = computed<NodeStructure | undefined>(() => {
  if (editor_store.selected_edge === undefined) {
    return
  }
  return findNodeInTreeList(
    editor_store.tree_structure_list,
    getNodeStructures,
    editor_store.selected_edge_tree_id,
    rosToUuid(editor_store.selected_edge.target.node_id)
  )
})

const target_name = computed<string>(() => {
  if (target_node.value === undefined) {
    return ''
  }
  return target_node.value.name
})

const target_key = computed<string>(() => {
  if (editor_store.selected_edge === undefined) {
    return ''
  }
  if (target_node.value === undefined) {
    return editor_store.selected_edge.target.data_key
  }
  return replaceNameIdParts(target_node.value.tree_ref, editor_store.selected_edge.target.data_key)
})

const edge_data = computed<WiringData | undefined>(() => {
  if (editor_store.selected_edge === undefined) {
    return undefined
  }
  return findWiringInTreeList(
    editor_store.tree_data_list,
    getWiringData,
    editor_store.selected_edge_tree_id,
    editor_store.selected_edge
  )
})

function onClickDelete() {
  const edge = editor_store.selected_edge!
  ros_store.unwire_data_service.callService(
    {
      wirings: [
        {
          source: edge.source,
          target: edge.target
        }
      ]
    } as WireNodeDataRequest,
    (response: WireNodeDataResponse) => {
      if (response.success) {
        notify({
          title: 'Removed data edge: ' + source_name.value + ' -> ' + target_name.value + '!',
          type: 'success'
        })
        editor_store.unselectEdge()
      } else {
        notify({
          title:
            'Failed to remove data edge: ' + source_name.value + ' -> ' + target_name.value + '!',
          text: response.error_message,
          type: 'warn'
        })
      }
    },
    (error: string) => {
      notify({
        title: 'Failed to call UnwireNodeData service',
        text: error,
        type: 'error'
      })
    }
  )
}

function selectSourceNode() {
  edit_node_store.editorSelectionChange(
    editor_store.selected_edge_tree_id,
    rosToUuid(editor_store.selected_edge!.source.node_id)
  )
}

function selectTargetNode() {
  edit_node_store.editorSelectionChange(
    editor_store.selected_edge_tree_id,
    rosToUuid(editor_store.selected_edge!.target.node_id)
  )
}
</script>

<template>
  <div class="d-flex flex-column">
    <div class="btn-group d-flex mb-2" role="group">
      <button
        class="btn btn-danger w-100"
        :disabled="editor_store.has_selected_subtree"
        @click="() => onClickDelete()"
      >
        Delete Edge
      </button>
    </div>
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div class="">
        <button class="btn btn-outline-contrast" @click="() => selectSourceNode()">
          <span class="text-primary">{{ source_name }}</span
          ><br />
          {{ source_key }}
        </button>
      </div>
      <hr class="flex-fill connector" />
      <div class="">
        <button class="btn btn-outline-contrast" @click="() => selectTargetNode()">
          <span class="text-primary">{{ target_name }}</span
          ><br />
          {{ target_key }}
        </button>
      </div>
    </div>
    <div v-if="edge_data !== undefined" class="mx-auto text-center">
      Value: {{ prettyprint_value(edge_data.serialized_data) }}
      <br />
      of type: {{ prettyprint_type(edge_data.serialized_type) }}
      <br />
      expected type: {{ prettyprint_type(edge_data.serialized_expected_type) }}
    </div>
  </div>
</template>

<style scoped lang="scss">
hr.connector {
  border: none;
  height: 3px;
  color: var(--bs-body-color);
  background-color: var(--bs-body-color);
  opacity: 1;
}
</style>
