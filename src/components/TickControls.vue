<script setup lang="ts">
import { useEditorStore } from '@/stores/editor'
import { useROSStore } from '@/stores/ros'
import type {
  ControlTreeExecutionRequest,
  ControlTreeExecutionResponse,
  TreeExecutionCommands
} from '@/types/services/ControlTreeExecution'
import { notify } from '@kyvg/vue3-notification'

const editor_store = useEditorStore()
const ros_store = useROSStore()

function controlExec(command: TreeExecutionCommands) {
  editor_store.runNewCommand(command)
  if (ros_store.tick_service === undefined) {
    console.warn('ControlTreeExecution service is undefined!')
    return
  }

  ros_store.tick_service.callService(
    {
      command: command
    } as ControlTreeExecutionRequest,
    (response: ControlTreeExecutionResponse) => {
      if (response.success) {
        editor_store.removeRunningCommand(command)
      } else {
        notify({
          title: 'Sending tree execution command failed!',
          type: 'error',
          text: response.error_message
        })
      }
    }
  )
}
</script>

<template>
  <button @click="() => controlExec(1)" class="btn btn-primary ms-1" title="Tick Once">
    <font-awesome-icon
      v-if="editor_store.running_commands.has(1)"
      icon="fas fa-check"
      spin
      class="show-button-icon"
      aria-hidden="true"
    />
    <font-awesome-icon v-else icon="fas fa-check" class="show-button-icon" aria-hidden="true" />
    <span class="ms-1 hide-button-text-control">Tick Once</span>
  </button>
  <button @click="() => controlExec(2)" class="btn btn-primary ms-1" title="Tick Periodically">
    <font-awesome-icon
      v-if="editor_store.running_commands.has(2)"
      icon="fas fa-sync"
      spin
      class="show-button-icon"
      aria-hidden="true"
    />
    <font-awesome-icon v-else icon="fas fa-sync" class="show-button-icon" aria-hidden="true" />
    <span class="ms-1 hide-button-text-control"> Tick Periodically </span>
  </button>
  <button @click="() => controlExec(3)" class="btn btn-primary ms-1" title="Tick Until Result">
    <font-awesome-icon
      v-if="editor_store.running_commands.has(3)"
      icon="fas fa-play"
      spin
      class="show-button-icon"
      aria-hidden="true"
    />
    <font-awesome-icon v-else icon="fas fa-play" class="show-button-icon" aria-hidden="true" />
    <span class="ms-1 hide-button-text-control"> Tick Until Result </span>
  </button>
  <button @click="() => controlExec(4)" class="btn btn-primary ms-1" title="Stop">
    <font-awesome-icon
      v-if="editor_store.running_commands.has(4)"
      icon="fas fa-stop"
      spin
      class="show-button-icon"
      aria-hidden="true"
    />
    <font-awesome-icon v-else icon="fas fa-stop" class="show-button-icon" aria-hidden="true" />
    <i class="{stop_classes}"></i>
    <span class="ms-1 hide-button-text-control">Stop</span>
  </button>
  <button @click="() => controlExec(5)" class="btn btn-primary ms-1" title="Reset">
    <font-awesome-icon
      v-if="editor_store.running_commands.has(4)"
      icon="fas fa-undo"
      spin
      class="show-button-icon"
      aria-hidden="true"
    />
    <font-awesome-icon v-else icon="fas fa-undo" class="show-button-icon" aria-hidden="true" />
    <span class="ms-1 hide-button-text-control">Reset</span>
  </button>
  <button @click="() => controlExec(6)" class="btn btn-primary ms-1" title="Shutdown">
    <font-awesome-icon
      v-if="editor_store.running_commands.has(4)"
      icon="fas fa-power-off"
      spin
      class="show-button-icon"
      aria-hidden="true"
    />
    <font-awesome-icon v-else icon="fas fa-power-off" class="show-button-icon" aria-hidden="true" />
    <span class="ms-1 hide-button-text-control">Shutdown</span>
  </button>
</template>

<style lang="scss">
@import 'src/assets/utils.scss';
</style>
