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
  props.updateValue(props.name, props.param.key, target.value || '')
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
        @focus="onFocus"
        @change="onChange"
      />
    </label>
  </div>
</template>
