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
import type { ChangeTreeNameRequest, ChangeTreeNameResponse } from '@/types/services/ChangeTreeName'
import { notify } from '@kyvg/vue3-notification'
import { computed, ref } from 'vue'

const editor_store = useEditorStore()
const ros_store = useROSStore()

const tree_name = computed<string>(() => {
  if (editor_store.selected_subtree.is_subtree) {
    return editor_store.selected_subtree.name
  } else if (editor_store.tree) {
    return editor_store.tree.name
  } else {
    return ''
  }
})

const new_tree_name = ref<string>(tree_name.value)

const tree_state = computed<string>(() => {
  if (editor_store.selected_subtree.is_subtree) {
    return editor_store.selected_subtree.tree!.state
  } else if (editor_store.tree) {
    return editor_store.tree.state
  } else {
    return 'UNKNOWN'
  }
})

function renameTree(): void {
  console.log(new_tree_name.value)
  ros_store.change_tree_name_service.callService(
    {
      name: new_tree_name.value
    } as ChangeTreeNameRequest,
    (response: ChangeTreeNameResponse) => {
      if (response.success) {
        notify({
          title: 'Successfully renamed tree!',
          text: new_tree_name.value,
          type: 'success'
        })
      } else {
        notify({
          title: 'Failed to rename tree!',
          text: response.error_message,
          type: 'warn'
        })
      }
    },
    (error: string) => {
      notify({
        title: 'Failed to call ChangeTreeName service!',
        text: error,
        type: 'error'
      })
    }
  )
}
</script>

<template>
  <div class="d-flex align-items-center my-2">
    <div class="input-group me-1">
      <label class="input-group-text" for="treeNameForm"> Name </label>
      <input
        id="treeNameForm"
        class="form-control"
        type="text"
        :disabled="editor_store.selected_subtree.is_subtree"
        :value="tree_name"
        @input="(event: Event) => (new_tree_name = (event.target as HTMLInputElement).value)"
      />
      <button
        class="btn btn-primary"
        :disabled="editor_store.selected_subtree.is_subtree"
        @click="renameTree"
      >
        Save
      </button>
    </div>
    <div class="input-group ms-1" style="width: fit-content">
      <label class="input-group-text" for="treeStateForm"> State </label>
      <input
        id="treeStateForm"
        class="form-control"
        type="text"
        disabled="true"
        :value="tree_state"
      />
    </div>
  </div>
</template>
