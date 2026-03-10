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
import type { NodeStructure } from '@/types/types'
import { rosToUuid } from '@/utils'
import EditableNode from './EditableNode.vue'
import { computed, ref } from 'vue'
import * as uuid from 'uuid'
import { useEditNodeStore } from '@/stores/edit_node'
import { addNode } from '@/tree_manipulation'
import { findTree } from '@/tree_selection'
import { useEditorStore } from '@/stores/editor'

const editor_store = useEditorStore()
const edit_node_store = useEditNodeStore()

const possible_parents = computed<NodeStructure[]>(() => {
  // For now only the main tree can have nodes added to it.
  const tree_structure = findTree(editor_store.tree_structure_list, uuid.NIL)
  if (tree_structure !== undefined) {
    return tree_structure.nodes
      .filter(
        (node: NodeStructure) => node.max_children < 0 || node.child_ids.length < node.max_children
      )
      .sort(function (a: NodeStructure, b: NodeStructure) {
        if (a.name < b.name) {
          return -1
        } else if (a.name > b.name) {
          return 1
        } else {
          return 0
        }
      })
  }
  return []
})

const selected_parent = ref<NodeStructure | null>(
  possible_parents.value.length > 0 ? possible_parents.value[0] : null
)

async function addToTree() {
  if (edit_node_store.reference_node === undefined) {
    console.error("Undefined node reference, can't add node to tree")
    return
  }

  const new_node_id = await addNode(
    edit_node_store.buildNodeMsg(),
    selected_parent.value !== null ? rosToUuid(selected_parent.value.node_id) : uuid.NIL,
    -1
  )

  edit_node_store.clearNodeHasChanged()
  edit_node_store.editorSelectionChange(uuid.NIL, new_node_id)
}
</script>

<template>
  <div class="d-flex flex-column">
    <button
      class="btn btn-block btn-primary"
      :disabled="!edit_node_store.node_is_valid || editor_store.has_selected_subtree"
      @click="addToTree"
    >
      Add to Tree
    </button>
    <label class="pt-2 pb-2">
      Parent
      <select
        v-model="selected_parent"
        class="custom-select d-block"
        :disabled="possible_parents.length === 0"
      >
        <option v-for="parent in possible_parents" :key="rosToUuid(parent.node_id)" :value="parent">
          {{ parent.name }}
        </option>
      </select>
    </label>
    <EditableNode />
  </div>
</template>
