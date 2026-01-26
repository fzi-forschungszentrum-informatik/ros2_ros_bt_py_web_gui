<!--
 *  Copyright 2026 FZI Forschungszentrum Informatik
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
import { useLogsStore } from '@/stores/logs'
import { LogLevel, type LogMessage, type UUIDString } from '@/types/types'
import { computed, ref } from 'vue'

const props = defineProps<{
  tree_id?: UUIDString
  node_id?: UUIDString
}>()

const log_store = useLogsStore()

const debug = ref<boolean>(false)
const info = ref<boolean>(true)
const warn = ref<boolean>(true)
const error = ref<boolean>(true)

const log_levels = computed<LogLevel[]>(() => {
  const levels = [LogLevel.FATAL]
  if (error.value) {
    levels.push(LogLevel.ERROR)
  }
  if (warn.value) {
    levels.push(LogLevel.WARN)
  }
  if (info.value) {
    levels.push(LogLevel.INFO)
  }
  if (debug.value) {
    levels.push(LogLevel.DEBUG)
  }
  return levels
})

const log_messages = computed<LogMessage[]>(() => {
  return log_store.getRelevantLogs(props.tree_id, props.node_id, log_levels.value)
})

function logLevelString(level: LogLevel): string {
  switch (level) {
    case LogLevel.DEBUG:
      return 'DEBUG'
    case LogLevel.INFO:
      return 'INFO'
    case LogLevel.WARN:
      return 'WARN'
    case LogLevel.ERROR:
      return 'ERROR'
    case LogLevel.FATAL:
      return 'FATAL'
    default:
      return 'UNKNOWN'
  }
}

function logLevelStyles(level: LogLevel): string {
  switch (level) {
    case LogLevel.DEBUG:
      return 'text-secondary-emphasis'
    case LogLevel.INFO:
      return 'text-info-emphasis'
    case LogLevel.WARN:
      return 'text-warning-emphasis'
    case LogLevel.ERROR:
      return 'text-danger-emphasis'
    case LogLevel.FATAL:
      return 'text-danger-emphasis fw-bold'
    default:
      return ''
  }
}

function clearLogDisplay() {
  log_store.clearRelevantLogs(props.tree_id, props.node_id, log_levels.value)
}
</script>

<template>
  <div class="d-flex flex-column">
    <div class="mb-3 d-flex justify-content-between">
      <div>
        <button
          type="button"
          class="btn btn-sm mx-1"
          :class="debug ? 'btn-secondary' : 'btn-outline-secondary'"
          @click="() => (debug = !debug)"
        >
          Debug
        </button>
        <button
          type="button"
          class="btn btn-sm mx-1"
          :class="info ? 'btn-info' : 'btn-outline-info'"
          @click="() => (info = !info)"
        >
          Info
        </button>
        <button
          type="button"
          class="btn btn-sm mx-1"
          :class="warn ? 'btn-warning' : 'btn-outline-warning'"
          @click="() => (warn = !warn)"
        >
          Warning
        </button>
        <button
          type="button"
          class="btn btn-sm mx-1"
          :class="error ? 'btn-danger' : 'btn-outline-danger'"
          @click="() => (error = !error)"
        >
          Error
        </button>
      </div>
      <button type="button" class="btn btn-sm btn-outline-secondary" @click="clearLogDisplay">
        <FontAwesomeIcon icon="fa-solid fa-trash-can" />
      </button>
    </div>
    <div class="overflow-auto flex-grow-1">
      <div
        v-for="log_msg in log_messages"
        :key="log_msg.stamp.getTime()"
        class="border border-3 bg-body p-1 my-1"
      >
        <div v-if="log_msg.tree === undefined">
          General
        </div>
        <div v-else-if="log_msg.node === undefined">
          Tree <span class="text-primary">{{ log_msg.tree.name }}</span>
        </div>
        <div v-else>
          Node <span class="text-primary">{{ log_msg.node.name }}</span> in Tree
          <span class="text-primary">{{ log_msg.tree.name }}</span>
        </div>
        <div :class="logLevelStyles(log_msg.level)">
          {{ log_msg.msg }}
          &ensp; [{{ logLevelString(log_msg.level) }}]
        </div>
        <hr class="my-1" />
        <div>
          <span class="text-primary-emphasis font-monospace">{{ log_msg.function }}</span>
          &ensp;
          <span class="text-body-secondary">{{ log_msg.file }}:{{ log_msg.line }}</span>
        </div>
        <div class="d-flex justify-content-between align-items-end mt-1">
          <small class="text-body-tertiary">{{ log_msg.stamp.toUTCString() }}</small>
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            @click="() => log_store.removeLogMessage(log_msg)"
          >
            <FontAwesomeIcon icon="fa-solid fa-trash-can" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style></style>
