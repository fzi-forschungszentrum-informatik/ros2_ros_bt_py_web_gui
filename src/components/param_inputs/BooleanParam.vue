<script setup lang="ts">
import { useEditorStore } from '@/stores/editor'
import type { ParamData } from '@/types/types'
import { uuid } from '@/utils'

const props = defineProps<{
  param: ParamData
  name: string
  updateValue: (param_type: string, key: string, value: any) => void
}>()

const editor_store = useEditorStore()

const check_id = 'input_checkbox_' + uuid()

function onChange(event: Event) {
  const target = event.target as HTMLInputElement
  props.updateValue(props.name, props.param.key, target.checked)
}

function onFocus() {
  editor_store.changeCopyMode(false)
}
</script>

<template>
  <div class="custom-control custom-checkbox m-1">
    <input
      type="checkbox"
      :id="check_id"
      class="custom-control-input"
      :checked="param.value.value as boolean"
      @focus="onFocus"
      @change="onChange"
    />
    <label class="custom-control-label d-block" :for="check_id">
      {{ param.key }}
    </label>
  </div>
</template>
