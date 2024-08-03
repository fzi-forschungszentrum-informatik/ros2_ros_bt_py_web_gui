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
import type { ContinueRequest, ContinueResponse } from '@/types/services/Continue'
import type { SetExecutionModeRequest } from '@/types/services/SetExecutionMode'
import type { DebugSettings } from '@/types/types'
import { uuid } from '@/utils'
import { onMounted, ref } from 'vue'
import { notify } from '@kyvg/vue3-notification'

const debug_check_id = 'debug_' + uuid()
const publish_subtrees_id = 'publish_subtrees_' + uuid()

const ros_store = useROSStore()
const editor_store = useEditorStore()

const debugging = ref<boolean>(false)
const publish_subtrees = ref<boolean>(false)

function onNewDebugSettingsMsg(msg: DebugSettings) {
  editor_store.enableDebugging(msg.single_step)
  editor_store.enableSubtreePublishing(msg.publish_subtrees)
}

function onClickStep() {
  if (ros_store.step_service === undefined) {
    notify({
      title: 'Service not available!',
      text: 'Step ROS service is not connected!',
      type: 'error'
    })
    return
  }
  ros_store.step_service.callService({} as ContinueRequest, (response: ContinueResponse) => {
    if (response.success) {
      notify({
        title: 'Step performed!',
        type: 'success'
      })
    } else {
      notify({
        title: 'Step Service Error',
        text: response.error_message,
        type: 'error'
      })
    }
  })
}

//TODO this is deprecated
function handleDebugChange(event: Event) {
  const target = event.target as HTMLInputElement

  const enable = target.checked
  if (!ros_store.connected) {
    notify({
      title: 'Service not available!',
      text: 'SetExecutionMode ROS service is not connected!',
      type: 'error'
    })
    return
  }

  ros_store.set_execution_mode_service.callService(
    {
      single_step: enable,
      publish_subtrees: publish_subtrees.value,
      collect_performance_data: true
    } as SetExecutionModeRequest,
    () => {
      notify({
        title: 'Settings updated',
        text: 'BT execution settings updated!',
        type: 'info'
      })
    }
  )
  debugging.value = enable
}

//TODO this is deprecated
function handlePubSubtreesChange(event: Event) {
  const target = event.target as HTMLInputElement

  if (!ros_store.connected) {
    notify({
      title: 'Service not available!',
      text: 'SetExecutionMode ROS service is not connected!',
      type: 'error'
    })
    return
  }
  const enable = target.checked

  ros_store.set_execution_mode_service.callService(
    {
      single_step: debugging.value,
      publish_subtrees: enable,
      collect_performance_data: true
    } as SetExecutionModeRequest,
    () => {
      notify({
        title: 'Settings updated',
        text: 'BT execution settings updated!',
        type: 'info'
      })
    }
  )
  publish_subtrees.value = enable
}

//TODO this is deprecated
/**
 * Manage the subscription to the debug settings topic.
 * If the topic subsciber is present and we are not currently subscribed, we will subscribe.
 */
function updateDebugSubscription() {
  ros_store.debug_settings_sub.subscribe(onNewDebugSettingsMsg)
}

ros_store.$onAction(({ name, after }) => {
  if (name !== 'changeNamespace') {
    return
  }

  after(() => {
    updateDebugSubscription()
  })
})

onMounted(() => {
  updateDebugSubscription()
})
</script>

<template>
  <div class="form-check m-1">
    <input
      type="checkbox"
      v-bind:id="debug_check_id"
      class="form-check-input"
      v-bind:checked="debugging"
      @change="handleDebugChange"
    />
    <label class="form-check-label" v-bind:for="debug_check_id"> Debug </label>
  </div>
  <div class="form-check m-1">
    <input
      type="checkbox"
      v-bind:id="publish_subtrees_id"
      class="form-check-input"
      v-bind:checked="publish_subtrees"
      @change="handlePubSubtreesChange"
    />
    <label class="form-check-label" v-bind:for="publish_subtrees_id"> Publish Subtrees </label>
  </div>
  <button @click="onClickStep" class="btn btn-primary ms-1" v-if="editor_store.debug">
    <font-awesome-icon
      icon="fa-solid fa-step-forward"
      aria-hidden="true"
      class="show-button-icon"
    />
    <span class="ms-1 hide-button-text-control">Step</span>
  </button>
</template>

<style lang="scss">
@import 'src/assets/utils.scss';
</style>
