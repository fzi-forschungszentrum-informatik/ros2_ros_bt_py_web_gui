<!--
 *  Copyright 2025-2026 FZI Forschungszentrum Informatik
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
import { useLogsStore } from '@/stores/logs'
import { useROSStore } from '@/stores/ros'
import type { SetBoolRequest, SetBoolResponse } from '@/types/services/SetBool'
import { LogLevel } from '@/types/types'
import { notify } from '@kyvg/vue3-notification'

const editor_store = useEditorStore()
const log_store = useLogsStore()
const ros_store = useROSStore()

function setPublishData(event: Event) {
  const target = event.target as HTMLInputElement

  ros_store.set_publish_data_service.callService(
    {
      data: target.checked
    } as SetBoolRequest,
    (response: SetBoolResponse) => {
      if (response.success) {
        notify({
          title: (target.checked ? 'Enable' : 'Disable') + ' data publishing',
          type: 'success'
        })
        editor_store.publish_data = target.checked
      } else {
        notify({
          title: 'Failed to toggle data publishing',
          text: response.message,
          type: 'warn'
        })
      }
    },
    (error: string) => {
      notify({
        title: 'Failed to call setPublishData service',
        text: error,
        type: 'error'
      })
    }
  )
}

function setMinLogLevel(event: Event) {
  const level = (event.target as HTMLSelectElement).value
  log_store.setMinLogLevel(parseInt(level))
}
</script>

<template>
  <div class="h4 mb-3">General Settings</div>

  <div class="input-group mb-3">
    <label class="input-group-text"> Min Log Level </label>
    <select class="form-select" @change="setMinLogLevel">
      <template v-for="level in Object.values(LogLevel)" :key="level">
        <!--This ugly v-if check is necessary because enums can't trivially be iterated-->
        <option
          v-if="typeof level === 'number'"
          :value="level"
          :selected="log_store.min_log_level === level"
        >
          {{ log_store.getLogLevelString(level as LogLevel) }}
        </option>
      </template>
    </select>
  </div>

  <div class="form-check form-switch mb-3 fs-5">
    <input
      type="checkbox"
      class="form-check-input"
      :checked="editor_store.publish_data"
      @click="setPublishData"
    />
    <label class="form-check-label ms-2"> Transmit data flow information </label>
  </div>
</template>
