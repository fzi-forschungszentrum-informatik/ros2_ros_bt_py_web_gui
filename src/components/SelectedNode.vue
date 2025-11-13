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
import { rosToUuid, serializeNodeOptions } from '@/utils'
import { notify } from '@kyvg/vue3-notification'
import EditableNode from './EditableNode.vue'
import type { MorphNodeRequest, MorphNodeResponse } from '@/types/services/MorphNode'
import type { RemoveNodeRequest, RemoveNodeResponse } from '@/types/services/RemoveNode'
import type { SetOptionsRequest, SetOptionsResponse } from '@/types/services/SetOptions'

import { useEditorStore } from '@/stores/editor'
import { useROSStore } from '@/stores/ros'
import { useEditNodeStore } from '@/stores/edit_node'
import { removeNode } from '@/tree_manipulation'

const ros_store = useROSStore()
const editor_store = useEditorStore()
const edit_node_store = useEditNodeStore()

async function onClickDelete() {
  if (edit_node_store.selected_node === undefined) {
    console.error("Can't delete a node that doesn't exist")
    return
  }

  if (!window.confirm('Really delete node ' + edit_node_store.selected_node.name + '?')) {
    // Do nothing if user doesn't confirm
    return
  }

  await removeNode(
    rosToUuid(edit_node_store.selected_node.node_id),
    edit_node_store.selected_node.name,
    false
  )
  edit_node_store.clearSelection()
}

function onClickDeleteWithChildren() {
  if (edit_node_store.selected_node === undefined) {
    console.error("Can't delete a node that doesn't exist")
    return
  }

  if (
    !window.confirm(
      'Really delete node ' + edit_node_store.selected_node.name + ' and all of its children?'
    )
  ) {
    // Do nothing if user doesn't confirm
    return
  }

  ros_store.remove_node_service.callService(
    {
      node_id: edit_node_store.selected_node.node_id,
      remove_children: true
    } as RemoveNodeRequest,
    (response: RemoveNodeResponse) => {
      if (response.success) {
        notify({
          title:
            'Removed ' + edit_node_store.selected_node!.name + ' and its children successfully!',
          type: 'success'
        })
        edit_node_store.clearSelection()
      } else {
        notify({
          title: 'Failed to remove node ' + edit_node_store.selected_node!.name + '!',
          text: response.error_message,
          type: 'error'
        })
      }
    }
  )
}

function updateNode() {
  if (edit_node_store.selected_node === undefined) {
    console.error("Can't update a node that doesn't exist")
    return
  }
  ros_store.set_options_service.callService(
    {
      node_id: edit_node_store.selected_node.node_id,
      rename_node: true,
      new_name: edit_node_store.new_node_name,
      options: serializeNodeOptions(edit_node_store.new_node_options)
    } as SetOptionsRequest,
    (response: SetOptionsResponse) => {
      if (response.success) {
        notify({
          title: 'Updated node ' + edit_node_store.new_node_name + ' successfully!',
          type: 'success'
        })
        edit_node_store.clearNodeHasChanged()
      } else {
        notify({
          title: 'Failed to update node ' + edit_node_store.selected_node!.name + '!',
          text: response.error_message,
          type: 'error'
        })
      }
    }
  )
}

function onClickUpdate() {
  if (edit_node_store.node_is_morphed) {
    if (edit_node_store.selected_node === undefined) {
      console.error("Can't morph a node that doesn't exist")
      return
    }
    ros_store.morph_node_service.callService(
      {
        node_id: edit_node_store.selected_node.node_id,
        new_node: edit_node_store.buildNodeMsg()
      } as MorphNodeRequest,
      (response: MorphNodeResponse) => {
        if (response.success) {
          notify({
            title: 'Morphed node ' + edit_node_store.new_node_name + ' successfully!',
            type: 'success'
          })
          edit_node_store.node_is_morphed = false
          updateNode() //TODO Is updating after morphing necessary?
        } else {
          notify({
            title: 'Failed to morph node ' + edit_node_store.selected_node!.name + '!',
            text: response.error_message,
            type: 'error'
          })
        }
      }
    )
  } else {
    updateNode()
  }
}
</script>

<template>
  <div class="d-flex flex-column">
    <div class="row g-2 mb-3">
      <div class="btn-group col-4">
        <button
          class="btn btn-primary"
          :disabled="!edit_node_store.node_is_valid || editor_store.has_selected_subtree"
          @click="onClickUpdate"
        >
          Update Node
        </button>
      </div>
      <div class="btn-group col-8">
        <button
          class="btn btn-danger"
          :disabled="editor_store.has_selected_subtree"
          @click="onClickDelete"
        >
          Delete Node
        </button>
        <button
          class="btn btn-danger"
          :disabled="editor_store.has_selected_subtree"
          @click="onClickDeleteWithChildren"
        >
          Delete Node + Children
        </button>
      </div>
    </div>
    <EditableNode />
  </div>
</template>
