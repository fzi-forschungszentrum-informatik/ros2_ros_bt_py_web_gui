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
import type { ParamData } from '@/types/types'
import TypeParam from './param_inputs/TypeParam.vue'
import JSONInput from './JSONInput.vue'
import MathUnaryOperatorDropDownParam from './param_inputs/MathUnaryOperatorDropDownParam.vue'
import MathBinaryOperatorDropDownParam from './param_inputs/MathBinaryOperatorDropDownParam.vue'
import MathOperandTypeDropDownParam from './param_inputs/MathOperandTypeDropDownParam.vue'
import MathUnaryOperandTypeDropDownParam from './param_inputs/MathUnaryOperandTypeDropDownParam.vue'
import { computed } from 'vue'
import { useEditNodeStore } from '@/stores/edit_node'
import { useEditorStore } from '@/stores/editor'

const props = defineProps<{
  category: 'options',
  data_key: string
}>()

const edit_node_store = useEditNodeStore()
const editor_store = useEditorStore()

const param = computed<ParamData | undefined>(() => 
  edit_node_store.new_node_options.find((x) => x.key === props.data_key)
)

// Below lists the data types that are handled by <input>...
const input_type_values = ["int", "float", "bool", "string", "unset_optionref"]
//  ...and gives the appropriate attributes.
const input_attrs = computed<any>(() => {
  if (param.value === undefined || !input_type_values.includes(param.value.value.type)) {
    return undefined
  }
  let type: string, 
    value: any,
    step: number | "any" = "any",
    cssclass: string[] = ["form-control"],
    checked: boolean = false,
    disabled: boolean = editor_store.selected_subtree.is_subtree
  switch (param.value.value.type) {
    case "int":
      step = 1.0
    case "float":
      type = "number"
      value = (param.value.value.value as number)
      break
    case "bool":
      type = "checkbox"
      checked = (param.value.value.value as boolean)
      cssclass = ["form-check-input", "d-block"]
      break
    case "unset_optionref":
      disabled = true
    case "string":
      type = "text"
      value = (param.value.value.value as string)
      break 
    default:
      type = "hidden"
      break
  }
  return {
    type: type,
    value: value,
    class: cssclass,
    step: step,
    checked: checked,
    disabled: disabled
  }
})

// Below gives the attributes for data types handled by <JSONInput>
//  no type_values check since this is also the fallback
const json_attrs = computed<any>(() => {
  if (param.value === undefined) {
    return undefined
  }
  switch (param.value.value.type) {
    case "list":
      break
    case "dict":
    case "collections.OrderedDict":
      break
    default:
      break
  }
  return {
    
  }
})

function onChange(event: Event) {
  const target = event.target as HTMLInputElement
  let new_value = Math.round(parseFloat(target.value))
  if (isNaN(new_value)) {
    new_value = 0.0
  }
  //props.updateValue(props.name, props.param.key, new_value)
}

function onFocus() {
  edit_node_store.changeCopyMode(false)
}

</script>

<template>
  <div v-if="param !== undefined" class="list-group-item">
    <div v-if="input_attrs !== undefined" class="form-group">
      <label class="d-block">
        {{ param.key }}
      </label>
      <input
        v-bind="input_attrs"
        @change="onChange"
        @focus="onFocus"
      />
    </div>

    <TypeParam
      v-else-if="param.value.type === 'type'"
      :category="props.category"
      :data_key="props.data_key"
    />
    
    <!--TODO Below should be adapted to use the new category + data_key scheme.
      Also look into maybe unifying them components to avoid duplicate code-->
    <MathUnaryOperatorDropDownParam
      v-else-if="param.value.type === 'ros_bt_py.helpers.MathUnaryOperator'"
      :param="param"
      :name="category"
      :updateValue="edit_node_store.updateParamValue"
    />
    <MathBinaryOperatorDropDownParam
      v-else-if="param.value.type === 'ros_bt_py.helpers.MathBinaryOperator'"
      :param="param"
      :name="category"
      :updateValue="edit_node_store.updateParamValue"
    />
    <MathOperandTypeDropDownParam
      v-else-if="param.value.type === 'ros_bt_py.helpers.MathOperandType'"
      :param="param"
      :name="category"
      :updateValue="edit_node_store.updateParamValue"
    />
    <MathUnaryOperandTypeDropDownParam
      v-else-if="param.value.type === 'ros_bt_py.helpers.MathUnaryOperandType'"
      :param="param"
      :name="category"
      :updateValue="edit_node_store.updateParamValue"
    />

    <div v-else class="form-group">
      <label class="d-block">
        {{ param.key }}
        <JSONInput
          v-bind="json_attrs"
          :category="props.category"
          :data_key="props.data_key"
        />
      </label>
    </div>
  </div>
  <div v-else>
    Error loading param data
  </div>
</template>
