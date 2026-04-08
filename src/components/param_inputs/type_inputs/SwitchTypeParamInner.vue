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
import { BuiltinType, RosTypeType, type BuiltinOrRosType } from '@/types/data_classes'
import TypeParamInner from './TypeParamInner.vue'
import RosTypeParamInner from './RosTypeParamInner.vue'
import { DataTypeValues, IDENTIFIER_KEY, MESSAGE_KEY, RosTypeValues } from '@/types/data_types'
import { ref, watch } from 'vue'

const props = defineProps<{
  type: BuiltinOrRosType
}>()

const value = defineModel<Record<string, any>>()

let init_ros_value: string = 'example_interfaces/msg/Empty'
if (value.value![MESSAGE_KEY] !== undefined) {
  init_ros_value = value.value![MESSAGE_KEY]
}
const ros_value = ref<string>(init_ros_value)
watch(ros_value, (val) => {
  if (value.value === undefined) {
    return
  }
  value.value[MESSAGE_KEY] = val
})

const is_ros_type = ref<boolean>(props.type.inner_type instanceof RosTypeType)
watch(is_ros_type, (is_ros) => {
  if (is_ros) {
    const val_dict: Record<string, any> = {}
    val_dict[IDENTIFIER_KEY] = DataTypeValues.ROS_INTERFACE_VALUE
    val_dict[MESSAGE_KEY] = ros_value.value
    value.value = val_dict
  } else {
    value.value = props.type.valid_types[0].value
  }
})

function switchType(event: Event) {
  const target = event.target as HTMLInputElement
  is_ros_type.value = target.checked
  props.type.setInnerType(target.checked ? RosTypeValues.ROS_TOPIC : RosTypeValues.ROS_UNDEFINED)
}
</script>

<template>
  <div class="form-check form-switch">
    <input type="checkbox" class="form-check-input" @change="switchType" />
    <label class="form-check-label">Is ROS Type</label>
  </div>
  <TypeParamInner v-if="!is_ros_type" v-model="value" :type="(type.inner_type as BuiltinType)" />
  <RosTypeParamInner v-else v-model="ros_value" :type="(type.inner_type as RosTypeType)" />
</template>
