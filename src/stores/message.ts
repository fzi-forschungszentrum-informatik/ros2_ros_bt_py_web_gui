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
import type { Message } from '@/types/types'
import Fuse from 'fuse.js'
import { defineStore } from 'pinia'
import { ref } from 'vue'


export const useMessasgeStore = defineStore('messages', () => {
  const messages_fuse_options = {
    shouldSort: true,
    threshold: 0.3,
    location: 0,
    distance: 100,
    maxPatternLength: 200,
    minMatchCharLength: 3,
    keys: ['msg'],
    isCaseSensitive: false,
    ignoreLocation: true,
    useExtendedSearch: true
  }
  const messages = ref<Message[]>([])
  const messages_fuse = ref<Fuse<Message>>(new Fuse([], messages_fuse_options))
  const messages_available = ref<boolean>(false)

  function areMessagesAvailable(available: boolean) {
    messages_available.value = available
  }

  function mapMessageTypes(message: Message): Message[] {
    const message_parts = message.msg.split('/')
    if (message_parts.length !== 3) {
      return []
    }
    if (message.service) {
      const new_msg = message_parts[0] + '.srv.' + message_parts[2]
      return [
        {
          msg: new_msg,
          service: true,
          action: false
        },
        {
          msg: new_msg + ".Request",
          service: true,
          action: false
        },
        {
          msg: new_msg + ".Response",
          service: true,
          action: false
        },
      ]
    }
    if (message.action) {
      const new_msg = message_parts[0] + '.action.' + message_parts[2]
      return [
        {
          msg: new_msg,
          action: true,
          service: false
        },
        {
          msg: new_msg + ".Goal",
          action: true,
          service: false
        },
        {
          msg: new_msg + ".Result",
          action: true,
          service: false
        },
        {
          msg: new_msg + ".Feedback",
          action: true,
          service: false
        },
      ]
    }
    return [{
      msg: message_parts[0] + ".msg." + message_parts[2],
      service: false,
      action: false
    }]
  }

  function updateAvailableMessages(new_messages: Message[]) {
    messages.value = new_messages.flatMap(mapMessageTypes)
    messages_fuse.value = new Fuse(messages.value, messages_fuse_options)
  }

  return {
    messages,
    messages_fuse,
    messages_available,
    areMessagesAvailable,
    updateAvailableMessages
  }
})
