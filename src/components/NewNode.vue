<!--
 *  Copyright 2024 FZI Forschungszentrum Informatik
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
import type { NodeMsg } from '@/types/types'
import EditableNode from './EditableNode.vue'
import { ref } from 'vue'
import { useEditNodeStore } from '@/stores/edit_node'
import { addNode } from '@/tree_manipulation'

const props = defineProps<{
  parents: NodeMsg[]
}>()

const edit_node_store = useEditNodeStore()

const selected_parent = ref<string>(
  props.parents.length > 0 ? props.parents[0].name : ''
)

async function addToTree() {

  if (edit_node_store.reference_node === undefined) {
    console.error("Undefined node reference, can't add node to tree")
    return
  }

  const new_node_name = await addNode(
    edit_node_store.buildNodeMsg(), 
    selected_parent.value, 
    -1
  )

  edit_node_store.clearNodeHasChanged()
  edit_node_store.editorSelectionChange(new_node_name)

}
</script>

<template>
  <div class="d-flex flex-column">
    <button
      class="btn btn-block btn-primary"
      :disabled="!edit_node_store.node_is_valid"
      @click="addToTree"
    >
      Add to Tree
    </button>
    <label class="pt-2 pb-2">
      Parent
      <select
        v-model="selected_parent"
        class="custom-select d-block"
        :disabled="parents.length === 0"
      >
        <option v-for="parent in parents" :key="parent.name" :value="parent.name">
          {{ parent.name }}
        </option>
      </select>
    </label>
    <EditableNode />
  </div>
</template>
