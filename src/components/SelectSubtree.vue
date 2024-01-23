<script setup lang="ts">
import { useEditorStore } from '@/stores/editor'
import { computed } from 'vue'

const editor_store = useEditorStore()

function onChange(event: Event) {
  const target = event.target as HTMLSelectElement
  const value = parseInt(target.value)
  if (value < 0) {
    editor_store.selectSubtree('', false)
  } else {
    editor_store.selectSubtree(editor_store.subtree_names[value], true)
  }
}

const selected_name = computed<string>(() => {
  if (editor_store.selected_subtree.is_subtree) {
    return editor_store.selected_subtree.name
  } else {
    return 'main'
  }
})
</script>

<template>
  <div class="d-flex flex-row align-items-center">
    <label class="col-form-label m-1 ms-2" for="formTree"> Tree: </label>

    <select
      id="formTree"
      class="form-select m-2"
      :value="editor_store.subtree_names.indexOf(selected_name)"
      @change="onChange"
    >
      <option value="-1">Main Tree</option>
      <optgroup label="Subtrees">
        <option v-for="(name, index) in editor_store.subtree_names" :key="name" :value="index">
          {{ name }}
        </option>
      </optgroup>
    </select>
  </div>
</template>
