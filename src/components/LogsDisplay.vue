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
import { useEditNodeStore } from '@/stores/edit_node'
import { useEditorStore } from '@/stores/editor'
import { useLogsStore } from '@/stores/logs'
import { LogLevel, type LogMessage, type UUIDString } from '@/types/types'
import { computed, ref, watch } from 'vue'
import * as uuid from 'uuid'
import { findTree } from '@/tree_selection'

const props = defineProps<{
  tree_id?: UUIDString
  node_id?: UUIDString
}>()

const log_store = useLogsStore()
const editor_store = useEditorStore()
const edit_node_store = useEditNodeStore()

// False means toggled off, null means unavailable due to backend settings.
const debug = ref<boolean | null>(null)
const info = ref<boolean | null>(null)
const warn = ref<boolean | null>(null)
const error = ref<boolean | null>(null)

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

watch(() => log_store.min_log_level, updateLogLevels, {
  immediate: true
})
function updateLogLevels(min_log_level: LogLevel) {
  if (min_log_level >= LogLevel.FATAL) {
    error.value = null
  } else {
    error.value = true
  }
  if (min_log_level >= LogLevel.ERROR) {
    warn.value = null
  } else {
    warn.value = true
  }
  if (min_log_level >= LogLevel.WARN) {
    info.value = null
  } else {
    info.value = true
  }
  if (min_log_level >= LogLevel.INFO) {
    debug.value = null
  } else {
    debug.value = false
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

function selectTree(log_msg: LogMessage): boolean {
  if (log_msg.tree === undefined) {
    return false
  }
  if (!edit_node_store.clearSelection()) {
    return false
  }
  if (log_msg.tree.id !== uuid.NIL) {
    if (!editor_store.publish_subtrees) {
      window.alert('You need to enable subtree publishing to display this tree')
      return false
    }
  }
  if (findTree(editor_store.tree_structure_list, log_msg.tree.id) === undefined) {
    window.alert("This tree doesn't exist, perhaps the message is outdated?")
    return false
  }
  editor_store.selected_tree = log_msg.tree.id
  return true
}

function selectNode(log_msg: LogMessage): boolean {
  if (log_msg.node === undefined) {
    return false
  }
  if (selectTree(log_msg)) {
    window.setTimeout(
      (log_msg: LogMessage) =>
        edit_node_store.editorSelectionChange(log_msg.tree!.id, log_msg.node!.id),
      100,
      log_msg
    )
    return true
  }
  return false
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
          :disabled="debug === null"
          @click="() => (debug = !debug)"
        >
          Debug
        </button>
        <button
          type="button"
          class="btn btn-sm mx-1"
          :class="info ? 'btn-info' : 'btn-outline-info'"
          :disabled="info === null"
          @click="() => (info = !info)"
        >
          Info
        </button>
        <button
          type="button"
          class="btn btn-sm mx-1"
          :class="warn ? 'btn-warning' : 'btn-outline-warning'"
          :disabled="warn === null"
          @click="() => (warn = !warn)"
        >
          Warning
        </button>
        <button
          type="button"
          class="btn btn-sm mx-1"
          :class="error ? 'btn-danger' : 'btn-outline-danger'"
          :disabled="error === null"
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
        <div v-if="log_msg.tree === undefined">General</div>
        <div v-else-if="log_msg.node === undefined">
          Tree
          <a class="text-primary text-decoration-underline" @click="() => selectTree(log_msg)">
            {{ log_msg.tree.name }}
          </a>
        </div>
        <div v-else>
          Node
          <a class="text-primary text-decoration-underline" @click="() => selectNode(log_msg)">
            {{ log_msg.node.name }}
          </a>
          in Tree
          <a class="text-primary text-decoration-underline" @click="() => selectTree(log_msg)">
            {{ log_msg.tree.name }}
          </a>
        </div>
        <div :class="logLevelStyles(log_msg.level)">
          {{ log_msg.msg }}
          &ensp; [{{ log_store.getLogLevelString(log_msg.level) }}]
        </div>
        <hr class="my-1" />
        <div>
          <span class="text-primary-emphasis font-monospace">{{ log_msg.function }}</span>
          &ensp;
          <span class="text-body-secondary text-break">{{ log_msg.file }}:{{ log_msg.line }}</span>
        </div>
        <div class="d-flex justify-content-between align-items-end mt-1">
          <small class="text-body-tertiary">{{ log_msg.stamp.toLocaleString() }}</small>
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
