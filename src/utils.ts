/*
 * Copyright 2024-2026 FZI Forschungszentrum Informatik
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
import * as uuid from 'uuid'
import type { UUIDMsg, UUIDString, RosTime } from './types/types'
import { findNodeInTreeList, getNodeStructures } from './tree_selection'
import { useEditorStore } from './stores/editor'
import { DataTypeValues, RosTypeValues, type NodeDataType, type Wiring } from './types/data_types'
import { IOKind, type DataEdgeTerminal, type NodeData } from './types/editor_types'
import {
  BoolType,
  BytesType,
  DictType,
  FloatType,
  GenericType,
  IntType,
  ListType,
  PathType,
  ReferenceContainer,
  ReferenceDictType,
  ReferenceListType,
  ReferenceType,
  RosNameType,
  RosTypeType,
  RosValueType,
  StringType,
  type DataContainer
} from './types/data_classes'
import { toRaw } from 'vue'

export function parseRosTime(time: RosTime): Date {
  return new Date(time.sec * 1000 + time.nanosec / 1000000)
}

export function getTypeFromMsg(type_msg: NodeDataType): DataContainer {
  switch (type_msg.type_identifier) {
    case DataTypeValues.BOOL_TYPE:
      return new BoolType(type_msg)
    case DataTypeValues.INT_TYPE:
      return new IntType(type_msg)
    case DataTypeValues.FLOAT_TYPE:
      return new FloatType(type_msg)
    case DataTypeValues.STRING_TYPE:
      return new StringType(type_msg)
    case DataTypeValues.PATH_TYPE:
      return new PathType(type_msg)
    case DataTypeValues.BYTES_TYPE:
      return new BytesType(type_msg)
    case DataTypeValues.LIST_TYPE:
      return new ListType(type_msg)
    case DataTypeValues.DICT_TYPE:
      return new DictType(type_msg)
    case DataTypeValues.GENERIC_TYPE:
      return new GenericType(type_msg)
    case DataTypeValues.ROS_INTERFACE_VALUE:
      return new RosValueType(type_msg)
    case DataTypeValues.ROS_INTERFACE_NAME:
      return new RosNameType(type_msg)
    case DataTypeValues.ROS_INTERFACE_TYPE:
      return new RosTypeType(type_msg)
    case DataTypeValues.REFERENCE_TYPE:
      return new ReferenceType(type_msg)
    case DataTypeValues.REFERENCE_LIST_TYPE:
      return new ReferenceListType(type_msg)
    case DataTypeValues.REFERENCE_DICT_TYPE:
      return new ReferenceDictType(type_msg)
    default:
      console.log(type_msg)
      throw Error(`Unrecognized data type ${type_msg}`)
  }
}

export function getDefaultTypeMsg(): NodeDataType {
  return {
    type_identifier: DataTypeValues.UNDEFINED_TYPE,
    allow_static: false,
    allow_dynamic: true,
    is_static: false,
    min_value: '',
    max_value: '',
    string_max_length: 0,
    serialized_value_options: [],
    reference_target: '',
    value_type_identifier: [],
    iterable_max_length: [],
    iterable_strict_length: [],
    ros_interface_kind: RosTypeValues.ROS_UNDEFINED,
    ros_msg_type: '',
    interface_id: 0
  }
}

export function popFromTypeMessage(msg: NodeDataType): [number, boolean, NodeDataType] {
  const out_msg = structuredClone(toRaw(msg))
  const max_length = out_msg.iterable_max_length.pop()!
  const strict_length = out_msg.iterable_strict_length.pop()!
  out_msg.type_identifier = out_msg.value_type_identifier.pop()!
  return [max_length, strict_length, out_msg]
}

export function pushToTypeMessage(
  identifier: DataTypeValues,
  max_length: number,
  strict_length: boolean,
  msg: NodeDataType
): NodeDataType {
  const out_msg = structuredClone(toRaw(msg))
  out_msg.value_type_identifier.push(msg.type_identifier)
  out_msg.type_identifier = identifier
  out_msg.iterable_max_length.push(max_length)
  out_msg.iterable_strict_length.push(strict_length)
  return out_msg
}

export function initializeReferenceContainers(inputs: NodeData[], outputs: NodeData[]) {
  for (const io of inputs.concat(outputs)) {
    if (io.type instanceof ReferenceContainer) {
      io.type.setInnerType(inputs)
    }
  }
}

export function rosToUuid(msg: UUIDMsg): UUIDString {
  if (!uuid.validate(msg)) {
    throw TypeError(`Message ${msg} is not a valid uuid`)
  }
  return msg
}

export function uuidToRos(str: UUIDString): UUIDMsg {
  if (!uuid.validate(str)) {
    throw TypeError(`String ${str} is not a valid uuid`)
  }
  return str
}

export function compareRosUuid(u1: UUIDMsg, u2: UUIDMsg): boolean {
  return rosToUuid(u1) === rosToUuid(u2)
}

export function replaceNameIdParts(tree_id: UUIDString, name_id_parts: string): string {
  const editor_store = useEditorStore()
  return name_id_parts
    .split('.')
    .map((name_id) => {
      // If this is the id of a node, replace it with its name
      const node = findNodeInTreeList(
        editor_store.tree_structure_list,
        getNodeStructures,
        tree_id,
        name_id
      )
      if (node === undefined) {
        return name_id
      }
      return node.name
    })
    .join('.')
}

export function compareWirings(w1: Wiring, w2: Wiring): boolean {
  return (
    compareRosUuid(w1.source.node_id, w2.source.node_id) &&
    w1.source.data_key === w2.source.data_key &&
    compareRosUuid(w1.target.node_id, w2.target.node_id) &&
    w1.target.data_key === w2.target.data_key
  )
}

export function typesCompatible(t1: DataEdgeTerminal, t2: DataEdgeTerminal) {
  let source: DataEdgeTerminal
  let target: DataEdgeTerminal
  if (t1.kind === IOKind.INPUT && t2.kind === IOKind.OUTPUT) {
    source = t2
    target = t1
  } else if (t1.kind === IOKind.OUTPUT && t2.kind === IOKind.INPUT) {
    source = t1
    target = t2
  } else {
    return false
  }

  if (source.node.data.node_id === target.node.data.node_id) {
    return false
  }

  let source_type = source.type
  let target_type = target.type
  if (source_type instanceof ReferenceContainer) {
    source_type = source_type.getInnerType() || source.type
  }
  if (target_type instanceof ReferenceContainer) {
    target_type = target_type.getInnerType() || target.type
  }
  return target_type.isCompatible(source_type)
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

const treatable_error_prefixes: string[] = [
  'Expected data to be of type type, got dict instead. Looks like failed jsonpickle decode,',
  'AttributeError, maybe a ROS Message definition changed.'
]

/**
 * Timeout (in seconds) for ROS service calls to rosbridge that may involve
 * filesystem or package introspection (loading/saving trees, listing
 * available nodes, browsing storage locations). rosbridge's own default
 * per-call timeout (5s) is too short for these operations on non-trivial
 * workspaces, which causes premature "Timeout exceeded while waiting for
 * service response" failures on the backend even though the service call
 * is still being processed and would otherwise succeed.
 *
 * Note: do not raise this above 10 seconds without also raising the
 * transport-level query timeout on the backend. rmw_zenoh drops service
 * replies after its `queries_default_timeout` (10s by default), so any
 * rosbridge-side wait beyond that window cannot succeed and only blocks
 * the UI until this timeout expires.
 */
export const SLOW_ROS_SERVICE_TIMEOUT_SECONDS = 10

export function isLoadErrorTreatable(error: string) {
  let treatable = false
  treatable_error_prefixes.forEach((val) => {
    if (error.startsWith(val)) {
      treatable = true
    }
  })
  return treatable
}
