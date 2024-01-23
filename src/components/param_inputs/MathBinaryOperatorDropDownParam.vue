<script setup lang="ts">
import type { ParamData, PyOperator } from '@/types/types'
import { ref } from 'vue'

const props = defineProps<{
  param: ParamData
  name: string
  updateValue: (param_type: string, key: string, value: any) => void
}>()

function handleChange(event: Event) {
  const target = event.target as HTMLSelectElement
  operator.value = target.value

  let operator_obj = props.param.value.value as PyOperator
  operator_obj.operator = operator.value

  props.updateValue(props.param.value.type, props.param.key, operator_obj)
}

const operator = ref<string>((props.param.value.value as PyOperator).operator)
const operators = [
  'add',
  '+',
  'and',
  '&',
  'div',
  '/',
  'floordiv',
  '//',
  'lshift',
  '<<',
  'mod',
  '%',
  'mul',
  '*',
  'or',
  '|',
  'pow',
  '**',
  'rshift',
  '>>',
  'sub',
  '-',
  'truediv',
  'xor',
  '^'
]
</script>

<template>
  <div class="form-group">
    <label class="d-block">
      {{ param.key }}
    </label>
    <select :value="operator" @change="handleChange">
      <option v-for="operator_option in operators" :key="operator_option" :value="operator_option">
        {{ operator_option }}
      </option>
    </select>
  </div>
</template>
