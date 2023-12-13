<script setup lang="ts">
import type { ParamData } from '@/types/types'
import BooleanParam from './param_inputs/BooleanParam.vue'
import TypeParam from './param_inputs/TypeParam.vue'
import StringParam from './param_inputs/StringParam.vue'
import FloatParamVue from './param_inputs/FloatParam.vue'
import IntParam from './param_inputs/IntParam.vue'
import UnsetOptionrefParam from './param_inputs/UnsetOptionrefParam.vue'
import ListParam from './param_inputs/ListParam.vue'
import DictParam from './param_inputs/DictParam.vue'
import JSONInput from './JSONInput.vue'
import DropDownParam from './param_inputs/DropDownParam.vue'
import MathUnaryOperatorDropDownParam from './param_inputs/MathUnaryOperatorDropDownParam.vue'
import MathBinaryOperatorDropDownParam from './param_inputs/MathBinaryOperatorDropDownParam.vue'
import MathOperandTypeDropDownParam from './param_inputs/MathOperandTypeDropDownParam.vue'
import MathUnaryOperandTypeDropDownParam from './param_inputs/MathUnaryOperandTypeDropDownParam.vue'

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
    <UnsetOptionrefParam v-else-if="param.value.type === 'unset_optionref'" :param="param" />
    <ListParam
      v-else-if="param.value.type === 'list'"
      :param="param"
      :name="name"
      :updateValue="updateValue"
      :updateValidity="updateValidity"
    />
    <DictParam
      v-else-if="param.value.type === 'dict' || param.value.type === 'collections.OrderedDict'"
      :param="param"
      :name="name"
      :updateValue="updateValue"
      :updateValidity="updateValidity"
    />
    <DropDownParam
      v-else-if="param.value.type === 'ros_bt_py.helpers.LoggerLevel'"
      :param="param"
      :name="name"
      :updateValue="updateValue"
    />
    <MathUnaryOperatorDropDownParam
      v-else-if="param.value.type === 'ros_bt_py.helpers.MathUnaryOperator'"
      :param="param"
      :name="name"
      :updateValue="updateValue"
    />
    <MathBinaryOperatorDropDownParam
      v-else-if="param.value.type === 'ros_bt_py.helpers.MathBinaryOperator'"
      :param="param"
      :name="name"
      :updateValue="updateValue"
    />

    <MathOperandTypeDropDownParam
      v-else-if="param.value.type === 'ros_bt_py.helpers.MathOperandType'"
      :param="param"
      :name="name"
      :updateValue="updateValue"
    />

    <MathUnaryOperandTypeDropDownParam
      v-else-if="param.value.type === 'ros_bt_py.helpers.MathUnaryOperandType'"
      :param="param"
      :name="name"
      :updateValue="updateValue"
    />

    <div v-else class="form-group">
      <label class="d-block">
        {{ param.key }}
        <JSONInput
          :json="param.value.value === undefined ? (param.value.value as string) : undefined"
          :message_type="param.value.type"
          output="pickled"
          :param_key="param.key"
          :updateValidity="updateValidity"
          :updateValue="updateValue"
        />
      </label>
    </div>
  </div>
</template>
