<script setup lang="ts">
import BooleanParam from './param_inputs/BooleanParam.vue'
import TypeParam from './param_inputs/TypeParam.vue'
import StringParam from './param_inputs/StringParam.vue'
import FloatParamVue from './param_inputs/FloatParam.vue'
import IntParam from './param_inputs/IntParam.vue'
import type { ParamData } from '@/types/types'

defineProps<{
  param: ParamData
  name: string
  updateValidity: (valid: boolean) => void
  updateValue: (param_type: string, key: string, value: any) => void
}>()
</script>

<template>
  <div class="list-group-item">
    <IntParam
      v-if="param.value.type === 'int'"
      :param="param"
      :name="name"
      :updateValue="updateValue"
    />
    <FloatParamVue
      v-else-if="param.value.type === 'float'"
      class="form-group"
      :param="param"
      :name="name"
      :updateValue="updateValue"
    />
    <StringParam
      v-else-if="param.value.type === 'string'"
      :param="param"
      :name="name"
      :updateValue="updateValue"
    />

    <TypeParam
      v-else-if="param.value.type === 'type'"
      :param="param"
      :name="name"
      :updateValue="updateValue"
    />
    <BooleanParam
      v-else-if="param.value.type === 'bool'"
      :param="param"
      :name="name"
      :updateValue="updateValue"
    />
  </div>
</template>
