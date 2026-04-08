<!--
 *  Copyright 2024-2026 FZI Forschungszentrum Informatik
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
import { useMessageStore } from '@/stores/message'
import type { RosTypeType } from '@/types/data_classes'
import SearchableInput from '../SearchableInput.vue'
import Fuse from 'fuse.js'
import { RosTypeValues } from '@/types/data_types'
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  type: RosTypeType
}>()

const value = defineModel<string>({
  get(value) {
    return props.type.parseValue(value)
  },
  set(value) {
    return props.type.serializeValue(value)
  }
})

// We can't directly pass the value through (by doing `v-model="value"`)
//   because the serialization step for the outer model breaks deep reactivity
const inner_value = ref<string>(value.value || '')
watch(inner_value, (val) => {
  if (props.type.validate(val) === '') {
    value.value = val
  }
})

const message_store = useMessageStore()

const item_list = computed<string[]>(() => {
  switch (props.type.interface_kind) {
    case RosTypeValues.ROS_TOPIC:
      return message_store.ros_topic_messages.map((x) => x.name)
    case RosTypeValues.ROS_SERVICE:
      return message_store.ros_service_messages
    case RosTypeValues.ROS_ACTION:
      return message_store.ros_action_messages
    case RosTypeValues.ROS_COMPONENT:
      return message_store.ros_all_messages
    default:
      return []
  }
})

const search_fuse = computed<Fuse<string>>(() => {
  switch (props.type.interface_kind) {
    case RosTypeValues.ROS_TOPIC:
      return message_store.ros_topic_type_fuse
    case RosTypeValues.ROS_SERVICE:
      return message_store.ros_service_type_fuse
    case RosTypeValues.ROS_ACTION:
      return message_store.ros_action_type_fuse
    case RosTypeValues.ROS_COMPONENT:
      return message_store.ros_all_messages_fuse
    default:
      return new Fuse<string>([])
  }
})
</script>

<template>
  <SearchableInput
    v-model="inner_value"
    :item_list="item_list"
    :search_fuse="search_fuse"
    :validate="true"
    :parse="(x) => x"
    :search_target="(x) => x"
    :to_string="(x) => x"
    :render_function="(x) => x"
  />
</template>
