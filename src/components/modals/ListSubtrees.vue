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
import * as uuid from 'uuid'
import { useEditorStore } from '@/stores/editor'
import type { TreeStructure, UUIDString } from '@/types/types'
import { rosToUuid } from '@/utils'
import { computed, ref } from 'vue'
import { findNodeForSubtree, findTree } from '@/tree_selection'

const editor_store = useEditorStore()

const props = defineProps<{
  tree_id: UUIDString
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const show_subtrees = ref<boolean>(true)

const current_tree = computed<TreeStructure | undefined>(() => {
  return findTree(editor_store.tree_structure_list, props.tree_id)
})

const subtree_ids = computed<UUIDString[]>(() => {
  if (current_tree.value === undefined) {
    return []
  }
  const tree_ids = new Set<UUIDString>(
    editor_store.tree_structure_list.map((t) => rosToUuid(t.tree_id))
  )
  const subtree_ids: UUIDString[] = []
  current_tree.value.nodes.forEach((node) => {
    if (node.tree_ref !== '') {
      const t_id = rosToUuid(node.tree_ref)
      if (tree_ids.has(t_id)) {
        subtree_ids.push(t_id)
      }
    }
  })
  return subtree_ids
})

const tree_name = computed<string>(() => {
  if (current_tree.value === undefined) {
    return 'UNKNOWN'
  }
  return current_tree.value.name
})

const node_name = computed<string>(() => {
  if (props.tree_id === uuid.NIL) {
    return 'Main Tree'
  }
  const node = findNodeForSubtree(editor_store.tree_structure_list, props.tree_id)
  if (node === undefined) {
    return 'UNKNOWN'
  }
  return node.name
})

function selectTree() {
  editor_store.selected_tree = props.tree_id
  emit('close')
}
</script>

<template>
  <div class="ms-4 mt-1 mb-2">
    <div class="btn-group w-100">
      <button
        class="btn btn-outline-contrast text-start w-100"
        :class="{ active: tree_id === editor_store.selected_tree }"
        @click="selectTree"
      >
        <FontAwesomeIcon icon="fa-solid fa-share-nodes" class="me-1" />
        {{ node_name }} ({{ tree_name }})
      </button>
      <button
        v-if="subtree_ids.length > 0"
        class="btn btn-outline-contrast"
        @click="show_subtrees = !show_subtrees"
      >
        <FontAwesomeIcon
          :icon="'fa-solid ' + (show_subtrees ? 'fa-angle-up' : 'fa-angle-down')"
          aria-hidden="true"
          class="cursor-pointer ms-auto p-1"
        />
      </button>
    </div>
    <div v-if="show_subtrees">
      <ListSubtrees
        v-for="subtree_id in subtree_ids"
        :key="subtree_id"
        :parent_id="props.tree_id"
        :tree_id="subtree_id"
        @close="emit('close')"
      />
    </div>
  </div>
</template>
