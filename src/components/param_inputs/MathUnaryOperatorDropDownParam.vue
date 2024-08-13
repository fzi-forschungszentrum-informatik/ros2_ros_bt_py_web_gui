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
import { useEditorStore } from '@/stores/editor';
import type { ParamData, PyOperator } from '@/types/types'
import { ref } from 'vue'

const props = defineProps<{
  param: ParamData
  name: string
  updateValue: (param_type: string, key: string, value: any) => void
}>()

const editor_store = useEditorStore()

function handleChange(event: Event) {
  const target = event.target as HTMLSelectElement
  operator.value = target.value

  let operator_obj = props.param.value.value as PyOperator
  operator_obj.operator = operator.value

  props.updateValue(props.param.value.type, props.param.key, operator_obj)
}

const operator = ref<string>((props.param.value.value as PyOperator).operator)
const operators = [
  'not',
  'inv',
  '~',
  'neg',
  '-',
  'pos',
  '+',
  'exp',
  'expm1',
  'log',
  'log1p',
  'log10',
  'ceil',
  'fabs',
  'factorial',
  'floor',
  'sqrt',
  'acos',
  'asin',
  'atan',
  'acosh',
  'asinh',
  'atanh',
  'cos',
  'sin',
  'tan',
  'cosh',
  'sinh',
  'tanh',
  'degrees',
  'radians',
  'erf',
  'erfc',
  'gamma',
  'lgamma'
]
</script>

<template>
  <div class="form-group">
    <label class="d-block">
      {{ param.key }}
    </label>
    <select :value="operator" @change="handleChange"
    :disabled="editor_store.selected_subtree.is_subtree">
      <option v-for="operator_option in operators" :key="operator_option" :value="operator_option">
        {{ operator_option }}
      </option>
    </select>
  </div>
</template>
