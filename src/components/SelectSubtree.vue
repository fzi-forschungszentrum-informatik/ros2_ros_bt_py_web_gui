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
import type { SetBoolRequest, SetBoolResponse } from '@/types/services/SetBool'
import { notify } from '@kyvg/vue3-notification'
import { useModal } from 'vue-final-modal'
import SelectSubtreeModal from './modals/SelectSubtreeModal.vue'
import { computed } from 'vue'
import * as uuid from 'uuid'
import { findNodeForSubtree } from '@/tree_selection'

const editor_store = useEditorStore()
const edit_node_store = useEditNodeStore()
const ros_store = useROSStore()

const publish_subtrees_id: string = 'publish_subtrees'

const subtree_name = computed<string>(() => {
  if (editor_store.selected_tree === uuid.NIL) {
    return 'Main Tree'
  }
  const subtree_node = findNodeForSubtree(
    editor_store.tree_structure_list,
    editor_store.selected_tree
  )
  if (subtree_node === undefined) {
    return 'UNKNOWN'
  }
  return subtree_node.name
})

function handlePubSubtreesChange(event: Event) {
  const target = event.target as HTMLInputElement

  if (!ros_store.connected) {
    notify({
      title: 'Service not available!',
      text: 'SetExecutionMode ROS service is not connected!',
      type: 'error'
    })
    return
  }

  ros_store.set_publish_subtrees_service.callService(
    {
      data: target.checked
    } as SetBoolRequest,
    (response: SetBoolResponse) => {
      if (response.success) {
        notify({
          title: (target.checked ? 'Enable' : 'Disable') + ' subtree publishing',
          type: 'success'
        })
        editor_store.enableSubtreePublishing(target.checked)
      } else {
        notify({
          title: 'Failed to toggle subtree publishing',
          text: response.message,
          type: 'warn'
        })
      }
    },
    (error: string) => {
      notify({
        title: 'Failed to call setPublishSubtrees service',
        text: error,
        type: 'error'
      })
    }
  )
}

const selectSubtreeModal = useModal({
  component: SelectSubtreeModal,
  attrs: {
    onClose() {
      selectSubtreeModal.close()
    }
  }
})

function openSubtreeModal() {
  if (edit_node_store.clearSelection()) {
    selectSubtreeModal.open()
  }
}
</script>

<template>
  <div class="input-group my-2">
    <label class="input-group-text"> Tree </label>

    <button class="btn btn-contrast dropdown-toggle" @click="openSubtreeModal">
      {{ subtree_name }}
    </button>

    <input
      :id="publish_subtrees_id"
      type="checkbox"
      class="btn-check"
      autocomplete="off"
      :checked="editor_store.publish_subtrees"
      @change="handlePubSubtreesChange"
    />

    <label class="btn btn-primary" :for="publish_subtrees_id" title="Publish subtrees">
      <FontAwesomeIcon
        :class="editor_store.publish_subtrees ? 'text-white' : 'text-white-50'"
        icon="fa-solid fa-bullhorn"
      />
    </label>
  </div>
</template>
