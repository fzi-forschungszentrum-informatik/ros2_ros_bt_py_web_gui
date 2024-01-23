/*
 * Copyright 2024 FZI Forschungszentrum Informatik
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
<script setup lang="ts">
import { useEditorStore } from '@/stores/editor'
import { useROSStore } from '@/stores/ros'
import type {
  GenerateSubtreeRequest,
  GenerateSubtreeResponse
} from '@/types/services/GenerateSubtree'
import { notify } from '@kyvg/vue3-notification'
import SelectSaveFileModal from '@/components/modals/SelectSaveFileModal.vue'
import { ref } from 'vue'

const ros_store = useROSStore()
const editor_store = useEditorStore()

let inital_name = editor_store.selected_node_names.join('_')
if (inital_name.length === 0) {
  inital_name = 'Subtree'
}
const name = ref<string>(inital_name)
const filepath = ref<string>('')
const description = ref<string>('')
const path_selected = ref<boolean>(false)
const show_selection_modal = ref<boolean>(false)

function onClickCreateSubtree() {
  ros_store.generate_subtree_service.callService(
    {
      nodes: editor_store.selected_node_names
    } as GenerateSubtreeRequest,
    (response: GenerateSubtreeResponse) => {
      if (response.success) {
        notify({
          title: 'Generated subtree ' + response.tree.name + ' successfully!',
          type: 'success'
        })
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

function selectSubtreeSaveLocation() {
  show_selection_modal.value = true
}

function setSaveLocation(new_save_location: string) {
  show_selection_modal.value = false
  if (new_save_location !== '') {
    path_selected.value = true
    filepath.value = new_save_location
  } else {
    path_selected.value = false
  }
}
</script>

<template>
  <SelectSaveFileModal
    v-model="show_selection_modal"
    title="Select Save Location"
    @save="(file_url: string) => setSaveLocation(file_url)"
  />
  <div class="d-flex flex-column">
    <div class="btn-group d-flex mb-2" role="group">
      <button class="btn btn-primary w-30" @click="onClickCreateSubtree" :disabled="path_selected">
        Generate subtree from selection
      </button>
      <button class="btn btn-primary w-30" @click="selectSubtreeSaveLocation">
        Select Subtree Save Location
      </button>
    </div>
    <div class="d-flex flex-column">
      <div class="input-group mb-3">
        <span class="input-group-text" id="subtree-name">Subtree Name</span>
        <input
          class="form-control"
          type="text"
          :value="name"
          placeholder="Name"
          aria-label="SubreeName"
          aria-describedby="subtree-name"
          disabled="true"
        />
      </div>

      <div class="input-group mb-3">
        <span class="input-group-text" id="subtree-description">Subtree Description</span>
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
      <div class="input-group mb-3">
        <span class="input-group-text" id="subtree-filepath">Subtree Filepath</span>
        <input
          class="form-control"
          type="text"
          :value="filepath"
          placeholder="Filepath"
          aria-label="SubreeFilepath"
          aria-describedby="subtree-filepath"
          disabled="true"
        />
      </div>
    </div>
  </div>
</template>
