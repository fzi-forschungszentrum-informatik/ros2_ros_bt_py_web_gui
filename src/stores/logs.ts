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
import * as uuid from 'uuid'
import type { LogLevel, LogMessage, RosLogMsg, UUIDString } from '@/types/types'
import { useROSStore } from './ros'
import { parseRosTime } from '@/utils'

export const useLogsStore = defineStore('logs', () => {
  const ros_store = useROSStore()

  const log_messages = ref<LogMessage[]>([])

  function parseNameId(name_id: string): { name: string; id: UUIDString } | null {
    const split_reg_exp = /^(\w+)\((.*)\)/
    const split_match = name_id.match(split_reg_exp)
    if (split_match === null) {
      return null
    }
    if (!uuid.validate(split_match[2])) {
      return null
    }
    return { name: split_match[1], id: split_match[2] }
  }

  function storeLogMessage(log_msg: RosLogMsg) {
    const log_name_parts = log_msg.name.split('.')
    if (log_name_parts.length < 2) {
      return
    }
    if (log_name_parts[0] !== ros_store.namespace.replaceAll('/', '')) {
      return
    }

    const tree = parseNameId(log_name_parts[1])
    if (tree === null) {
      console.warn('Log message with invalid tree id', log_name_parts[1])
      return
    }

    let node = undefined
    if (log_name_parts.length > 2) {
      node = parseNameId(log_name_parts[2])
    }
    if (node === null) {
      console.warn('Log message with invalid node id', log_name_parts[2])
      return
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

  function getRelevantLogs(
    tree_id: UUIDString | undefined,
    node_id: UUIDString | undefined,
    log_levels: LogLevel[]
  ) {
    return log_messages.value
      .filter((log: LogMessage) => {
        if (!log_levels.includes(log.level)) {
          return false
        }
        if (tree_id !== undefined) {
          if (log.tree.id !== tree_id) {
            return false
          }
        }
        if (node_id !== undefined) {
          if (log.node === undefined) {
            return false
          }
          if (log.node.id !== node_id) {
            return false
          }
        }
        return true
      })
      .reverse()
  }

  return {
    log_messages,
    storeLogMessage,
    getRelevantLogs
  }
})
