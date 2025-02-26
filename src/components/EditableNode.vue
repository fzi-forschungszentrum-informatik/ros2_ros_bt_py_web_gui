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
import { getShortDoc } from '@/utils'
import { useEditorStore } from '@/stores/editor'
import { useEditNodeStore } from '@/stores/edit_node'
import ParamInputs from './ParamInputs.vue'
import ParamDisplay from './ParamDisplay.vue'
import { ref } from 'vue'

const editor_store = useEditorStore()
const edit_node_store = useEditNodeStore()

const show_description = ref<boolean>(false)
</script>

<template>
  <div class="d-flex flex-column overflow-auto pb-3" style="max-height: 40vh">
    <input
      class="form-control-lg mb-2"
      type="text"
      :value="edit_node_store.new_node_name"
      :disabled="editor_store.selected_subtree.is_subtree"
      @focus="() => edit_node_store.changeCopyMode(false)"
      @change="
        (event: Event) => edit_node_store.changeNodeName((event.target as HTMLInputElement).value)
      "
    />
    <div class="d-flex align-items-baseline mb-2">
      <h4 class="text-muted">
        <div v-if="!edit_node_store.is_flow_control_node">
          {{ edit_node_store.new_node_class }}
          <small>({{ edit_node_store.new_node_module }})</small>
        </div>
        <select
          v-else
          class="form-select"
          :value="edit_node_store.new_node_module + edit_node_store.new_node_class"
          :disabled="editor_store.selected_subtree.is_subtree"
          @change="
            (event: Event) =>
              edit_node_store.changeNodeClass((event.target as HTMLInputElement).value)
          "
        >
          <option
            v-for="node in edit_node_store.flow_control_nodes"
            :key="node.module + node.node_class"
            :value="node.module + node.node_class"
          >
            {{ node.node_class }} <small>({{ node.module }})</small>
          </option>
        </select>
      </h4>
    </div>
    <div
      v-if="
        edit_node_store.reference_node && 
        getShortDoc(edit_node_store.reference_node.doc) !== ''
      " 
      class="mb-3"
    >
      <div class="d-flex align-items-baseline cursor-pointer" 
        @click="() => show_description = !show_description"
      >
        <h5>Description</h5>
        <font-awesome-icon
          :icon="'fa-solid ' + (show_description ? 'fa-angle-up' : 'fa-angle-down')"
          aria-hidden="true"
          class="ms-2"
        />
      </div>
      <div v-if="show_description" class="mx-2">
        {{ getShortDoc(edit_node_store.reference_node.doc) }}
      </div>
    </div>
    <div class="mb-3">
      <h5>Options</h5>
      <div class="list-group">
        <ParamInputs
          v-for="option in edit_node_store.new_node_options"
          :key="'option_' + option.key"
          :data_key="option.key"
          category="options"
        ></ParamInputs>
      </div>
    </div>
    <div class="mb-3">
      <h5>Input</h5>
      <div class="list-group">
        <ParamDisplay
          v-for="input in edit_node_store.new_node_inputs"
          :key="'input_' + input.key"
          :data_key="input.key"
          category="inputs"
        ></ParamDisplay>
      </div>
    </div>
    <div className="mb-3">
      <h5>Output</h5>
      <div class="list-group">
        <ParamDisplay
          v-for="output in edit_node_store.new_node_outputs"
          :key="'output_' + output.key"
          :data_key="output.key"
          category="outputs"
        ></ParamDisplay>
      </div>
    </div>
  </div>
</template>
