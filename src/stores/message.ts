import type { Message } from '@/types/types'
import Fuse from 'fuse.js'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMessasgeStore = defineStore('messages', () => {
  const messages = ref<Message[]>([])
  const messages_fuse = ref<Fuse<Message>>(new Fuse([]))
  const messages_available = ref<boolean>(false)

  function areMessagesAvailable(available: boolean) {
    messages_available.value = available
  }

  function updateAvailableMessages(new_messages: Message[]) {
    messages.value = new_messages
    messages_fuse.value = new Fuse(messages.value)
  }

  return {
    messages,
    messages_fuse,
    messages_available,
    areMessagesAvailable,
    updateAvailableMessages
  }
})
