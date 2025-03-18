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
import type { OptionData } from '@/types/types'
import { getTypeAndInfo, python_builtin_types } from '@/utils'
import Fuse from 'fuse.js'
import { computed, ref } from 'vue'

const props = defineProps<{
  category: 'options'
  data_key: string
}>()

const editor_store = useEditorStore()
const edit_node_store = useEditNodeStore()
const messages_store = useMessasgeStore()

const search_results = ref<string[]>([])

const param = computed<OptionData | undefined>(() =>
  edit_node_store.new_node_options.find((x) => x.key === props.data_key)
)

const search_fuse = computed<Fuse<string>>(() => {
  if (param.value === undefined) {
    return messages_store.messages_fuse
  }
  const info = getTypeAndInfo(param.value.value.type)[1]
  if (info === 'builtin') {
    return new Fuse<string>(python_builtin_types)
  }
  return messages_store.messages_fuse
})

const display_value = computed<string>(() => {
  if (param.value === undefined) {
    return ''
  }
  let value = param.value.value.value as string
  if (python_builtin_types.includes(value)) {
    value = 'builtins.' + value
  }
  return value
})

// These track two conditions for displaying the result dropdown.
//   One is for focusing the input, the other for navigating the result menu
const hide_results = ref<boolean>(true)
const keep_results = ref<boolean>(false)

function onChange(event: Event) {
  if (param.value === undefined) {
    console.error('Undefined parameter')
    return
  }

  const target = event.target as HTMLInputElement
  let new_type_name = target.value || ''
  new_type_name = new_type_name.replace('__builtin__.', '').replace('builtins.', '')
  const results = search_fuse.value.search(new_type_name)
  search_results.value = results.map((x) => x.item)

  edit_node_store.updateParamValue(props.category, props.data_key, new_type_name)
}

function selectSearchResult(search_result: string) {
  edit_node_store.updateParamValue(props.category, props.data_key, search_result)
  releaseDropdown()
}

function displaySearchResult(value: string): string {
  // Show builtins prefix if appropriate
  if (python_builtin_types.includes(value)) {
    value = 'builtins.' + value
  }
  // Allow line breaks at dots
  return value.replace(/\./g, '.\u200B')
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
        :value="display_value"
        :disabled="editor_store.selected_subtree.is_subtree"
        @input="onChange"
        @focus="focusInput"
        @blur="unfocusInput"
        @keyup.esc="
          () => {
            unfocusInput()
            releaseDropdown()
          }
        "
        @keydown.tab="forceDropdown"
      />
    </label>
    <div class="mb-2 search-results">
      <div
        class="list-group rounded-top-0"
        :class="{ 'd-none': hide_results && !keep_results }"
        @mouseenter="forceDropdown"
        @mouseleave="releaseDropdown"
      >
        <div
          v-for="result in search_results"
          :key="result"
          class="list-group-item search-result"
          tabindex="0"
          @click="() => selectSearchResult(result)"
          @keyup.enter="() => selectSearchResult(result)"
          @keyup.esc="releaseDropdown"
        >
          {{ displaySearchResult(result) }}
        </div>
      </div>
    </div>
  </div>
  <div v-else>Error loading param data</div>
</template>

<style scoped lang="scss">

</style>
