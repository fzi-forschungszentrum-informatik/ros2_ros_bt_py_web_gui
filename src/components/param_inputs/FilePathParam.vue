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
import { useEditNodeStore } from '@/stores/edit_node'
import type { ParamData } from '@/types/types'
import { computed, ref } from 'vue'
import SelectFileModal from '../modals/SelectFileModal.vue'
import type { PyFilePath } from '@/types/python_types'

const edit_node_store = useEditNodeStore()

const props = defineProps<{
  category: 'options'
  data_key: string
}>()

const param = computed<ParamData | undefined>(() =>
  edit_node_store.new_node_options.find((x) => x.key === props.data_key)
)

const show_selection_modal = ref<boolean>(false)
const from_packages = ref<boolean>(false)

function showPackageModal() {
  from_packages.value = true
  show_selection_modal.value = true
}

function showFileModal() {
  from_packages.value = false
  show_selection_modal.value = true
}

function selectFile(path: string) {
  if (param.value === undefined) {
    console.error('Undefined parameter')
    return
  }

  let file_path_obj = param.value.value.value as PyFilePath
  file_path_obj.path = path

  edit_node_store.updateParamValue(param.value.value.type, param.value.key, file_path_obj)

  show_selection_modal.value = false
}
</script>

<template>
  <SelectFileModal
    v-model="show_selection_modal"
    :from-packages="from_packages"
    @close="show_selection_modal = false"
    @select="selectFile"
  />
  <div v-if="param !== undefined" class="form-group">
    <label class="d-block">
      {{ param.key }}
    </label>
    <div class="input-group">
      <input
        type="text"
        class="form-control"
        :value="(param.value.value as PyFilePath).path"
        disabled
      />
      <button class="btn btn-primary" @click="showPackageModal">
        <font-awesome-icon icon="fa-solid fa-folder-tree" aria-hidden="true" />
        <span class="ms-1">Package</span>
      </button>
      <button class="btn btn-primary" @click="showFileModal">
        <font-awesome-icon icon="fa-solid fa-folder-open" aria-hidden="true" />
        <span className="ms-1">File</span>
      </button>
    </div>
  </div>
  <div v-else>Error loading param data</div>
</template>
