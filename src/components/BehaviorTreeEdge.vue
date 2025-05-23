<!--
 *  Copyright 2024 FZI Forschungszentrum Informatik
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
import type { WiringData } from '@/types/types'
import { prettyprint_type } from '@/utils'

const ros_store = useROSStore()
const editor_store = useEditorStore()
const edit_node_store = useEditNodeStore()

const edge_data = computed<WiringData | undefined>(() => {
  if (editor_store.selected_edge === undefined ||
    editor_store.current_tree.data === undefined
  ) {
    return undefined
  }
  const edge = editor_store.selected_edge
  return editor_store.current_tree.data.wiring_data.find(
    (item) => {
      const wiring = item.wiring
      return wiring.source.node_name === edge.source.node_name &&
        wiring.source.data_kind === edge.source.data_kind &&
        wiring.source.data_key === edge.source.data_key &&
        wiring.target.node_name === edge.target.node_name &&
        wiring.target.data_kind === edge.target.data_kind &&
        wiring.target.data_key === edge.target.data_key
    }
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
          title: 'Removed data edge: ' + edge.source + ' -> ' + edge.target + '!',
          type: 'success'
        })
        editor_store.unselectEdge()
      } else {
        notify({
          title: 'Failed to remove data edge: ' + edge.source + ' -> ' + edge.target + '!',
          text: response.error_message,
          type: 'error'
        })
      }
    }
  )
}
function selectSourceNode() {
  edit_node_store.editorSelectionChange(editor_store.selected_edge!.source.node_name)
}

function selectTargetNode() {
  edit_node_store.editorSelectionChange(editor_store.selected_edge!.target.node_name)
}
</script>

<template>
  <div class="d-flex flex-column">
    <div class="btn-group d-flex mb-2" role="group">
      <button class="btn btn-danger w-100" @click="() => onClickDelete()">Delete Edge</button>
    </div>
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div class="">
        <button class="btn btn-outline-contrast" @click="() => selectSourceNode()">
          <span class="text-primary">
            {{ editor_store.selected_edge!.source.node_name }}
          </span>
          <br />
          {{ editor_store.selected_edge!.source.data_key }}
        </button>
      </div>
      <hr class="flex-fill connector" />
      <div class="">
        <button class="btn btn-outline-contrast" @click="() => selectTargetNode()">
          <span class="text-primary">
            {{ editor_store.selected_edge!.target.node_name }}
          </span>
          <br />
          {{ editor_store.selected_edge!.target.data_key }}
        </button>
      </div>
    </div>
    <div v-if="edge_data !== undefined" class="mx-auto text-center">
      Value: {{ edge_data.serialized_data }}
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
