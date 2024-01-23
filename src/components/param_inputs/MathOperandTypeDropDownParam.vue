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
  operand.value = target.value

  let operand_obj = props.param.value.value as PyOperator
  operand_obj.operator = operand.value

  props.updateValue(props.param.value.type, props.param.key, operand_obj)
}

const operand = ref<string>((props.param.value.value as PyOperator).operator)
const operand_type = ['int', 'float', 'bool']
</script>

<template>
  <div class="form-group">
    <label class="d-block">
      {{ param.key }}
    </label>
    <select :value="operand" @change="handleChange">
      <option v-for="operand_option in operand_type" :key="operand_option" :value="operand_option">
        {{ operand_option }}
      </option>
    </select>
  </div>
</template>
