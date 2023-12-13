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
        :value="param.value.value as string"
        @input="onChange"
        @focus="onFocus"
        @keypress="keyPressHandler"
      />
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
