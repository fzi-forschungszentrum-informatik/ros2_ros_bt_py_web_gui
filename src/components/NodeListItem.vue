<!--
 *  Copyright 2024-2026 FZI Forschungszentrum Informatik
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
import type { DocumentedNode } from '@/types/types'
import { computed, ref } from 'vue'
import { useEditorStore } from '@/stores/editor'
import IOTableEntry from './IOTableEntry.vue'
import { useEditNodeStore } from '@/stores/edit_node'
import { getShortDoc } from '@/utils'

const props = defineProps<{
  node: DocumentedNode
}>()

const editor_store = useEditorStore()
const edit_node_store = useEditNodeStore()

const highlighted = computed<boolean>(() => {
  if (!editor_store.dragging_new_node) {
    return false
  }

  return (
    editor_store.dragging_new_node.node_class === props.node.node_class &&
    editor_store.dragging_new_node.module === props.node.module
  )
})

const highlighted_classes = computed<string>(() => {
  if (highlighted.value) {
    return 'border-primary'
  } else {
    return 'grab'
  }
})

const node_type_icon = computed<string>(() => {
  if (props.node.max_children > 0) {
    return 'fa-link'
  } else if (props.node.max_children === 0) {
    return 'fa-leaf'
  } else {
    return 'fa-network-wired'
  }
})

const show_details = ref<boolean>(false)
const show_description = ref<boolean>(true)

function onClick() {
  edit_node_store.nodeListSelectionChange(props.node)
}
</script>

<template>
  <div
    class="border rounded p-2 m-2"
    :class="highlighted_classes"
    tabindex="0"
    @click="onClick"
    @mousedown.stop.prevent="() => editor_store.startDraggingNewNode(node)"
    @keydown.enter="edit_node_store.nodeListSelectionChange(node)"
  >
    <div class="d-flex w-100">
      <div class="text-truncate fs-4">
        {{ node.node_class }}
      </div>
      <div class="text-muted mx-2 my-auto">
        <FontAwesomeIcon :icon="'fa-solid ' + node_type_icon" />
        {{ node.max_children > 0 ? '(' + node.max_children + ')' : '' }}
      </div>
      <FontAwesomeIcon
        :icon="'fa-solid ' + (show_details ? 'fa-angle-up' : 'fa-angle-down')"
        aria-hidden="true"
        class="cursor-pointer ms-auto p-1"
        @click.stop="() => (show_details = !show_details)"
      />
    </div>
    <div class="text-muted">
      {{ node.module }}
    </div>
    <div v-if="show_details" class="mt-3">
      <!--TODO tags temporarily removed, since they're unusable right now
      <div v-if="node.tags.length > 0" class="d-flex flex-wrap mb-2">
        <button v-for="tag in node.tags"
          class="btn btn-outline-contrast px-2 py-1 m-1"
          :key="tag"
        >
          {{ tag }}
        </button>
      </div>-->
      <div class="list-group">
        <div v-if="getShortDoc(node.doc) !== ''" class="list-group-item">
          <div class="d-flex w-100">
            <div class="fs-5">Description</div>
            <FontAwesomeIcon
              :icon="'fa-solid ' + (show_description ? 'fa-angle-up' : 'fa-angle-down')"
              aria-hidden="true"
              class="cursor-pointer ms-auto"
              @click="() => (show_description = !show_description)"
            />
          </div>
          <div v-if="show_description">
            {{ getShortDoc(node.doc) }}
          </div>
        </div>
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

<style scoped lang="scss">
.grab:hover {
  cursor: grab;
}
</style>
