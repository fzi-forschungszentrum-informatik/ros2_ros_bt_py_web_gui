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

const props = defineProps<{
  fromPackages: boolean
}>()

const emit = defineEmits<{
  (e: 'select', path: string): void
  (e: 'close'): void
}>()

// Specify valid file extensions as regex (multiple with | in the capture group)
const file_type_regex: RegExp = /\.(yaml)$/

const file_filter = ref<RegExp | undefined>(file_type_regex)

const storage_location = ref<string>('')
const selected_path = ref<string[]>([])
const is_directory = ref<boolean>(true)
const search_term = ref<string>('')

const file_path = computed<string>(() => {
  return (
    (props.fromPackages ? 'package' : 'file') +
    '://' +
    storage_location.value +
    '/' +
    selected_path.value.join('/')
  )
})

function setLoadLocation(path: string[], dir: boolean) {
  selected_path.value = path
  is_directory.value = dir
  if (dir) {
    search_term.value = ''
  }
}
</script>

<template>
  <VueFinalModal
    class="flex justify-center items-center"
    content-class="flex flex-col mt-4 mx-4 border rounded space-y-2"
    content-style="background-color: var(--bs-body-bg);"
  >
    <FileBrowser
      :file_filter="file_filter"
      :from-packages="props.fromPackages"
      :title="'Select File from ' + (props.fromPackages ? 'Package' : 'Folder')"
      :location="props.fromPackages ? 'Package' : 'Folder'"
      :search_term="search_term"
      @close="emit('close')"
      @location="(location) => (storage_location = location)"
      @select="(path, dir) => setLoadLocation(path, dir)"
    >
      <div class="d-flex justify-content-between mb-3">
        <button
          class="btn btn-primary me-2"
          :disabled="is_directory"
          @click="emit('select', file_path)"
        >
          Select
        </button>
        <select v-model="file_filter" class="form-select me-2 w-50">
          <option :value="file_type_regex">Valid files</option>
          <option :value="undefined">All files</option>
        </select>
        <div class="input-group">
          <span class="input-group-text"> Search: </span>
          <input 
            v-model="search_term" 
            type="text" 
            class="form-control" 
            placeholder="Search Folder or File"
          />
        </div>
      </div>
    </FileBrowser>
  </VueFinalModal>
</template>
