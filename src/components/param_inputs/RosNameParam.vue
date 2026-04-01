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
import { RosTypeType, RosNameType } from '@/types/data_classes'
import { RosTypeValues } from '@/types/data_types'
import type { Channel } from '@/types/types'
import Fuse from 'fuse.js'
import { computed } from 'vue'
import SearchableInput from '../SearchableInput.vue'
import { useEditNodeStore } from '@/stores/edit_node'
import type { NodeData } from '@/types/editor_types'

const props = defineProps<{
  type: RosNameType
}>()

const value = defineModel<string>({
  get(value) {
    return props.type.parseValue(value)
  },
  set(value) {
    return props.type.serializeValue(value)
  }
})

const edit_node_store = useEditNodeStore()
const message_store = useMessageStore()

const related_type_field = computed<NodeData | undefined>(() => {
  if (props.type.interface_id === 0) {
    return undefined
  }
  return edit_node_store.new_node_inputs.find((input) => {
    if (!(input.type instanceof RosTypeType)) {
      return false
    }
    return input.type.interface_id === props.type.interface_id
  })
})

const channel_value = computed<Channel>({
  get() {
    return { name: value.value || '', type: '' }
  },
  set(val) {
    value.value = val.name
    if (related_type_field.value !== undefined && val.type !== '') {
      related_type_field.value.serialized_value = related_type_field.value.type.serializeValue(
        val.type
      )
    }
  }
})

const item_list = computed<Channel[]>(() => {
  switch (props.type.interface_kind) {
    case RosTypeValues.ROS_TOPIC:
      return message_store.ros_topic_channels
    case RosTypeValues.ROS_SERVICE:
      return message_store.ros_service_channels
    case RosTypeValues.ROS_ACTION:
      return message_store.ros_action_channels
    default:
      return []
  }
})

const search_fuse = computed<Fuse<Channel>>(() => {
  switch (props.type.interface_kind) {
    case RosTypeValues.ROS_TOPIC:
      return message_store.ros_topic_name_fuse
    case RosTypeValues.ROS_SERVICE:
      return message_store.ros_service_name_fuse
    case RosTypeValues.ROS_ACTION:
      return message_store.ros_action_name_fuse
    default:
      return new Fuse<Channel>([])
  }
})

function renderChannel(channel: Channel) {
  return `${channel.name}<br /><small>${channel.type}</small>`
}
</script>

<template>
  <SearchableInput
    v-model="channel_value"
    :item_list="item_list"
    :search_fuse="search_fuse"
    :validate="false"
    :parse="
      (x) => {
        return { name: x, type: '' }
      }
    "
    :search_target="
      (x) => {
        return { name: x.name }
      }
    "
    :to_string="(x) => x.name"
    :render_function="renderChannel"
  />
</template>

<style scoped lang="scss"></style>
