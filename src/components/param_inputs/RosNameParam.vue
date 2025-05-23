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
import {
  RosActionType_Name,
  RosServiceType_Name,
  RosTopicType_Name,
  type RosName,
  type RosType
} from '@/types/python_types'
import type { Channel, OptionData } from '@/types/types'
import Fuse from 'fuse.js'
import { computed, ref } from 'vue'

const edit_node_store = useEditNodeStore()
const editor_store = useEditorStore()
const messages_store = useMessasgeStore()

const props = defineProps<{
  category: 'options'
  data_key: string
  type: 'topic' | 'service' | 'action'
}>()

const search_results = ref<Channel[]>([])

const param = computed<OptionData | undefined>(() =>
  edit_node_store.new_node_options.find((x) => x.key === props.data_key)
)

// Find a type parameter to reference when searching and set when selecting
const type_param = computed<OptionData | undefined>(() => {
  let type_param_name: string
  switch (props.type) {
    case 'topic':
      type_param_name = RosTopicType_Name
      break
    case 'service':
      type_param_name = RosServiceType_Name
      break
    case 'action':
      type_param_name = RosActionType_Name
      break
    default:
      return undefined
  }
  return edit_node_store.new_node_options.find((x) => x.value.type === type_param_name)
})

const search_fuse = computed<Fuse<Channel> | undefined>(() => {
  switch (props.type) {
    case 'topic':
      return messages_store.ros_topic_name_fuse
    case 'service':
      return messages_store.ros_service_name_fuse
    case 'action':
      return messages_store.ros_action_name_fuse
    default:
      return undefined
  }
})

// These track two conditions for displaying the result dropdown.
//   One is for focusing the input, the other for navigating the result menu
const hide_results = ref<boolean>(true)
const keep_results = ref<boolean>(false)

function onInput(event: Event) {
  if (param.value === undefined ||
    search_fuse.value === undefined
  ) {
    console.error('Undefined parameter')
    return
  }

  const target = event.target as HTMLInputElement
  const new_name = target.value || ''

  const results = search_fuse.value.search({ name: new_name })

  search_results.value = results.map((x) => x.item)

  setValue(new_name)
}

function setValue(new_value: string) {
  if (param.value === undefined) {
    console.error('Undefined parameter')
    return
  }

  const name_obj = param.value.value.value as RosName
  name_obj.name = new_value

  edit_node_store.updateParamValue(props.category, props.data_key, name_obj)
}

function setType(new_value: string) {
  if (type_param.value === undefined) {
    // No type param to set
    return
  }

  const type_obj = type_param.value.value.value as RosType
  type_obj.type_str = new_value

  edit_node_store.updateParamValue(props.category, type_param.value.key, type_obj)
}

function selectSearchResult(search_result: Channel) {
  setValue(search_result.name)
  setType(search_result.type)
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
        :value="(param.value.value as RosName).name"
        :disabled="editor_store.has_selected_subtree"
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
          :key="result.name"
          class="list-group-item search-result"
          tabindex="0"
          @click="() => selectSearchResult(result)"
          @keyup.enter="() => selectSearchResult(result)"
          @keyup.esc="releaseDropdown"
        >
          {{ result.name }}<br />
          <small>{{ result.type }}</small>
        </div>
      </div>
    </div>
  </div>
  <div v-else>Error loading param data</div>
</template>

<style scoped lang="scss">

</style>