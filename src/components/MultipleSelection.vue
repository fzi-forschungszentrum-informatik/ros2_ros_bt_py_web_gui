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
