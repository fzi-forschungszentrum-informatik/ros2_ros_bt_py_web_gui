<script setup lang="ts">
import { EditorSkin, useEditorStore } from '@/stores/editor'

const editor_store = useEditorStore()

function onChange(event: Event) {
  const target = event.target as HTMLSelectElement
  let new_value
  EditorSkin
  switch (target.value) {
    case EditorSkin.DARK:
      new_value = EditorSkin.DARK
      break
    case EditorSkin.LIGHT:
      new_value = EditorSkin.LIGHT
      break
    default:
      new_value = EditorSkin.DARK
  }
  editor_store.setEditorSkin(new_value)
}
</script>

<template>
  <div>
    <label class="form-inline m-1">
      <select class="form-select ms-1" :defaultValue="EditorSkin.DARK" @change="onChange">
        <option :value="EditorSkin.DARK">Dark Editor</option>
        <option :value="EditorSkin.LIGHT">Light Editor</option>
      </select>
    </label>
  </div>
</template>
