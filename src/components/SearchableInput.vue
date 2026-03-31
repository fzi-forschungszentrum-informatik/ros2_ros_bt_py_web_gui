<!--
 *  Copyright 2026 FZI Forschungszentrum Informatik
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

<script setup lang="ts" generic="T">
import type { Expression } from 'fuse.js'
import type Fuse from 'fuse.js'
import { computed, ref, type Ref } from 'vue'

const props = defineProps<{
  item_list: T[]
  search_fuse: Fuse<T>
  parse: (input: string) => T
  search_target: (elem: T) => string | Expression
  render_function: (elem: T) => string
}>()

const selected_value = defineModel<T>()

const is_invalid = computed<boolean>(() => {
  if (selected_value.value === undefined) {
    return true
  }
  if (props.item_list === undefined) {
    return true
  }
  return !props.item_list.includes(selected_value.value)
})

const search_results = ref<T[]>(getSearchResult(selected_value.value || props.parse(''))) as Ref<
  T[]
>

// These track two conditions for displaying the result dropdown.
//   One is for focusing the input, the other for navigating the result menu
const hide_results = ref<boolean>(true)
const keep_results = ref<boolean>(false)

function getSearchResult(item: T): T[] {
  const target = props.search_target(item)
  if (target === '') {
    return props.item_list
  }
  const results = props.search_fuse.search(target)
  return results.map((x) => x.item)
}

function onInput(event: Event) {
  const target = event.target as HTMLInputElement

  const value = props.parse(target.value)

  search_results.value = getSearchResult(value)

  selected_value.value = value
}

function selectSearchResult(search_result: T) {
  selected_value.value = search_result
  releaseDropdown()
}

function focusInput() {
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
  <input
    type="text"
    class="form-control"
    :class="{ 'is-invalid': is_invalid }"
    :value="selected_value"
    @input="onInput"
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
  <div class="mb-2 search-results">
    <div
      class="list-group rounded-top-0"
      :class="{ 'd-none': hide_results && !keep_results }"
      @mouseenter="forceDropdown"
      @mouseleave="releaseDropdown"
    >
      <div
        v-for="result in search_results"
        :key="search_target(result).toString()"
        class="list-group-item search-result"
        tabindex="0"
        @click="() => selectSearchResult(result)"
        @keyup.enter="() => selectSearchResult(result)"
        @keyup.esc="releaseDropdown"
      >
        <span v-html="render_function(result)"></span>
      </div>
    </div>
  </div>
</template>
