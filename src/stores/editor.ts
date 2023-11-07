import { ref } from 'vue'
import { defineStore } from 'pinia'
import { TreeExecutionCommands } from '@/types/services/ControlTreeExecution'

export const useEditorStore = defineStore('editor', () => {
  const publish_subtrees = ref<boolean>(false)
  const debug = ref<boolean>(false)
  const running_commands = ref<Set<TreeExecutionCommands>>(new Set<TreeExecutionCommands>())

  function enableSubtreePublishing(enable: boolean) {
    publish_subtrees.value = enable
  }

  function enableDebugging(enable: boolean) {
    debug.value = enable
  }

  function runNewCommand(new_command: TreeExecutionCommands) {
    running_commands.value.add(new_command)
  }

  function removeRunningCommand(command: TreeExecutionCommands) {
    running_commands.value.delete(command)
  }

  return { publish_subtrees, debug, running_commands, runNewCommand, removeRunningCommand, enableSubtreePublishing, enableDebugging }
})
