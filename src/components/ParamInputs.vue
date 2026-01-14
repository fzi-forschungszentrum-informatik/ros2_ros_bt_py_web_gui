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
import type { OptionData } from '@/types/types'
import TypeParam from './param_inputs/TypeParam.vue'
import JSONInput from './JSONInput.vue'
import MathOperatorParam from './param_inputs/MathOperatorParam.vue'
import MathOperandParam from './param_inputs/MathOperandParam.vue'
import { computed } from 'vue'
import { useEditNodeStore } from '@/stores/edit_node'
import { useEditorStore } from '@/stores/editor'
import FilePathParam from './param_inputs/FilePathParam.vue'
import {
  FilePath_Name,
  MathBinaryOperator_Name,
  MathOperandType_Name,
  MathUnaryOperandType_Name,
  MathUnaryOperator_Name,
  RosTopicType_Name,
  RosTopicName_Name,
  RosServiceType_Name,
  RosServiceName_Name,
  RosActionType_Name,
  RosActionName_Name
} from '@/types/python_types'
import RosTypeParam from './param_inputs/RosTypeParam.vue'
import RosNameParam from './param_inputs/RosNameParam.vue'
import { getTypeAndInfo, unset_ref_str } from '@/utils'

const props = defineProps<{
  category: 'options'
  data_key: string
}>()

const edit_node_store = useEditNodeStore()
const editor_store = useEditorStore()

const param = computed<OptionData | undefined>(() =>
  edit_node_store.new_node_options.find((x) => x.key === props.data_key)
)

const param_type = computed<string>(() => {
  if (param.value === undefined) {
    return ''
  }
  return getTypeAndInfo(param.value.value.type)[0]
})

// Below lists the data types that are handled by <input>...
const input_type_values = ['int', 'float', 'bool', 'str', unset_ref_str]
//  ...and gives the appropriate attributes.
const input_attrs = computed<object | undefined>(() => {
  if (param.value === undefined || !input_type_values.includes(param_type.value)) {
    return undefined
  }
  let type: string,
    value: string | number | boolean | undefined,
    step: number | 'any' = 'any',
    cssclass: string[] = ['form-control'],
    checked: boolean = false,
    disabled: boolean = editor_store.has_selected_subtree
  switch (param_type.value) {
    case 'int':
      step = 1.0
    case 'float':
      type = 'number'
      value = param.value.value.value as number
      break
    case 'bool':
      type = 'checkbox'
      checked = param.value.value.value as boolean
      cssclass = ['form-check-input', 'd-block']
      break
    case unset_ref_str:
      disabled = true
    case 'str':
      type = 'text'
      value = param.value.value.value as string
      break
    default:
      type = 'hidden'
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

// Handles value changes for the <input> element
function onChange(event: Event) {
  if (param.value === undefined) {
    return
  }
  const target = event.target as HTMLInputElement
  let new_value: boolean | number | string
  switch (param.value.value.type) {
    case 'int':
      new_value = parseInt(target.value)
      if (isNaN(new_value)) {
        new_value = 0
      }
      break
    case 'float':
      new_value = parseFloat(target.value)
      if (isNaN(new_value)) {
        new_value = 0.0
      }
      break
    case 'bool':
      new_value = target.checked
      break
    default:
      new_value = target.value
      break
  }
  edit_node_store.updateParamValue(props.category, props.data_key, new_value)
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
      <input v-bind="input_attrs" @change="onChange" @focus="onFocus" />
    </div>

    <TypeParam
      v-else-if="param_type === 'type'"
      :category="props.category"
      :data_key="props.data_key"
    />

    <MathOperatorParam
      v-else-if="param_type === MathUnaryOperator_Name"
      :category="props.category"
      :data_key="props.data_key"
      :op_type="'unary'"
    />
    <MathOperandParam
      v-else-if="param_type === MathUnaryOperandType_Name"
      :category="props.category"
      :data_key="props.data_key"
      :op_type="'unary'"
    />
    <MathOperatorParam
      v-else-if="param_type === MathBinaryOperator_Name"
      :category="props.category"
      :data_key="props.data_key"
      :op_type="'binary'"
    />
    <MathOperandParam
      v-else-if="param_type === MathOperandType_Name"
      :category="props.category"
      :data_key="props.data_key"
      :op_type="'binary'"
    />

    <FilePathParam
      v-else-if="param_type === FilePath_Name"
      :category="props.category"
      :data_key="props.data_key"
    />

    <RosTypeParam
      v-else-if="param_type === RosTopicType_Name"
      :category="props.category"
      :data_key="props.data_key"
      :type="'topic'"
    />
    <RosNameParam
      v-else-if="param_type === RosTopicName_Name"
      :category="props.category"
      :data_key="props.data_key"
      :type="'topic'"
    />

    <RosTypeParam
      v-else-if="param_type === RosServiceType_Name"
      :category="props.category"
      :data_key="props.data_key"
      :type="'service'"
    />
    <RosNameParam
      v-else-if="param_type === RosServiceName_Name"
      :category="props.category"
      :data_key="props.data_key"
      :type="'service'"
    />

    <RosTypeParam
      v-else-if="param_type === RosActionType_Name"
      :category="props.category"
      :data_key="props.data_key"
      :type="'action'"
    />
    <RosNameParam
      v-else-if="param_type === RosActionName_Name"
      :category="props.category"
      :data_key="props.data_key"
      :type="'action'"
    />

    <div v-else class="form-group position-relative">
      <JSONInput :category="props.category" :data_key="props.data_key" />
    </div>
  </div>
  <div v-else>Error loading param data</div>
</template>
