<script setup lang="ts">
import type { ParamData } from '@/types/types'
import JSONInput from '../JSONInput.vue'

defineProps<{
  param: ParamData
  name: string
  updateValidity: (valid: boolean) => void
  updateValue: (param_type: string, key: string, value: any) => void
}>()
</script>

<template>
  <div class="form-group">
    <label class="d-block">
      {{ param.key }}
      <JSONInput
        :message_type="param.value.type"
        output="list"
        :param_key="param.key"
        :updateValidity="updateValidity"
        :updateValue="updateValue"
        :json="param.value.value as string"
      />
    </label>
  </div>
</template>
