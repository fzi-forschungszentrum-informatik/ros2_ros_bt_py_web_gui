<script setup lang="ts">
import type { DocumentedNode } from '@/types/types'
import { computed, ref } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { getShortDoc } from '@/utils'
import IOTableEntry from './IOTableEntry.vue'
import { processSlotOutlet } from '@vue/compiler-core'

const props = defineProps<{
  node: DocumentedNode
}>()

const editor_store = useEditorStore()

const highlighted = computed<boolean>(() => {
  if (!editor_store.dragging_node) {
    return false
  }

  return (
    editor_store.dragging_node.node_class === props.node.node_class &&
    editor_store.dragging_node.module === props.node.module
  )
})

const highlighted_classes = computed<string>(() => {
  if (highlighted.value) {
    return 'border-primary'
  } else {
    return 'grab'
  }
})

const node_type = computed<string>(() => {
  if (props.node.max_children < 0) {
    return 'Flow control'
  } else if (props.node.max_children > 0) {
    return 'Decorator'
  } else {
    return 'Leaf'
  }
})

const collapsed = ref<boolean>(true)

function onClick() {
  console.log('click ' + props.node.name)
  editor_store.nodeListSelectionChange(props.node)
}
</script>

<template>
  <div
    :id="node.module + node.name"
    class="border rounded p-2 m-2"
    :class="highlighted_classes"
    tabindex="0"
    @click="onClick"
    @mouseup="() => editor_store.stopDragging()"
    @mousedown.stop.prevent="() => editor_store.startDragging(node)"
    @keydown="
      (event) => {
        if (event.key == 'Enter') {
          editor_store.nodeListSelectionChange(node)
        }
      }
    "
  >
    <div class="d-flex justify-content-between">
      <div class="d-flex minw0">
        <h4 :title="node.node_class" class="node_class text-truncate">
          {{ node.node_class }}
        </h4>
        <font-awesome-icon
          icon="fa-solid fa-question-circle"
          class="pl-2 pr-2"
          aria-hidden="true"
          v-bind:title="getShortDoc(node.doc)"
        />
      </div>
      <div class="d-flex minw0">
        <font-awesome-icon
          v-if="!collapsed"
          icon="fa-solid fa-angle-up"
          aria-hidden="true"
          class="cursor-pointer"
          @click="
            () => {
              collapsed = !collapsed
            }
          "
        />
        <font-awesome-icon
          v-else
          icon="fa-solid fa-angle-down"
          aria-hidden="true"
          class="cursor-pointer"
          @click="
            () => {
              collapsed = !collapsed
            }
          "
        />
      </div>
    </div>
    <h5 :title="node.module" class="node_module text-truncate text-muted">
      {{ node.module }}
    </h5>
    <div>
      {{
        node_type +
        ' (max_children: ' +
        (props.node.max_children >= 0 ? props.node.max_children : '∞') +
        ')'
      }}
    </div>
    <div v-if="!collapsed">
      <div v-if="node.tags.length > 0" class="list-group-item mt-1">
        Tags:
        <span v-for="tag in node.tags" class="border rounded p-2 m-1 tag" v-bind:key="tag">{{
          tag
        }}</span>
      </div>
      <div class="list-group">
        <IOTableEntry
          v-if="node.options.length > 0"
          title="Options"
          :io_node_data="node.options"
        ></IOTableEntry>
        <IOTableEntry
          v-if="node.inputs.length > 0"
          title="Inputs"
          :io_node_data="node.inputs"
        ></IOTableEntry>
        <IOTableEntry
          v-if="node.outputs.length > 0"
          title="Outputs"
          :io_node_data="node.outputs"
        ></IOTableEntry>
      </div>
    </div>
  </div>
</template>
