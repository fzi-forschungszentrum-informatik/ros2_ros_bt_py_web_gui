<script setup lang="ts">
import { useEditorStore } from '@/stores/editor'
import { useErrorReportsStore } from '@/stores/error_list'
import { useROSStore } from '@/stores/ros'
import type { ContinueRequest, ContinueResponse } from '@/types/services/Continue'
import type {
  SetExecutionModeRequest,
  SetExecutionModeResponse
} from '@/types/services/SetExecutionMode'
import type { DebugSettings } from '@/types/types'
import { uuid } from '@/utils'
import { onMounted, onUnmounted, onUpdated, ref } from 'vue'

const debug_check_id = 'debug_' + uuid()
const publish_subtrees_id = 'publish_subtrees_' + uuid()

const ros_store = useROSStore()
const editor_store = useEditorStore()
const error_store = useErrorReportsStore()

const debugging = ref<boolean>(false)
const publish_subtrees = ref<boolean>(false)

function onNewDebugSettingsMsg(msg: DebugSettings) {
  console.log(msg)
  editor_store.enableDebugging(msg.single_step)
  editor_store.enableSubtreePublishing(msg.publish_subtrees)
}

function onClickStep() {
  if (ros_store.step_service === undefined) {
    error_store.reportError('Step service not available!')
    return
  }
  ros_store.step_service.callService({} as ContinueRequest, (response: ContinueResponse) => {
    if (response.success) {
      console.log('stepped successfully')
    } else {
      error_store.reportError(response.error_message)
    }
  })
}

function handleDebugChange(event: Event) {
  const target = event.target as HTMLInputElement

  if (ros_store.set_execution_mode_service === undefined) {
    error_store.reportError('SetExecutionMode service not available!')
    return
  }

  const enable = target.checked
  ros_store.set_execution_mode_service.callService(
    {
      single_step: enable,
      publish_subtrees: publish_subtrees.value,
      collect_performance_data: true
    } as SetExecutionModeRequest,
    (_response: SetExecutionModeResponse) => {
      console.log('Set execution mode')
    }
  )
  debugging.value = enable
}

function handlePubSubtreesChange(event: Event) {
  const target = event.target as HTMLInputElement

  if (ros_store.set_execution_mode_service === undefined) {
    error_store.reportError('SetExecutionMode service not available!')
    return
  }
  const enable = target.checked

  ros_store.set_execution_mode_service.callService(
    {
      single_step: debugging.value,
      publish_subtrees: enable,
      collect_performance_data: true
    } as SetExecutionModeRequest,
    (_response: SetExecutionModeResponse) => {
      console.log('Set execution mode')
    }
  )
  publish_subtrees.value = enable
}

const debug_subscribed = ref<boolean>(false)

ros_store.$onAction(({ name, store, args, after, onError }) => {
  if (name !== 'changeNamespace') {
    return
  }

  after((result) => {
    if (ros_store.debug_settings_sub === undefined) {
      debug_subscribed.value = false
      return
    } else {
      if (!debug_subscribed.value) {
        console.log('subscribed!')
        ros_store.debug_settings_sub.subscribe(onNewDebugSettingsMsg)
        debug_subscribed.value = true
      }
    }
  })
})

onMounted(() => {
  if (ros_store.debug_settings_sub === undefined) {
    debug_subscribed.value = false
    return
  } else {
    if (!debug_subscribed.value) {
      console.log('subscribed on mount!')
      ros_store.debug_settings_sub.subscribe(onNewDebugSettingsMsg)
      debug_subscribed.value = true
    }
  }
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
