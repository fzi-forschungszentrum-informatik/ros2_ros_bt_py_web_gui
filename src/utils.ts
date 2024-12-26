/*
 * Copyright 2024 FZI Forschungszentrum Informatik
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
import { useMessasgeStore } from './stores/message'
import type {
  NodeData,
  NodeDataLocation,
  TreeMsg,
  ValueTypes,
  DataEdgeTerminal,
  Message
} from './types/types'
import { IOKind, MessageType } from './types/types'

import * as d3 from 'd3'

// uuid is used to assign unique IDs to tags so we can use labels properly
let idx = 0
export const uuid = () => idx++

// and another one for errors
let error_idx = 0
export const error_id = () => error_idx++

export function typesCompatible(a: DataEdgeTerminal, b: DataEdgeTerminal) {
  if (a.node.data.name === b.node.data.name) {
    return false
  }

  if (a.kind === b.kind) {
    return false
  }

  const from = a.kind === IOKind.OUTPUT ? a : b
  const to = a.kind === IOKind.INPUT ? a : b

  // object is compatible with anything
  if (
    to.type === '{"py/type": "__builtin__.object"}' ||
    to.type === '{"py/type": "builtins.object"}'
  ) {
    return true
  }

  return prettyprint_type(from.type) === prettyprint_type(to.type)
}

export const python_builtin_types = [
  'int',
  'float',
  'long',
  'str',
  'basestring',
  'unicode',
  'bool',
  'list',
  'dict',
  'set',
  'type'
]

export function prettyprint_type(jsonpickled_type: string) {
  const json_type = JSON.parse(jsonpickled_type)
  if (json_type['py/type'] !== undefined) {
    // shorten the CapabilityType
    if (json_type['py/type'] === 'bt_capabilities.nodes.capability.CapabilityType') {
      return 'CapabilityType'
    }
    // Remove the "builtin" prefix jsonpickle adds
    return json_type['py/type']
      .replace('__builtin__.', '')
      .replace('builtins.', '')
      .replace(/^basestring$/, 'string')
      .replace(/^unicode$/, 'string')
      .replace(/^str$/, 'string')
  }

  // If the type doesn't have a py/type field, maybe it's an
  // OptionRef?
  if (
    json_type['py/object'] !== undefined &&
    json_type['py/object'] === 'ros_bt_py.node_config.OptionRef'
  ) {
    return 'OptionRef(' + json_type['option_key'] + ')'
  }

  if (
    json_type['py/reduce'] !== undefined &&
    json_type['py/reduce'][0] !== undefined &&
    json_type['py/reduce'][0]['py/type'] !== undefined &&
    json_type['py/reduce'][0]['py/type'] === 'collections.OrderedDict'
  ) {
    return json_type['py/reduce'][0]['py/type']
  }

  return 'Unknown type object: ' + jsonpickled_type
}

export function getDefaultValue(
  typeName: string,
  options: NodeData[] | null = null
): { type: string; value: ValueTypes } {
  if (typeName === 'type') {
    return {
      type: 'type',
      value: 'int'
    }
  } else if (typeName === 'int' || typeName === 'long') {
    return {
      type: 'int',
      value: 0
    }
  } else if (
    typeName === 'str' ||
    typeName === 'basestring' ||
    typeName === 'unicode' ||
    typeName === 'string'
  ) {
    return {
      type: 'string',
      value: 'foo'
    }
  } else if (typeName === 'float') {
    return {
      type: 'float',
      value: 1.2
    }
  } else if (typeName === 'bool') {
    return {
      type: 'bool',
      value: true
    }
  } else if (typeName === 'list') {
    return {
      type: 'list',
      value: []
    }
  } else if (typeName === 'dict') {
    return {
      type: 'dict',
      value: {}
    }
  } else if (typeName.startsWith('OptionRef(')) {
    const optionTypeName = typeName.substring('OptionRef('.length, typeName.length - 1)
    if (options === null) {
      return {
        type: 'unset_optionref',
        value: 'Ref to "' + optionTypeName + '"'
      }
    }
    const optionType = options.find((x) => {
      return x.key === optionTypeName
    })
    if (optionType) {
      // This double call is necessary to dereference first the type of the optionref target and then its default value
      //TODO Check if this is consistent (are the `options` always populated in the same manner?)
      return getDefaultValue(
        getDefaultValue(prettyprint_type(optionType.serialized_value), options).value as string,
        options
      )
    } else {
      return {
        type: 'unset_optionref',
        value: 'Ref to "' + optionTypeName + '"'
      }
    }
  } else if (typeName === 'collections.OrderedDict') {
    return {
      type: 'collections.OrderedDict',
      value: {
        'py/reduce': [
          { 'py/type': 'collections.OrderedDict' },
          { 'py/tuple': [[]] },
          null,
          null,
          null
        ]
      }
    }
  } else if (typeName === 'ros_bt_py.ros_helpers.LoggerLevel') {
    return {
      type: typeName,
      value: {
        'py/object': typeName,
        logger_level: 'Debug'
      }
    }
  } else if (typeName === 'ros_bt_py.custom_types.MathUnaryOperator') {
    return {
      type: typeName,
      value: {
        'py/object': typeName,
        operator: 'sqrt'
      }
    }
  } else if (typeName === 'ros_bt_py.custom_types.MathBinaryOperator') {
    return {
      type: typeName,
      value: {
        'py/object': typeName,
        operator: '+'
      }
    }
  } else if (typeName === 'ros_bt_py.custom_types.MathOperandType') {
    return {
      type: typeName,
      value: {
        'py/object': typeName,
        operand_type: 'float'
      }
    }
  } else if (typeName === 'ros_bt_py.custom_types.MathUnaryOperandType') {
    return {
      type: typeName,
      value: {
        'py/object': typeName,
        operand_type: 'float'
      }
    }
  } else if (typeName === 'ros_bt_py.ros_helpers.EnumValue') {
    return {
      type: typeName,
      value: {
        'py/object': typeName,
        enum_value: '',
        field_names: []
      }
    }
  } else if (typeName === 'ros_bt_py.custom_types.FilePath') {
    return {
      type: typeName,
      value: {
        'py/object': typeName,
        path: ''
      }
    }
  } else {
    //TODO should this check for general ros_types?
    return {
      type: '__' + typeName,
      value: {}
    }
  }
}

// Get the distance between two sets of coordinates (expected to be
// arrays with 2 elements each)
export function getDist(a: number[], b: number[]) {
  return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2))
}

export function treeIsEditable(tree_msg: TreeMsg) {
  return tree_msg.state === 'EDITABLE'
}

export function getMessageType(str: string): Message {
  const message_store = useMessasgeStore() // This doesn't work outside functions in .ts files
  const message_parts = str.split('.')
  if (message_parts.length < 3) {
    console.error('Invalid message passed')
    return { msg: '', action: false, service: false, type: MessageType.MESSAGE }
  }

  let new_message_parts = message_parts.slice(0, 2)
  // Standardize type .../.../_name/Name to .../.../Name
  if (
    message_parts.length > 3 &&
    message_parts[2] === message_parts[3].replace(/[A-Z]/g, (x) => '_' + x.toLowerCase())
  ) {
    new_message_parts.push(...message_parts.slice(3))
  } else {
    new_message_parts.push(...message_parts.slice(2))
  }

  // Caution, since this is the store member, don't edit it
  const msg_ref = message_store.messages.find((item) => item.msg === new_message_parts.join('.'))

  if (msg_ref === undefined) {
    console.error('Invalid message passed')
    return {
      msg: new_message_parts.slice(0, 3).join('/'),
      action: false,
      service: false,
      type: MessageType.MESSAGE
    }
  }
  return {
    msg: new_message_parts.slice(0, 3).join('/'),
    type: msg_ref.type,
    action: msg_ref.action,
    service: msg_ref.service
  }
}

export function getShortDoc(doc: string) {
  if (!doc || doc == null || doc.length == 0) {
    return 'No documentation provided'
  } else {
    const index = doc.indexOf('**Behavior Tree I/O keys**')
    if (index < 0) {
      return doc
    } else {
      return doc.substring(0, index).trim()
    }
  }
}

export enum NameConflictHandler {
  ASK = 'Ask before overwrite',
  OVERWRITE = 'Overwrite file',
  RENAME = 'Rename file'
}

export function parseConflictHandler(handler: NameConflictHandler): [boolean, boolean] {
  let allow_overwrite: boolean
  let allow_rename: boolean
  switch (handler) {
    case NameConflictHandler.ASK:
      allow_overwrite = false
      allow_rename = false
      break
    case NameConflictHandler.OVERWRITE:
      allow_overwrite = true
      allow_rename = false
      break
    case NameConflictHandler.RENAME:
      allow_overwrite = false
      allow_rename = true
      break
    default:
      console.warn('Improper state for name conflict resolution strategy', handler)
      allow_overwrite = false
      allow_rename = false
      break
  }
  return [allow_overwrite, allow_rename]
}
