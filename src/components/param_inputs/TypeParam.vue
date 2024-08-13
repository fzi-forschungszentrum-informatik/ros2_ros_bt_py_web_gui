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
import { useEditorStore } from '@/stores/editor'
import { useMessasgeStore } from '@/stores/message'
import type { Message, ParamData } from '@/types/types'
import { python_builtin_types } from '@/utils'
import { ref } from 'vue'

const props = defineProps<{
  param: ParamData
  name: string
  updateValue: (param_type: string, key: string, value: any) => void
}>()

const editor_store = useEditorStore()
const messages_store = useMessasgeStore()

let messages_results = ref<Message[]>([])

function onChange(event: Event) {
  const target = event.target as HTMLInputElement
  const new_type_name = target.value || ''
  const results = messages_store.messages_fuse.search(new_type_name)
  messages_results.value = results.slice(0, 5).map((x) => x.item)

  if (python_builtin_types.indexOf(new_type_name) >= 0) {
    props.updateValue(props.name, props.param.key, '__builtin__.' + new_type_name)
  } else {
    props.updateValue(props.name, props.param.key, new_type_name)
  }
}

function keyPressHandler(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    messages_results.value = []
  }
}

function onSearchResultClick(search_result: Message) {
  // TODO: Set the Request and Response values for the other nodes.
  props.updateValue(props.name, props.param.key, search_result.msg)
  messages_results.value = []
}

function onSearchResultKeyDown(search_result: Message, event: KeyboardEvent) {
  if (event.key != 'Enter') {
    onSearchResultClick(search_result)
  }
}

function onFocus() {
  editor_store.changeCopyMode(false)
}

</script>

<template>
  <div class="form-group">
    <label class="d-block">
      {{ param.key }}
      <input
        type="text"
        class="form-control mt-2"
        :value="(param.value.value as string)"
        :disabled="editor_store.selected_subtree.is_subtree"
        @input="onChange"
        @focus="onFocus"
        @keypress="keyPressHandler"
      /><!--TODO standardize display of builtin types-->
    </label>
    <!--TODO: Render Results-->
    <div class="mb-2 search-results">
      <div class="list-group">
        <div
          v-for="result in messages_results"
          :key="result.msg"
          class="list-group-item search-result"
          tabindex="0"
          @click="() => onSearchResultClick(result)"
          @keydown="(event) => onSearchResultKeyDown(result, event)"
        >
          {{ result.msg }}
        </div>
      </div>
    </div>
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
