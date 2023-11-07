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
      console.log('stepped successfully')
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

function handleDebugChange(event: Event) {
  const target = event.target as HTMLInputElement

  if (ros_store.set_execution_mode_service === undefined) {
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

function handlePubSubtreesChange(event: Event) {
  const target = event.target as HTMLInputElement

  if (ros_store.set_execution_mode_service === undefined) {
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

const debug_subscribed = ref<boolean>(false)

/**
 * Manage the subscription to the debug settings topic.
 * If the topic subsciber is present and we are not currently subscribed, we will subscribe.
 */
function updateDebugSubscription() {
  if (ros_store.debug_settings_sub === undefined) {
    debug_subscribed.value = false
    return
  } else {
    if (!debug_subscribed.value) {
      ros_store.debug_settings_sub.subscribe(onNewDebugSettingsMsg)
      debug_subscribed.value = true
    }
  }
}

ros_store.$onAction(({ name, after }) => {
  if (name !== 'changeNamespace') {
    return
  }

  after(() => {
    debug_subscribed.value = false
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
