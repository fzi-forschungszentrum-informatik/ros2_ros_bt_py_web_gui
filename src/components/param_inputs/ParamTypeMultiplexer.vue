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
import {
  BoolType,
  BuiltinOrRosType,
  BuiltinType,
  BytesType,
  DictType,
  FloatType,
  IntType,
  ListType,
  PathType,
  ReferenceDictType,
  ReferenceListType,
  ReferenceType,
  RosNameType,
  RosTypeType,
  RosValueType,
  StringType,
  type DataContainer
} from '@/types/data_classes'
import { computed, type Component } from 'vue'
import BoolParam from './BoolParam.vue'
import IntParam from './IntParam.vue'
import FloatParam from './FloatParam.vue'
import StringParam from './StringParam.vue'
import FilePathParam from './FilePathParam.vue'
import BytesParam from './BytesParam.vue'
import TypeParam from './TypeParam.vue'
import SwitchTypeParam from './SwitchTypeParam.vue'
import ReferenceParam from './ReferenceParam.vue'
import ListParam from './ListParam.vue'
import DictParam from './DictParam.vue'
import RosTypeParam from './RosTypeParam.vue'
import RosValueParam from './RosValueParam.vue'
import RosNameParam from './RosNameParam.vue'

const props = defineProps<{
  type: DataContainer
}>()

const value = defineModel<string>()

const param_component = computed<Component | undefined>(() => {
  const type = props.type
  if (type instanceof BoolType) {
    return BoolParam
  }
  if (type instanceof IntType) {
    return IntParam
  }
  if (type instanceof FloatType) {
    return FloatParam
  }
  if (type instanceof StringType) {
    return StringParam
  }
  if (type instanceof PathType) {
    return FilePathParam
  }
  if (type instanceof BytesType) {
    return BytesParam
  }
  if (type instanceof ListType) {
    return ListParam
  }
  if (type instanceof DictType) {
    return DictParam
  }
  if (type instanceof BuiltinType) {
    return TypeParam
  }
  if (type instanceof RosValueType) {
    return RosValueParam
  }
  if (type instanceof RosTypeType) {
    return RosTypeParam
  }
  if (type instanceof RosNameType) {
    return RosNameParam
  }
  if (type instanceof BuiltinOrRosType) {
    return SwitchTypeParam
  }
  if (
    type instanceof ReferenceType ||
    type instanceof ReferenceListType ||
    type instanceof ReferenceDictType
  ) {
    return ReferenceParam
  }
  return undefined
})
</script>

<template>
  <component
    :is="param_component"
    v-if="param_component !== undefined"
    v-model="value"
    :type="type"
  />
  <div v-else>Unknown param type</div>
</template>
