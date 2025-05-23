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
import { useEditNodeStore } from '@/stores/edit_node'
import { useEditorStore } from '@/stores/editor';
import type { IOData, NodeDataLocation, Wiring } from '@/types/types'
import { computed } from 'vue'

const props = defineProps<{
  category: 'inputs' | 'outputs'
  data_key: string
}>()

const editor_store = useEditorStore()
const edit_node_store = useEditNodeStore()

const param = computed<IOData | undefined>(() => {
  switch (props.category) {
    case 'inputs':
      return edit_node_store.new_node_inputs.find((x) => x.key === props.data_key)
    case 'outputs':
      return edit_node_store.new_node_outputs.find((x) => x.key === props.data_key)
    default:
      return undefined
  }
})

const connected_edges = computed<Wiring[]>(() => {
  if (editor_store.current_tree.structure === undefined) {
    return []
  }
  return editor_store.current_tree.structure.data_wirings.filter((wiring) => 
    matchEndpoint(wiring.source) || matchEndpoint(wiring.target)
  )
})

function matchEndpoint(endpoint: NodeDataLocation): boolean {
  if (edit_node_store.selected_node === undefined) {
    return false
  }
  return endpoint.data_key === props.data_key &&
    endpoint.data_kind === props.category &&
    endpoint.node_name === edit_node_store.selected_node.name
}

function printOtherEndpoint(wiring: Wiring): string {
  let endpoint: NodeDataLocation | null = null
  if (matchEndpoint(wiring.source)) {
    endpoint = wiring.target
  }
  if (matchEndpoint(wiring.target)) {
    endpoint = wiring.source
  }
  if (endpoint === null) {
    return ''
  }
  return endpoint.node_name + '.' + endpoint.data_key
}

</script>

<template>
  <div v-if="param !== undefined" class="list-group-item">
    <div class="h5">
      {{ param.key + ' ' }}
      <span className="text-muted">(type: {{ param.type }})</span>
    </div>
    <div v-if="connected_edges" class="d-flex flex-wrap m-1">
      <button 
        v-for="edge in connected_edges"
        class="btn btn-outline-primary m-1"
        @click="editor_store.selectEdge(edge)"
      >
        {{ printOtherEndpoint(edge) }}
      </button>
    </div>
  </div>
  <div v-else>Error loading param data</div>
</template>
