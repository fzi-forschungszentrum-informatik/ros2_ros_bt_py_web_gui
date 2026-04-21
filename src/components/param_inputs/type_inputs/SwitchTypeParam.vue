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
import TypeParam from './TypeParam.vue'
import RosTypeParam from './RosTypeParam.vue'
import { RosTypeValues } from '@/types/data_types'
import { watch } from 'vue'

const props = defineProps<{
  type: BuiltinOrRosType
}>()

const value = defineModel<string>()

watch(
  () => props.type.inner_type,
  () => {
    if (value.value === undefined) {
      return
    }
    value.value = props.type.getSerializedDefault()
  }
)

function switchType(event: Event) {
  const target = event.target as HTMLInputElement

  props.type.setInnerType(target.checked ? RosTypeValues.ROS_TOPIC : RosTypeValues.ROS_UNDEFINED)

  value.value = props.type.getSerializedDefault()
}
</script>

<template>
  <div class="form-check form-switch">
    <input
      type="checkbox"
      class="form-check-input"
      :checked="type.inner_type instanceof RosTypeType"
      @change="switchType"
    />
    <label class="form-check-label">Is ROS Type</label>
  </div>
  <TypeParam
    v-if="type.inner_type instanceof BuiltinType"
    v-model="value"
    :type="type.inner_type"
  />
  <RosTypeParam v-else v-model="value" :type="type.inner_type" />
</template>
