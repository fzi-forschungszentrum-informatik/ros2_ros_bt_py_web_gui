/*
 * Copyright 2026 FZI Forschungszentrum Informatik
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *    * Redistributions of source code must retain the above copyright
 *      notice, this list of conditions and the following disclaimer.
 *
 *    * Redistributions in binary form must reproduce the above copyright
 *      notice, this list of conditions and the following disclaimer in the
 *      documentation and/or other materials provided with the distribution.
 *
 *    * Neither the name of the {copyright_holder} nor the names of its
 *      contributors may be used to endorse or promote products derived from
 *      this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { LogLevel, LogMessage, RosLogMsg, UUIDString } from '@/types/types'
import { rosToUuid } from '../utils'
import { useROSStore } from './ros'
import { parseRosTime } from '@/utils'

export const useLogsStore = defineStore('logs', () => {
  const ros_store = useROSStore()

  const log_messages = ref<LogMessage[]>([])

  function storeLogMessage(log_msg: RosLogMsg) {
    let tree = undefined
    if (log_msg.tree_id !== "") {
      tree = {
        id: rosToUuid(log_msg.tree_id),
        name: log_msg.tree_name
      }
    }
    let node = undefined
    if (log_msg.node_id !== "") {
      node = {
        id: rosToUuid(log_msg.node_id),
        name: log_msg.node_name
      }
    }

    const log_message = {
      stamp: parseRosTime(log_msg.stamp),
      level: log_msg.level,
      tree: tree,
      node: node,
      msg: log_msg.msg,
      file: log_msg.file,
      function: log_msg.function,
      line: log_msg.line
    } as LogMessage
    log_messages.value.push(log_message)
  }

  // Returns true if the given message MATCHES the filter parameters
  function logFilterPredicate(
    log_message: LogMessage,
    tree_id: UUIDString | undefined,
    node_id: UUIDString | undefined,
    log_levels: LogLevel[]
  ): boolean {
    if (!log_levels.includes(log_message.level)) {
      return false
    }
    if (tree_id !== undefined) {
      if (log_message.tree === undefined) {
        return false
      }
      if (log_message.tree.id !== tree_id) {
        return false
      }
    }
    if (node_id !== undefined) {
      if (log_message.node === undefined) {
        return false
      }
      if (log_message.node.id !== node_id) {
        return false
      }
    }
    return true
  }

  function getRelevantLogs(
    tree_id: UUIDString | undefined,
    node_id: UUIDString | undefined,
    log_levels: LogLevel[]
  ) {
    return log_messages.value
      .filter((log: LogMessage) => logFilterPredicate(log, tree_id, node_id, log_levels))
      .reverse()
  }

  function clearRelevantLogs(
    tree_id: UUIDString | undefined,
    node_id: UUIDString | undefined,
    log_levels: LogLevel[]
  ) {
    log_messages.value = log_messages.value.filter(
      (log: LogMessage) => !logFilterPredicate(log, tree_id, node_id, log_levels)
    )
  }

  function removeLogMessage(log_msg: LogMessage) {
    const remove_index = log_messages.value.indexOf(log_msg)
    if (remove_index === -1) {
      return
    }
    log_messages.value.splice(remove_index, 1)
  }

  return {
    log_messages,
    storeLogMessage,
    getRelevantLogs,
    clearRelevantLogs,
    removeLogMessage
  }
})
