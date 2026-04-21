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

import type { UUIDMsg } from './types'

export const INT_LIMITS: Record<string, [bigint, bigint]> = {
  int8: [-(2n ** 7n), 2n ** 7n - 1n],
  int16: [-(2n ** 15n), 2n ** 15n - 1n],
  int32: [-(2n ** 31n), 2n ** 31n - 1n],
  int64: [-(2n ** 63n), 2n ** 63n - 1n],
  uint8: [0n, 2n ** 8n - 1n],
  uint16: [0n, 2n ** 16n - 1n],
  uint32: [0n, 2n ** 32n - 1n],
  uint64: [0n, 2n ** 64n - 1n]
}

export const FLOAT_LIMITS: Record<string, [number, number]> = {
  float32: [-3.4028235e38, 3.4028235e38],
  float64: [-1.7976931348623157e308, 1.7976931348623157e308]
}

// Max uint64 value that exactly matches a float64 value
export const INT_FLOAT_MAX = 2 ** 64 - 1616

export const IDENTIFIER_KEY = 'type_identifier'

export const ELEMENT_KEY = 'element_type'

export const MESSAGE_KEY = 'ros_msg_type'

export type TypeValueOption = {
  type: string
  value: Record<string, any>
}

export const enum DataTypeValues {
  UNDEFINED_TYPE = 0,
  BOOL_TYPE = 1,
  INT_TYPE = 2,
  FLOAT_TYPE = 3,
  STRING_TYPE = 4,
  LIST_TYPE = 5,
  DICT_TYPE = 6,
  BYTES_TYPE = 7,
  PATH_TYPE = 8,
  BUILTIN_TYPE = 9,
  ROS_INTERFACE_NAME = 10,
  ROS_INTERFACE_TYPE = 11,
  ROS_INTERFACE_VALUE = 12,
  BUILTIN_OR_ROS_TYPE = 13,
  REFERENCE_TYPE = 14,
  REFERENCE_LIST_TYPE = 15,
  REFERENCE_DICT_TYPE = 16
}

export const enum RosTypeValues {
  ROS_UNDEFINED = 0,
  ROS_TOPIC = 1,
  ROS_SERVICE = 2,
  ROS_ACTION = 3,
  ROS_COMPONENT = 4
}

export type NodeDataType = {
  [key: string]: any // Enables accessing properties with []
  type_identifier: DataTypeValues
  value_type_identifier: DataTypeValues[]
  allow_dynamic: boolean
  allow_static: boolean
  is_static: boolean
  serialized_value_options: string[]
  min_value: string
  max_value: string
  string_max_length: number
  iterable_max_length: number[]
  iterable_strict_length: boolean[]
  reference_target: string
  ros_interface_kind: RosTypeValues
  ros_msg_type: string
  interface_id: number
}

export type NodeIO = {
  key: string
  type: NodeDataType
  serialized_value: string
}

export type NodeDataLocation = {
  node_id: UUIDMsg
  data_key: string
}

export type Wiring = {
  source: NodeDataLocation
  target: NodeDataLocation
}

export type WiringData = {
  wiring: Wiring
  serialized_data: string
  is_current: boolean
  source_type: NodeDataType
  target_type: NodeDataType
}
