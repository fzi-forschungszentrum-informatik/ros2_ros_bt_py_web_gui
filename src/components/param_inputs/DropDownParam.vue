<script setup lang="ts">
import type { ParamData, PyLogger } from '@/types/types'
import { ref } from 'vue'

const props = defineProps<{
  param: ParamData
  name: string
  updateValue: (param_type: string, key: string, value: any) => void
}>()

function handleChange(event: Event) {
  const target = event.target as HTMLSelectElement
  logger_level.value = target.value

  let logger = props.param.value.value as PyLogger
  logger.logger_level = logger_level.value

  props.updateValue(props.param.value.type, props.param.key, logger)
}

const logger_level = ref<string>((props.param.value.value as PyLogger).logger_level)
</script>

<template>
  <div class="form-group">
    <label class="d-block">
      {{ param.key }}
    </label>
    <select :value="logger_level" @change="handleChange">
      <option value="debug">DEBUG</option>
      <option value="info">INFO</option>
      <option value="warning">WARNING</option>
      <option value="error">ERROR</option>
      <option value="fatal">FATAL</option>
    </select>
  </div>
</template>
