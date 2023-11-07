<script setup lang="ts">
import { useROSStore } from '@/stores/ros'
import type { ClearTreeRequest, ClearTreeResponse } from '@/types/services/ClearTree'
import { h, ref, type Ref, type VNodeRef } from 'vue'

const ros_store = useROSStore()

const fileref = ref<VNodeRef>()
fileref.value = ref(h('input'))

function newTree() {
  if (
    window.confirm(
      'Do you want to create a new tree? Warning: This will discard the tree that is loaded at the moment.'
    )
  ) {
    if (ros_store.clear_tree_service === undefined) {
      console.warn('Clear tree service undefined!')
      return
    }
    ros_store.clear_tree_service.callService(
      {} as ClearTreeRequest,
      (response: ClearTreeResponse) => {
        if (response.success) {
          console.log('called ClearTree service successfully')
        } else {
          error_store.reportError(response.error_message)
        }
      },
      (failed) => {
        error_store.reportError('Error clearing tree ' + failed)
      }
    )
  }
}

function loadFromPackage() {}

function saveToPackage() {}

function loadTree(event: Event) {}

function openFileDialog() {
  if (fileref.value === undefined) {
    console.error('Fileref is undefined!')
    return
  }
  let input_element = fileref.value as Ref<HTMLInputElement>
  input_element.value.click()
}

function saveTree() {}
</script>

<template>
  <button @click="() => newTree()" class="btn btn-primary ms-1" title="New tree">
    <font-awesome-icon icon="fa-solid fa-file" aria-hidden="true" class="show-button-icon" />
    <span class="ms-1 hide-button-text">New</span>
  </button>
  <button @click="() => loadFromPackage()" class="btn btn-primary ms-1" title="Load from package">
    <font-awesome-icon icon="fa-solid fa-folder" aria-hidden="true" class="show-button-icon" />
    <span class="ms-1 hide-button-text">Load</span>
  </button>
  <button @click="() => saveToPackage()" class="btn btn-primary ms-1" title="Save to package">
    <font-awesome-icon icon="fa-solid fa-save" aria-hidden="true" class="show-button-icon" />
    <span class="ms-1 hide-button-text">Save</span>
  </button>
  <div>
    <input v-bind:ref="fileref" type="file" class="file_input_ref" @change="loadTree" />
    <button @click="() => openFileDialog()" class="btn btn-primary ms-1" title="Upload">
      <font-awesome-icon
        icon="fa-solid fa-file-upload"
        aria-hidden="true"
        class="show-button-icon"
      />
      <span class="ms-1 hide-button-text">Upload</span>
    </button>
  </div>
  <button @click="() => saveTree()" class="btn btn-primary m-1" title="Download">
    <font-awesome-icon
      icon="fa-solid fa-file-download"
      aria-hidden="true"
      class="show-button-icon"
    />
    <span class="ms-1 hide-button-text">Download</span>
  </button>
</template>

<style lang="scss">
@import 'src/assets/utils.scss';

.file_input_ref {
  display: none;
}
</style>
