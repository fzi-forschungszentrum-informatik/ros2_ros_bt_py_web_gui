<!--
 *  Copyright 2024 FZI Forschungszentrum Informatik
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
import { useEditorStore } from '@/stores/editor'
import { useROSStore } from '@/stores/ros'
import {
  TreeExecutionCommands,
  type ControlTreeExecutionRequest,
  type ControlTreeExecutionResponse
} from '@/types/services/ControlTreeExecution'
import { notify } from '@kyvg/vue3-notification'

const editor_store = useEditorStore()
const ros_store = useROSStore()

function controlExec(command: TreeExecutionCommands) {
  if (!ros_store.connected) {
    notify({
      title: 'Service not available!',
      text: 'ControlTreeExection service is not connected.',
      type: 'error'
    })
    return
  }
  editor_store.runNewCommand(command)
  ros_store.control_tree_execution_service.callService(
    {
      command: command
    } as ControlTreeExecutionRequest,
    (response: ControlTreeExecutionResponse) => {
      editor_store.removeRunningCommand(command)
      if (response.success) {
        notify({
          title: 'Running tree command',
          type: 'success'
        })
      } else {
        notify({
          title: 'Running the tree command failed!',
          type: 'error',
          text: response.error_message
        })
      }
    }
  )
}
</script>

<template>
  <div class="btn-group">
    <button
      class="btn btn-primary"
      title="Tick Once"
      @click="() => controlExec(TreeExecutionCommands.TICK_ONCE)"
    >
      <FontAwesomeIcon
        v-if="editor_store.running_commands.has(TreeExecutionCommands.TICK_ONCE)"
        icon="fas fa-check"
        spin
        aria-hidden="true"
      />
      <FontAwesomeIcon v-else icon="fas fa-check" aria-hidden="true" />
      <span class="ms-1 hide-button-text-control">Tick Once</span>
    </button>
    <button
      class="btn btn-primary btn-spaced"
      title="Tick Periodically"
      @click="() => controlExec(TreeExecutionCommands.TICK_PERIODICALLY)"
    >
      <FontAwesomeIcon
        v-if="editor_store.running_commands.has(TreeExecutionCommands.TICK_PERIODICALLY)"
        icon="fas fa-sync"
        spin
        aria-hidden="true"
      />
      <FontAwesomeIcon v-else icon="fas fa-sync" aria-hidden="true" />
      <span class="ms-1 hide-button-text-control"> Tick Periodically </span>
    </button>
    <button
      class="btn btn-primary btn-spaced"
      title="Tick Until Result"
      @click="() => controlExec(TreeExecutionCommands.TICK_UNTIL_RESULT)"
    >
      <FontAwesomeIcon
        v-if="editor_store.running_commands.has(TreeExecutionCommands.TICK_UNTIL_RESULT)"
        icon="fas fa-play"
        spin
        aria-hidden="true"
      />
      <FontAwesomeIcon v-else icon="fas fa-play" aria-hidden="true" />
      <span class="ms-1 hide-button-text-control"> Tick Until Result </span>
    </button>
    <button
      class="btn btn-primary btn-spaced"
      title="Stop"
      @click="() => controlExec(TreeExecutionCommands.STOP)"
    >
      <FontAwesomeIcon
        v-if="editor_store.running_commands.has(TreeExecutionCommands.STOP)"
        icon="fas fa-stop"
        spin
        aria-hidden="true"
      />
      <FontAwesomeIcon v-else icon="fas fa-stop" aria-hidden="true" />
      <i class="{stop_classes}"></i>
      <span class="ms-1 hide-button-text-control">Stop</span>
    </button>
    <button
      class="btn btn-primary btn-spaced"
      title="Reset"
      @click="() => controlExec(TreeExecutionCommands.RESET)"
    >
      <FontAwesomeIcon
        v-if="editor_store.running_commands.has(TreeExecutionCommands.RESET)"
        icon="fas fa-undo"
        spin
        aria-hidden="true"
      />
      <FontAwesomeIcon v-else icon="fas fa-undo" aria-hidden="true" />
      <span class="ms-1 hide-button-text-control">Reset</span>
    </button>
    <button
      class="btn btn-primary btn-spaced"
      title="Shutdown"
      @click="() => controlExec(TreeExecutionCommands.SHUTDOWN)"
    >
      <FontAwesomeIcon
        v-if="editor_store.running_commands.has(TreeExecutionCommands.SHUTDOWN)"
        icon="fas fa-power-off"
        spin
        aria-hidden="true"
      />
      <FontAwesomeIcon v-else icon="fas fa-power-off" aria-hidden="true" />
      <span class="ms-1 hide-button-text-control">Shutdown</span>
    </button>
  </div>
</template>

<style lang="scss"></style>
