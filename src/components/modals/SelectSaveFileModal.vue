<script setup lang="ts">
import { ref } from 'vue'
import { VueFinalModal } from 'vue-final-modal'

const emit = defineEmits<{
  (event: 'save', file_url: string): void
}>()

const selected_save_file_path = ref<string>('')
</script>

<template>
  <VueFinalModal
    class="flex justify-center items-center"
    content-class="flex flex-col max-w-xl mx-4 p-4 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg space-y-2"
  >
    <h1 class="text-xl">Save Tree to Folder</h1>
    <slot />
    <button
      class="mt-1 ml-auto px-2 border rounded-lg"
      @click="emit('save', selected_save_file_path)"
    >
      Confirm
    </button>
  </VueFinalModal>
</template>
