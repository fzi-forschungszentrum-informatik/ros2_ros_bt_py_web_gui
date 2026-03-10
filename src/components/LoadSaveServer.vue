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
import { useROSStore } from '@/stores/ros'
import type { ClearTreeRequest, ClearTreeResponse } from '@/types/services/ClearTree'
import { notify } from '@kyvg/vue3-notification'
import { useModal } from 'vue-final-modal'
import * as uuid from 'uuid'
import SaveFileModal from './modals/SaveFileModal.vue'
import LoadFileModal from './modals/LoadFileModal.vue'
import { useEditorStore } from '@/stores/editor'
import { computed, onMounted, ref } from 'vue'
import type {
  GetStorageFoldersRequest,
  GetStorageFoldersResponse
} from '@/types/services/GetStorageFolders'
import type { SaveTreeRequest, SaveTreeResponse } from '@/types/services/SaveTree'
import { findTree } from '@/tree_selection'

const ros_store = useROSStore()
const editor_store = useEditorStore()

const storage_folders = ref<string[]>([])

const quick_save_location = computed<[string, string]>(() => {
  let quick_save_path = editor_store.quick_save_location
  const tree = findTree(editor_store.tree_structure_list, uuid.NIL)
  if (quick_save_path === '' && tree !== undefined) {
    quick_save_path = tree.path
  }
  if (quick_save_path === '' || !quick_save_path.startsWith('file://')) {
    return ['', '']
  }
  quick_save_path = quick_save_path.replace('file://', '')
  const location = storage_folders.value.find((loc) => quick_save_path.startsWith(loc + '/'))
  if (location === undefined) {
    return ['', '']
  }
  return [location, quick_save_path.replace(location + '/', '')]
})

const quick_save_disable = computed<boolean>(() => {
  return quick_save_location.value[0] === '' || quick_save_location.value[1] === ''
})

const loadPackageModalHandle = useModal({
  component: LoadFileModal,
  attrs: {
    fromPackages: true,
    onClose() {
      loadPackageModalHandle.close()
    }
  }
})

const loadFileModalHandle = useModal({
  component: LoadFileModal,
  attrs: {
    fromPackages: false,
    onClose() {
      loadFileModalHandle.close()
    }
  }
})

const saveFileModalHandle = useModal({
  component: SaveFileModal,
  attrs: {
    onClose() {
      saveFileModalHandle.close()
    }
  }
})

function newTree() {
  if (ros_store.clear_tree_service === undefined) {
    notify({
      title: 'Service not available!',
      text: 'ClearTree ROS service not available.',
      type: 'error'
    })
    return
  }
  if (
    window.confirm(
      'Do you want to create a new tree? Warning: This will discard the tree that is loaded at the moment.'
    )
  ) {
    ros_store.clear_tree_service.callService(
      {} as ClearTreeRequest,
      (response: ClearTreeResponse) => {
        if (response.success) {
          console.log('called ClearTree service successfully')
          notify({
            title: 'Created new tree successfully!',
            type: 'success'
          })
          editor_store.resetQuickSaveLocation()
        } else {
          notify({
            title: 'Could not create new tree!',
            type: 'warn',
            text: response.error_message
          })
        }
      },
      (failed) => {
        notify({
          title: 'ClearTree service call failed!',
          type: 'error',
          text: failed
        })
      }
    )
  }
}

function loadFromPackage() {
  loadPackageModalHandle.open()
}

function loadFromFile() {
  loadFileModalHandle.open()
}

function saveToFile() {
  saveFileModalHandle.open()
}

function quickSave() {
  if (quick_save_disable.value) {
    return
  }
  if (
    !window.confirm(
      `Do you want to overwrite ${quick_save_location.value[0]}/${quick_save_location.value[1]}?`
    )
  ) {
    return
  }
  const tree = findTree(editor_store.tree_structure_list, uuid.NIL)
  ros_store.save_tree_service.callService(
    {
      storage_path: quick_save_location.value[0],
      filepath: quick_save_location.value[1],
      tree: tree,
      allow_overwrite: true,
      allow_rename: false
    } as SaveTreeRequest,
    (response: SaveTreeResponse) => {
      if (response.success) {
        notify({
          title: 'Successfully saved tree to',
          text: response.file_path,
          type: 'success'
        })
      } else {
        notify({
          title: 'Quick save failed',
          text: response.error_message,
          type: 'warn'
        })
      }
    },
    (error: string) => {
      notify({
        title: 'Failed to call SaveTree service',
        text: error,
        type: 'error'
      })
    }
  )
}

function getStorageFolders() {
  ros_store.get_storage_folders_service.callService(
    {} as GetStorageFoldersRequest,
    (response: GetStorageFoldersResponse) => {
      storage_folders.value = response.storage_folders
    },
    (error: string) => {
      notify({
        title: 'Failed to call GetStorageFolders service!',
        text: error,
        type: 'error'
      })
    }
  )
}

onMounted(() => {
  getStorageFolders()
})
</script>

<template>
  <button
    class="btn btn-primary"
    title="New tree"
    :disabled="editor_store.has_selected_subtree"
    @click="newTree"
  >
    <FontAwesomeIcon icon="fa-solid fa-file" aria-hidden="true" />
    <span class="ms-1 hide-button-text">New</span>
  </button>
  <div class="btn-group btn-spaced" role="group">
    <button
      id="btnGroupDrop1"
      type="button"
      class="btn btn-primary dropdown-toggle"
      data-bs-toggle="dropdown"
      aria-expanded="false"
      :disabled="editor_store.has_selected_subtree"
    >
      <FontAwesomeIcon icon="fa-solid fa-folder" aria-hidden="true" />
      <span class="ms-1 hide-button-text">Load</span>
    </button>
    <ul class="dropdown-menu" aria-labelledby="btnGroupDrop1">
      <li>
        <button
          class="dropdown-item btn btn-primary"
          title="Load from package"
          :disabled="editor_store.has_selected_subtree"
          @click="loadFromPackage"
        >
          <FontAwesomeIcon icon="fa-solid fa-folder-tree" aria-hidden="true" />
          <span class="ms-1">Package</span>
        </button>
      </li>
      <li>
        <button
          class="dropdown-item btn btn-primary"
          title="Load from file"
          :disabled="editor_store.has_selected_subtree"
          @click="loadFromFile"
        >
          <FontAwesomeIcon icon="fa-solid fa-folder-open" aria-hidden="true" />
          <span className="ms-1">File</span>
        </button>
      </li>
    </ul>
  </div>
  <button
    class="btn btn-primary btn-spaced"
    title="Quick Save to remote"
    :disabled="editor_store.has_selected_subtree || quick_save_disable"
    @click="quickSave"
  >
    <!--<FontAwesomeIcon icon="fa-regular fa-save" />-->
    <FontAwesomeIcon icon="fa-solid fa-bookmark" />
    <span class="ms-1 hide-button-text">Quick Save</span>
  </button>
  <button
    class="btn btn-primary btn-spaced"
    title="Save to remote"
    :disabled="editor_store.has_selected_subtree"
    @click="saveToFile"
  >
    <FontAwesomeIcon icon="fa-solid fa-save" aria-hidden="true" />
    <span class="ms-1 hide-button-text">Save</span>
  </button>
</template>
