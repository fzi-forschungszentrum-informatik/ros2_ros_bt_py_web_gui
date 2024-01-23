<script setup lang="ts">
import { useEditorStore } from '@/stores/editor'
import type { ParamData } from '@/types/types'

const props = defineProps<{
  param: ParamData
  name: string
  updateValue: (param_type: string, key: string, value: any) => void
}>()

const editor_store = useEditorStore()

function onChange(event: Event) {
  const target = event.target as HTMLInputElement
  let new_value = Math.round(parseInt(target.value))
  if (isNaN(new_value)) {
    new_value = 0.0
  }
  props.updateValue(props.name, props.param.key, new_value)
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
        type="number"
        name="integer"
        step="1.0"
        class="form-control"
        @change="onChange"
        @focus="onFocus"
        placeholder="integer"
        :value="param.value.value as number"
      />
    </label>
  </div>
</template>
