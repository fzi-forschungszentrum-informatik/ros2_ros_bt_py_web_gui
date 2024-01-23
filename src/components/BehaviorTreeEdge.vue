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
import { useROSStore } from '@/stores/ros'
import type { WireNodeDataRequest, WireNodeDataResponse } from '@/types/services/WireNodeData'
import { notify } from '@kyvg/vue3-notification'

const ros_store = useROSStore()
const editor_store = useEditorStore()

function onClickDelete() {
  const edge = editor_store.selected_edge!
  editor_store.unselectEdge()
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
  editor_store.editorSelectionChange(editor_store.selected_edge!.source.node_name)
}

function selectTargetNode() {
  editor_store.editorSelectionChange(editor_store.selected_edge!.target.node_name)
}
</script>

<template>
  <div class="d-flex flex-column">
    <div class="btn-group d-flex mb-2" role="group">
      <button class="btn btn-danger w-100" @click="() => onClickDelete()">Delete Edge</button>
    </div>
    <div class="row">
      <div class="col">
        <a href="#" class="text-primary" @click="() => selectSourceNode()">
          {{ editor_store.selected_edge!.source.node_name }}
        </a>
        <span>{{ editor_store.selected_edge!.source.data_kind }}.</span>
        <span>{{ editor_store.selected_edge!.source.data_key }}</span>
      </div>
      <div class="col">
        <span aria-hidden="true" class="fas fa-lg fa-long-arrow-alt-right" />
        <span class="sr-only">is connected to</span>
      </div>
      <div class="col">
        <a href="#" class="text-primary" @click="() => selectTargetNode()">
          {{ editor_store.selected_edge!.target.node_name }}
        </a>
        <span>{{ editor_store.selected_edge!.target.data_kind }}</span>
        <span>{{ editor_store.selected_edge!.target.data_key }}</span>
      </div>
    </div>
  </div>
</template>
