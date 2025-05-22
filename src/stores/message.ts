/*
 * Copyright 2024 FZI Forschungszentrum Informatik
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *    * Redistributions of source code must retain the above copyright
 *      notice, this list of conditions and the following disclaimer.
 *
 *    * Redistributions in binary form must reproduce the above copyright
 *      notice, this list of conditions and the following disclaimer in the
 *      documentation and/or other materials provided with the distribution.
 *
 *    * Neither the name of the {copyright_holder} nor the names of its
 *      contributors may be used to endorse or promote products derived from
 *      this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */
import type { Channel, Channels, MessageTypes } from '@/types/types'
import Fuse, { type IFuseOptions } from 'fuse.js'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMessasgeStore = defineStore('messages', () => {
  const messages_fuse_options = {
    shouldSort: true,
    threshold: 0.3,
    location: 0,
    distance: 100,
    maxPatternLength: 200,
    minMatchCharLength: 1,
    isCaseSensitive: false,
    ignoreLocation: true,
    useExtendedSearch: true
  } as IFuseOptions<string>
  const messages = ref<string[]>([])
  const messages_fuse = ref<Fuse<string>>(new Fuse([], messages_fuse_options))
  const messages_available = ref<boolean>(false)

  // These additional fuses are meant to substitute/replace the above messages_fuse
  //  to allow to search specific kinds of ros types dependent on what is needed.
  const ros_type_fuse_options = structuredClone(messages_fuse_options)
  ros_type_fuse_options.keys = []
  // This type conversion is necessary, because we target a different type of data
  const ros_name_fuse_options = structuredClone(
    messages_fuse_options
  ) as unknown as IFuseOptions<Channel>
  ros_name_fuse_options.keys = ['name', 'type']

  const ros_topic_type_fuse = ref<Fuse<string>>(new Fuse([], ros_type_fuse_options))
  const ros_service_type_fuse = ref<Fuse<string>>(new Fuse([], ros_type_fuse_options))
  const ros_action_type_fuse = ref<Fuse<string>>(new Fuse([], ros_type_fuse_options))

  const ros_all_messages_fuse = ref<Fuse<string>>(new Fuse([], ros_type_fuse_options))

  const ros_topic_name_fuse = ref<Fuse<Channel>>(new Fuse([], ros_name_fuse_options))
  const ros_service_name_fuse = ref<Fuse<Channel>>(new Fuse([], ros_name_fuse_options))
  const ros_action_name_fuse = ref<Fuse<Channel>>(new Fuse([], ros_name_fuse_options))

  function areMessagesAvailable(available: boolean) {
    messages_available.value = available
  }

  function addMessageTypes(message: string): void {
    const message_parts = message.split('/')
    if (message_parts.length !== 3) {
      return
    }
    messages.value.push(message_parts[0] + '.' + message_parts[1] + '.' + message_parts[2])
  }

  function addServiceMessages(message: string): void {
    ros_all_messages_fuse.value.add(message + '_Request')
    ros_all_messages_fuse.value.add(message + '_Response')
  }

  function addActionMessages(message: string): void {
    ros_all_messages_fuse.value.add(message + '_Goal')
    ros_all_messages_fuse.value.add(message + '_Result')
    ros_all_messages_fuse.value.add(message + '_Feedback')
  }

  function updateAvailableMessages(new_messages: MessageTypes) {
    messages.value = []
    ros_topic_type_fuse.value.setCollection(new_messages.topics)
    ros_service_type_fuse.value.setCollection(new_messages.services)
    ros_action_type_fuse.value.setCollection(new_messages.actions)

    ros_all_messages_fuse.value.setCollection(new_messages.topics)
    new_messages.services.forEach(addServiceMessages)
    new_messages.actions.forEach(addActionMessages)

    new_messages.topics.forEach(addMessageTypes)

    messages_fuse.value.setCollection(messages.value)
  }

  function updateMessageChannels(new_channels: Channels) {
    ros_topic_name_fuse.value.setCollection(new_channels.topics)
    ros_service_name_fuse.value.setCollection(new_channels.services)
    ros_action_name_fuse.value.setCollection(new_channels.actions)
  }

  return {
    messages,
    messages_fuse,
    messages_available,
    ros_topic_type_fuse,
    ros_service_type_fuse,
    ros_action_type_fuse,
    ros_all_messages_fuse,
    ros_topic_name_fuse,
    ros_service_name_fuse,
    ros_action_name_fuse,
    areMessagesAvailable,
    updateAvailableMessages,
    updateMessageChannels
  }
})
