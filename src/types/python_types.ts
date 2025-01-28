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

import type { PyObject, PyReduce } from './types'

const PyDefaultValues = new Map<string, PyObject | PyReduce>()

export type TypeWrapper = PyObject & {
  actual_type: string
  info: string
}
export const TypeWrapper_Name = 'ros_bt_py.custom_types.TypeWrapper'

export const OrderedDict_Name = 'collections.OrderedDict'
PyDefaultValues.set(OrderedDict_Name, {
  'py/reduce': [{ 'py/type': OrderedDict_Name }, { 'py/tuple': [[]] }, null, null, null]
} as PyReduce)

export type PyLogger = PyObject & {
  logger_level: string
}
export const LoggerLevel_Name = 'ros_bt_py.ros_helpers.LoggerLevel'
PyDefaultValues.set(LoggerLevel_Name, {
  'py/object': LoggerLevel_Name,
  logger_level: 'Debug'
} as PyLogger)

export type PyOperator = PyObject & {
  operator: string
}
export const MathUnaryOperator_Name = 'ros_bt_py.helpers.MathUnaryOperator'
PyDefaultValues.set(MathUnaryOperator_Name, {
  'py/object': MathUnaryOperator_Name,
  operator: 'sqrt'
} as PyOperator)
export const MathBinaryOperator_Name = 'ros_bt_py.helpers.MathBinaryOperator'
PyDefaultValues.set(MathBinaryOperator_Name, {
  'py/object': MathBinaryOperator_Name,
  operator: '+'
} as PyOperator)

export type PyOperand = PyObject & {
  operand_type: string
}
export const MathOperandType_Name = 'ros_bt_py.helpers.MathOperandType'
PyDefaultValues.set(MathOperandType_Name, {
  'py/object': MathOperandType_Name,
  operand_type: 'float'
} as PyOperand)
export const MathUnaryOperandType_Name = 'ros_bt_py.helpers.MathUnaryOperandType'
PyDefaultValues.set(MathUnaryOperandType_Name, {
  'py/object': MathUnaryOperandType_Name,
  operand_type: 'float'
} as PyOperand)

export type PyEnum = PyObject & {
  enum_value: string
  field_names: string[]
}
export const EnumValue_Name = 'ros_bt_py.ros_helpers.EnumValue'
PyDefaultValues.set(EnumValue_Name, {
  'py/object': EnumValue_Name,
  enum_value: '',
  field_names: []
} as PyEnum)

export type PyFilePath = PyObject & {
  path: string
}
export const FilePath_Name = 'ros_bt_py.custom_types.FilePath'
PyDefaultValues.set(FilePath_Name, {
  'py/object': FilePath_Name,
  path: ''
} as PyFilePath)

export type RosType = PyObject & {
  type_str: string
}
export const RosTopicType_Name = 'ros_bt_py.custom_types.RosTopicType'
PyDefaultValues.set(RosTopicType_Name, {
  'py/object': RosTopicType_Name,
  type_str: 'std_msgs/msg/Empty'
} as RosType)
export const RosServiceType_Name = 'ros_bt_py.custom_types.RosServiceType'
PyDefaultValues.set(RosServiceType_Name, {
  'py/object': RosServiceType_Name,
  type_str: 'std_srvs/srv/Empty'
} as RosType)
export const RosActionType_Name = 'ros_bt_py.custom_types.RosActionType'
PyDefaultValues.set(RosActionType_Name, {
  'py/object': RosActionType_Name,
  type_str: 'example_interfaces/action/Fibonacci'
} as RosType)

export type RosName = PyObject & {
  name: string
}
export const RosTopicName_Name = 'ros_bt_py.custom_types.RosTopicName'
PyDefaultValues.set(RosTopicName_Name, {
  'py/object': RosTopicName_Name,
  name: ''
} as RosName)
export const RosServiceName_Name = 'ros_bt_py.custom_types.RosServiceName'
PyDefaultValues.set(RosServiceName_Name, {
  'py/object': RosServiceName_Name,
  name: ''
} as RosName)
export const RosActionName_Name = 'ros_bt_py.custom_types.RosActionName'
PyDefaultValues.set(RosActionName_Name, {
  'py/object': RosActionName_Name,
  name: ''
} as RosName)

export function isPythonTypeWithDefault(type: string) {
  return PyDefaultValues.has(type)
}

export function getPythonTypeDefault(type: string) {
  return structuredClone(PyDefaultValues.get(type))
}
