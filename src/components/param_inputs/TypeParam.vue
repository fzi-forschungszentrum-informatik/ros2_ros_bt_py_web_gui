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
import { useEditorStore } from '@/stores/editor'
import { useMessasgeStore } from '@/stores/message'
import type { Message, ParamData } from '@/types/types'
import { python_builtin_types } from '@/utils'
import { computed, ref } from 'vue'

const props = defineProps<{
  category: 'options',
  data_key: string
}>()

const editor_store = useEditorStore()
const edit_node_store = useEditNodeStore()
const messages_store = useMessasgeStore()

let messages_results = ref<Message[]>([])

const param = computed<ParamData | undefined>(() => 
  edit_node_store.new_node_options.find((x) => x.key === props.data_key)
)

// These track two conditions for displaying the result dropdown.
//   One is for focusing the input, the other for navigating the result menu
let hide_results = ref<boolean>(true)
let keep_results = ref<boolean>(false)

function onChange(event: Event) {
  if (param.value === undefined) {
    console.error("Undefined parameter")
    return
  }

  const target = event.target as HTMLInputElement
  let new_type_name = target.value || ''
  new_type_name = new_type_name.replace('__builtin__.', '').replace('builtins.', '')
  const results = messages_store.messages_fuse.search(new_type_name)
  messages_results.value = results.slice(0, 5).map((x) => x.item)

  if (python_builtin_types.indexOf(new_type_name) >= 0) {
    edit_node_store.updateParamValue(props.category, 
      props.data_key, '__builtin__.' + new_type_name)
  } else {
    edit_node_store.updateParamValue(props.category, props.data_key, new_type_name)
  }
}

function selectSearchResult(search_result: Message) {
  // TODO: Set the Request and Response values for the other nodes.
  edit_node_store.updateParamValue(props.category, props.data_key, search_result.msg)
  releaseDropdown()
}

function focusInput() {
  edit_node_store.changeCopyMode(false)
  hide_results.value = false
}

function unfocusInput() {
  hide_results.value = true
}

function forceDropdown() {
  keep_results.value = true
}

function releaseDropdown() {
  keep_results.value = false
}

</script>

<template>
  <div v-if="param !== undefined" class="form-group">
    <label class="d-block">
      {{ param.key }}
      <input
        type="text"
        class="form-control mt-2"
        :value="(param.value.value as string)"
        :disabled="editor_store.selected_subtree.is_subtree"
        @input="onChange"
        @focus="focusInput"
        @blur="unfocusInput"
        @keyup.esc="() => {unfocusInput(); releaseDropdown()}"
        @keydown.tab="forceDropdown"
      />
    </label>
    <div class="mb-2 search-results">
      <div class="list-group" :class="{'d-none': hide_results && !keep_results}"
      @mouseenter="forceDropdown" @mouseleave="releaseDropdown">
        <div
          v-for="result in messages_results"
          :key="result.msg"
          class="list-group-item search-result"
          tabindex="0"
          @click="() => selectSearchResult(result)"
          @keyup.enter="() => selectSearchResult(result)"
          @keyup.esc="releaseDropdown"
        >
          {{ result.msg }}
        </div>
      </div>
    </div>
  </div>
  <div v-else>
    Error loading param data
  </div>
</template>

<style lang="scss">
.search-results {
  padding-left: 10px;
}

.search-result:hover {
  background-color: #007bff;
}

.search-result-highlighted {
  background-color: #007bff;
}
</style>
