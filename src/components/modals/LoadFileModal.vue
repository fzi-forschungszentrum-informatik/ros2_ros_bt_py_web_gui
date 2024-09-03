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
import { ref } from 'vue';

const emit = defineEmits<{
  (e: 'close'): void
}>()

// Specify valid file extensions as regex (multiple with | in the capture group)
const file_type_regex: RegExp = new RegExp("\.(yaml)")

const file_filter = ref<RegExp | undefined>(file_type_regex)

</script>

<template>
  <VueFinalModal
    class="flex justify-center items-center"
    content-class="flex flex-col mt-4 mx-4 bg-white border rounded space-y-2"
  >
    <FileBrowser location="Folder" title="Load Tree from Folder" @close="emit('close')"
    @select="(path, dir) => console.log('Selected ', (dir ? 'directory' : 'file'), ': ', path)"
    @input="(input) => console.log('Typed: ', input)">
      <button class="btn btn-primary me-2">Load</button>
      <select v-model="file_filter" class="form-select">
        <option :value="file_type_regex">Valid files</option>
        <option :value="undefined">All files</option>
      </select>
    </FileBrowser>
  </VueFinalModal>
</template>
