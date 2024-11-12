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
import { useROSStore } from '@/stores/ros'
import type {
  GenerateSubtreeRequest,
  GenerateSubtreeResponse
} from '@/types/services/GenerateSubtree'
import { notify } from '@kyvg/vue3-notification'
import SelectLocationModal from '@/components/modals/SelectLocationModal.vue'
import { ref } from 'vue'
import { useEditNodeStore } from '@/stores/edit_node'
import type { TreeMsg } from '@/types/types'
import { NameConflictHandler, parseConflictHandler } from '@/utils';
import type { SaveTreeRequest, SaveTreeResponse } from '@/types/services/SaveTree'

const ros_store = useROSStore()
const edit_node_store = useEditNodeStore()

let inital_name = edit_node_store.selected_node_names.join('_')
if (inital_name.length === 0) {
  inital_name = 'Subtree'
}
const name = ref<string>(inital_name)
const storage_location = ref<string>('')
const file_path = ref<string>('')
const description = ref<string>('') //TODO where to put this
const show_selection_modal = ref<boolean>(false)

const handle_name_conflict = ref<NameConflictHandler>(NameConflictHandler.ASK)

function selectSubtreeSaveLocation() {
  show_selection_modal.value = true
}

function setSaveLocation(
  location: string,
  path: string,
  handler: NameConflictHandler
) {
  show_selection_modal.value = false
  storage_location.value = location
  file_path.value = path
  handle_name_conflict.value = handler
}

function generateSubtree() {
  ros_store.generate_subtree_service.callService(
    {
      nodes: edit_node_store.selected_node_names
    } as GenerateSubtreeRequest,
    (response: GenerateSubtreeResponse) => {
      if (response.success) {
        notify({
          title: 'Generated subtree successfully!',
          type: 'success'
        })
        console.log(response.tree)
        saveSubtree(response.tree)
      } else {
        notify({
          title: 'Failed to generate subtree !',
          text: response.error_message,
          type: 'error'
        })
      }
    }
  )
}

function saveSubtree(tree: TreeMsg) {

  tree.name = name.value

  const [allow_overwrite, allow_rename] = 
    parseConflictHandler(handle_name_conflict.value)
  
  const save_tree_request: SaveTreeRequest = {
    storage_path: storage_location.value,
    filepath: file_path.value,
    tree: tree,
    allow_overwrite: allow_overwrite,
    allow_rename: allow_rename
  }
  
  ros_store.save_tree_service.callService(
    save_tree_request,
  (response: SaveTreeResponse) => {
    if (response.success) {
      notify({
        title: 'Successfully saved subtree!',
        text: response.file_path,
        type: 'success'
      })
    } else {

      if (handle_name_conflict.value !== NameConflictHandler.ASK ||
        response.error_message !== "Overwrite not allowed"
      ) {
        notify({
          title: 'Failed to save subtree!',
          text: response.error_message,
          type: 'warn'
        })
        return
      }

      if (!window.confirm(
        "Do you want to overwrite '" + storage_location.value + "/" + file_path.value + "' ?"
      )) {
        notify({
          title: 'Failed to save tree!',
          text: "Rejected overwrite confirmation",
          type: 'warn'
        })
        return
      }
      
      save_tree_request.allow_overwrite = true
      save_tree_request.allow_rename = false
      ros_store.save_tree_service.callService(
        save_tree_request,
      (response: SaveTreeResponse) => {
        if (response.success) {
          notify({
            title: 'Successfully saved subtree!',
            text: response.file_path,
            type: 'success'
          })
        } else {
          notify({
            title: 'Failed to save subtree!',
            text: response.error_message,
            type: 'warn'
          })
        }
      },
      (error: string) => {
        notify({
          title: 'Failed to call SaveTree service!',
          text: error,
          type: 'error'
        })
      })
    }
  },
  (error: string) => {
    notify({
      title: 'Failed to call SaveTree service!',
      text: error,
      type: 'error'
    })
  })
}

</script>

<template>
  <SelectLocationModal
    v-model="show_selection_modal"
    title="Select Save Location"
    @close="show_selection_modal = false"
    @select="setSaveLocation"
  />
  <div class="d-flex flex-column">
    <div class="btn-group mb-3" role="group">
      <button class="btn btn-primary" @click="selectSubtreeSaveLocation">
        Select Location
      </button>
      <button class="btn btn-primary" @click="generateSubtree"
      :disabled="storage_location === '' || file_path === ''">
        Save Subtree
      </button>
    </div>

    <div class="input-group mb-3">
      <span class="input-group-text">Location:</span>
      <input
        class="form-control overflow-x-auto"
        type="text"
        :value="storage_location"
        placeholder="Storage Folder"
        aria-label="SubreeFilepath"
        aria-describedby="subtree-filepath"
        disabled="true"
      />
      <input
        class="form-control overflow-x-auto"
        type="text"
        :value="file_path"
        placeholder="Filepath"
        aria-label="SubreeFilepath"
        aria-describedby="subtree-filepath"
        disabled="true"
      />
    </div>

    <div class="d-flex flex-column">
      <div class="input-group mb-3">
        <span class="input-group-text">Name:</span>
        <input
          class="form-control"
          type="text"
          v-model="name"
          placeholder="Name"
          aria-label="SubreeName"
          aria-describedby="subtree-name"
        />
      </div>

      <div class="input-group mb-3">
        <span class="input-group-text">Description:</span>
        <input
          class="form-control"
          type="text"
          :value="description"
          placeholder="Description"
          aria-label="SubreeDescription"
          aria-describedby="subtree-description"
          disabled="true"
        />
      </div>
    </div>
  </div>
</template>
