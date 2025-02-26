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
import { VueFinalModal } from 'vue-final-modal'
import FileBrowser from './FileBrowser.vue'
import { computed, ref } from 'vue'
import { useROSStore } from '@/stores/ros'
import type { SaveTreeRequest, SaveTreeResponse } from '@/types/services/SaveTree'
import { useEditorStore } from '@/stores/editor'
import { notify } from '@kyvg/vue3-notification'
import { NameConflictHandler, parseConflictHandler } from '@/utils'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const ros_store = useROSStore()
const editor_store = useEditorStore()

// Specify valid file extensions as regex (multiple with | in the capture group)
const file_type_regex: RegExp = /\.(yaml)$/

const file_filter = ref<RegExp | undefined>(file_type_regex)

const storage_location = ref<string>('')
const selected_path = ref<string[]>([])
const is_directory = ref<boolean>(true)
const input_file_name = ref<string>('')

const file_path = computed<string>(() => {
  if (is_directory.value) {
    return [...selected_path.value, input_file_name.value].join('/')
  } else {
    return [...selected_path.value.slice(0, -1), input_file_name.value].join('/')
  }
})

function setSaveLocation(path: string[], dir: boolean) {
  selected_path.value = path
  is_directory.value = dir
  if (dir) {
    input_file_name.value = ''
  } else {
    input_file_name.value = path[path.length - 1]
  }
}

const handle_name_conflict = ref<NameConflictHandler>(NameConflictHandler.ASK)

function saveTree() {
  if (!file_type_regex.test(file_path.value)) {
    //This should never happen, since the Save button is disabled on invalid filenames
    console.error('Path is of improper format: ', file_path)
    return
  }

  if (editor_store.tree === undefined) {
    console.error('No tree to save')
    return
  }

  const [allow_overwrite, allow_rename] = parseConflictHandler(handle_name_conflict.value)

  const save_tree_request: SaveTreeRequest = {
    storage_path: storage_location.value,
    filepath: file_path.value,
    tree: editor_store.tree,
    allow_overwrite: allow_overwrite,
    allow_rename: allow_rename
  }

  ros_store.save_tree_service.callService(
    save_tree_request,
    (response: SaveTreeResponse) => {
      if (response.success) {
        notify({
          title: 'Successfully saved tree!',
          text: response.file_path,
          type: 'success'
        })
        emit('close')
      } else {
        if (
          handle_name_conflict.value !== NameConflictHandler.ASK ||
          response.error_message !== 'Overwrite not allowed'
        ) {
          notify({
            title: 'Failed to save tree!',
            text: response.error_message,
            type: 'warn'
          })
          return
        }

        if (
          !window.confirm(
            "Do you want to overwrite '" + storage_location.value + '/' + file_path.value + "' ?"
          )
        ) {
          notify({
            title: 'Failed to save tree!',
            text: 'Rejected overwrite confirmation',
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
                title: 'Successfully saved tree!',
                text: response.file_path,
                type: 'success'
              })
              emit('close')
            } else {
              notify({
                title: 'Failed to save tree!',
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
          }
        )
      }
    },
    (error: string) => {
      notify({
        title: 'Failed to call SaveTree service!',
        text: error,
        type: 'error'
      })
    }
  )
}
</script>

<template>
  <VueFinalModal
    class="flex justify-center items-center"
    content-class="flex flex-col mt-4 mx-4 border rounded space-y-2"
    content-style="background-color: var(--bs-body-bg);"
  >
    <FileBrowser
      location="Folder"
      title="Save Tree to Folder"
      @close="emit('close')"
      :file_filter="file_filter"
      :search_term="input_file_name"
      @location="(location) => (storage_location = location)"
      @select="(path, dir) => setSaveLocation(path, dir)"
    >
      <div class="d-flex justify-content-between mb-3">
        <button
          class="btn btn-primary me-2"
          @click="saveTree"
          :disabled="!file_type_regex.test(input_file_name)"
        >
          Save
        </button>
        <select v-model="file_filter" class="form-select me-2">
          <option :value="file_type_regex">Valid files</option>
          <option :value="undefined">All files</option>
        </select>
        <select v-model="handle_name_conflict" class="form-select">
          <option v-for="opt in Object.values(NameConflictHandler)" :value="opt" :key="opt">
            {{ opt }}
          </option>
        </select>
      </div>
      <div class="input-group mb-3">
        <span class="input-group-text"> Name: </span>
        <input 
          v-model="input_file_name" 
          type="text" 
          class="form-control" 
          placeholder="Name of File to Save (also acts as a search bar)"
        />
      </div>
    </FileBrowser>
  </VueFinalModal>
</template>
