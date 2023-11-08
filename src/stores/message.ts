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

  function updateAvailableMessages(new_messages: Message[]) {
    messages.value = new_messages
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
