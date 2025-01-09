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
import { getPythonTypeDefault, isPythonTypeWithDefault } from './types/python_types'
import type { 
  NodeData, 
  TreeMsg, 
  DataEdgeTerminal, 
  ParamData, 
  PyObject, 
  ParamType 
} from './types/types'
import { IOKind } from './types/types'

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

//TODO This appears to be wrong or outdated.
// How do we want to handle unsupported types?
export const python_builtin_types = [
  'int',
  'float',
  //'long',
  'str',
  //'basestring',
  //'unicode',
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
): ParamType {
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
      return getDefaultValue(
        getDefaultValue(
          prettyprint_type(optionType.serialized_value), 
          options
        ).value as string,
        options
      )
    } else {
      return {
        type: 'unset_optionref',
        value: 'Ref to "' + optionTypeName + '"'
      }
    }
  // This checks all types defined in `python_types`
  // which provide default values
  } else if (isPythonTypeWithDefault(typeName)) {
    return {
      type: typeName,
      value: getPythonTypeDefault(typeName) || {}
    }
  } else {
    return {
      type: '__' + typeName,
      value: {}
    }
  }
}

export function serializeNodeOptions(node_options: ParamData[]): NodeData[] {
  return node_options.map((x) => {
    const option: NodeData = {
      key: x.key,
      serialized_value: '',
      serialized_type: '' // This is left blank intentionally
    }
    if (x.value.type === 'type') {
      if (python_builtin_types.indexOf(x.value.value as string) >= 0) {
        x.value.value = 'builtins.' + x.value.value;
      }
      option.serialized_value = JSON.stringify({
        'py/type': x.value.value
      })
    } else if (x.value.type.startsWith('__')) {
      //TODO This should be changed to not generate "bad" defaults
      const val = x.value.value as PyObject
      val['py/object'] = x.value.type.substring('__'.length)
      option.serialized_value = JSON.stringify(x.value.value)
    } else {
      option.serialized_value = JSON.stringify(x.value.value)
    }
    return option
  })
}

// Get the distance between two sets of coordinates (expected to be
// arrays with 2 elements each)
export function getDist(a: number[], b: number[]) {
  return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2))
}

export function treeIsEditable(tree_msg: TreeMsg) {
  return tree_msg.state === 'EDITABLE'
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
