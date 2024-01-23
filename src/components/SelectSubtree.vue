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
import { computed } from 'vue'

const editor_store = useEditorStore()

function onChange(event: Event) {
  const target = event.target as HTMLSelectElement
  const value = parseInt(target.value)
  if (value < 0) {
    editor_store.selectSubtree('', false)
  } else {
    editor_store.selectSubtree(editor_store.subtree_names[value], true)
  }
}

const selected_name = computed<string>(() => {
  if (editor_store.selected_subtree.is_subtree) {
    return editor_store.selected_subtree.name
  } else {
    return 'main'
  }
})
</script>

<template>
  <div class="d-flex flex-row align-items-center">
    <label class="col-form-label m-1 ms-2" for="formTree"> Tree: </label>

    <select
      id="formTree"
      class="form-select m-2"
      :value="editor_store.subtree_names.indexOf(selected_name)"
      @change="onChange"
    >
      <option value="-1">Main Tree</option>
      <optgroup label="Subtrees">
        <option v-for="(name, index) in editor_store.subtree_names" :key="name" :value="index">
          {{ name }}
        </option>
      </optgroup>
    </select>
  </div>
</template>
