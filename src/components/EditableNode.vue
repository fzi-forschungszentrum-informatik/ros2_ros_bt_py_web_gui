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
import { useNodesStore } from '@/stores/nodes'
import type { DocumentedNode, ParamData } from '@/types/types'
import { computed } from 'vue'
import { getShortDoc } from '@/utils'
import { useEditorStore } from '@/stores/editor'
import ParamInputs from './ParamInputs.vue'
import ParamDisplay from './ParamDisplay.vue'

const nodes_store = useNodesStore()
const editor_store = useEditorStore()

const props = defineProps<{
  name: string
  node_class: string
  module: string
  options: ParamData[]
  inputs: ParamData[]
  outputs: ParamData[]
  doc?: string
  updateValidity: (valid: boolean) => void
  changeNodeClass: (new_class: string) => void
  changeNodeName: (new_name: string) => void
  updateValue: (paramType: string, key: string, new_value: any) => void
}>()

const flow_control_nodes = computed<DocumentedNode[]>(() => {
  return nodes_store.nodes.filter((item: DocumentedNode) => item.max_children == -1)
})

const is_flow_control_node = computed<boolean>(() => {
  return (
    flow_control_nodes.value.filter(
      (item: DocumentedNode) => props.module === item.module && props.node_class === item.node_class
    ).length > 0
  )
})

function handleNodeClassChange(event: Event) {
  const target = event.target as HTMLSelectElement
  props.changeNodeClass(target.value)
}

function handelNodeNameChange(event: Event) {
  const target = event.target as HTMLInputElement
  props.changeNodeName(target.value)
}
</script>

<template>
  <div class="d-flex flex-column">
    <input
      class="form-control-lg mb-2"
      type="text"
      :value="name"
      :disabled="editor_store.selected_subtree.is_subtree"
      @focus="() => editor_store.changeCopyMode(false)"
      @change="handelNodeNameChange"
    />
    <div class="d-flex minw0">
      <h4 class="text-muted">
        <div v-if="!is_flow_control_node">{{ node_class }} ({{ module }})</div>
        <select
          v-else
          class="custom-select"
          :value="module + node_class"
          :disabled="editor_store.selected_subtree.is_subtree"
          @change="handleNodeClassChange"
        >
          <option
            v-for="node in flow_control_nodes"
            :key="node.module + node.node_class"
            :value="node.module + node.node_class"
          >
            {{ node.node_class }} ({{ node.module }})
          </option>
        </select>
      </h4>
      <font-awesome-icon
        v-if="doc"
        icon="fa-solid fa-question-circle"
        class="pl-2 pr-2"
        aria-hidden="true"
        v-bind:title="getShortDoc(doc)"
      />
    </div>
    <div class="mb-2">
      <h5>Options</h5>
      <div class="list-group">
        <ParamInputs
          v-for="option in options"
          name="options"
          :param="option"
          :updateValidity="updateValidity"
          :updateValue="updateValue"
        ></ParamInputs>
      </div>
    </div>
    <div class="mb-2">
      <h5>Input</h5>
      <div class="list-group">
        <ParamDisplay
          v-for="input in inputs"
          :key="'input_' + input.key"
          :param="input"
          name="inputs"
        ></ParamDisplay>
      </div>
    </div>
    <div className="mb-2">
      <h5>Output</h5>
      <div class="list-group">
        <ParamDisplay
          v-for="output in outputs"
          :key="'output_' + output.key"
          :param="output"
          name="outputs"
        ></ParamDisplay>
      </div>
    </div>
  </div>
</template>
