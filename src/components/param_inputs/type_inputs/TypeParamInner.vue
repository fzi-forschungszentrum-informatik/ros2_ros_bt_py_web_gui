<!--
 *  Copyright 2026 FZI Forschungszentrum Informatik
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
import { BuiltinOrRosType, type BuiltinType } from '@/types/data_classes'
import SearchableInput from '../../SearchableInput.vue'
import Fuse from 'fuse.js'
import { computed, ref, toRaw, watch } from 'vue'
import { DataTypeValues, ELEMENT_KEY, IDENTIFIER_KEY, RosTypeValues } from '@/types/data_types'
import IntOptions from './IntOptions.vue'
import FloatOptions from './FloatOptions.vue'
import LengthOptions from './LengthOptions.vue'
import SwitchTypeParamInner from './SwitchTypeParamInner.vue'

const props = defineProps<{
  type: BuiltinType
}>()

const value = defineModel<Record<string, any>>()

const type_list = computed<string[]>(() => props.type.valid_types.map((x) => x.type))

let init_chosen_type = ''
const initial_type = props.type.valid_types.find(
  (x) => x.value[IDENTIFIER_KEY] === value.value![IDENTIFIER_KEY]
)
if (initial_type !== undefined) {
  init_chosen_type = initial_type.type
}

const chosen_type = ref<string>(init_chosen_type)
watch(chosen_type, (val: string) => {
  const type_value = props.type.valid_types.find((x) => x.type === val)
  if (type_value === undefined) {
    return
  }
  value.value = structuredClone(toRaw(type_value.value))
})

const type_has_length = computed<boolean>(() => {
  if (value.value === undefined) {
    return false
  }
  return [
    DataTypeValues.STRING_TYPE,
    DataTypeValues.BYTES_TYPE,
    DataTypeValues.LIST_TYPE,
    DataTypeValues.DICT_TYPE
  ].includes(value.value[IDENTIFIER_KEY])
})

const type_has_nested = computed<boolean>(() => {
  if (value.value === undefined) {
    return false
  }
  return Object.keys(value.value).includes(ELEMENT_KEY)
})

const nested_type = computed<BuiltinOrRosType>(() => {
  const type_msg = props.type.toTypeMsg()
  type_msg.type_identifier = DataTypeValues.BUILTIN_OR_ROS_TYPE
  if (value.value![ELEMENT_KEY][IDENTIFIER_KEY] === DataTypeValues.ROS_INTERFACE_VALUE) {
    type_msg.ros_interface_kind = RosTypeValues.ROS_TOPIC
  } else {
    type_msg.ros_interface_kind = RosTypeValues.ROS_UNDEFINED
  }
  return new BuiltinOrRosType(type_msg)
})
</script>

<template>
  <SearchableInput
    v-model="chosen_type"
    :item_list="type_list"
    :search_fuse="new Fuse(type_list)"
    :parse="(x: string) => x"
    :search_target="(x: string) => x"
    :render_function="(x: string) => x"
  />
  <template v-if="value !== undefined">
    <IntOptions
      v-if="value[IDENTIFIER_KEY] === DataTypeValues.INT_TYPE"
      v-model:min_value="value.min_value"
      v-model:max_value="value.max_value"
    />
    <FloatOptions
      v-if="value[IDENTIFIER_KEY] === DataTypeValues.FLOAT_TYPE"
      v-model:min_value="value.min_value"
      v-model:max_value="value.max_value"
    />
    <LengthOptions v-if="type_has_length" v-model="value" />
    <div v-if="type_has_nested" class="nested">
      <div>Element type</div>
      <SwitchTypeParamInner v-model="value[ELEMENT_KEY]" :type="nested_type" />
    </div>
  </template>
</template>

<style scoped>
.nested {
  scale: 0.9;
  margin-top: -10px;
}
</style>
