import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useErrorReportsStore = defineStore('error_reports', () => {
  const errors = ref<string[]>([])
  const error_count = computed<number>(() => errors.value.length)
  function reportError(msg: string) {
    errors.value.push(msg)
  }
  function clearErrors() {
    errors.value = []
  }

  return { errors, error_count, reportError, clearErrors }
})
