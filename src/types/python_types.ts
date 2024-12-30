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

import type { PyObject } from './types'

export const OrderedDict_Name = 'collections.OrderedDict'
export const OrderedDict_Value = {
  'py/reduce': [{ 'py/type': OrderedDict_Name }, { 'py/tuple': [[]] }, null, null, null]
}

export type PyLogger = PyObject & {
  logger_level: string
}
export const LoggerLevel_Name = 'ros_bt_py.ros_helpers.LoggerLevel'
export const LoggerLevel_Value = {
  'py/object': LoggerLevel_Name,
  logger_level: 'Debug'
} as PyLogger

export type PyOperator = PyObject & {
  operator: string
}
export const MathUnaryOperator_Name = 'ros_bt_py.custom_types.MathUnaryOperator'
export const MathUnaryOperator_Value = {
  'py/object': MathUnaryOperator_Name,
  operator: 'sqrt'
} as PyOperator
export const MathBinaryOperator_Name = 'ros_bt_py.custom_types.MathBinaryOperator'
export const MathBinaryOperator_Value = {
  'py/object': MathBinaryOperator_Name,
  operator: '+'
} as PyOperator

export type PyOperand = PyObject & {
  operand_type: string
}
export const MathOperandType_Name = 'ros_bt_py.custom_types.MathOperandType'
export const MathOperandType_Value = {
  'py/object': MathOperandType_Name,
  operand_type: 'float'
} as PyOperand
export const MathUnaryOperandType_Name = 'ros_bt_py.custom_types.MathUnaryOperandType'
export const MathUnaryOperandType_Value = {
  'py/object': MathUnaryOperandType_Name,
  operand_type: 'float'
} as PyOperand

export type PyEnum = PyObject & {
  enum_value: string
  field_names: string[]
}
export const EnumValue_Name = 'ros_bt_py.ros_helpers.EnumValue'
export const EnumValue_Value = {
  'py/object': EnumValue_Name,
  enum_value: '',
  field_names: []
} as PyEnum

export type PyFilePath = PyObject & {
  path: string
}
export const FilePath_Name = 'ros_bt_py.custom_types.FilePath'
export const FilePath_Value = {
  'py/object': FilePath_Name,
  path: ''
} as PyFilePath

export type RosType = PyObject & {
  type_str: string
}
export const RosServiceType_Name = 'ros_bt_py.custom_types.RosServiceType'
export const RosServiceType_Value = {
  'py/object': RosServiceType_Name,
  type_str: ''
} as RosType
export const RosActionType_Name = 'ros_bt_py.custom_types.RosActionType'
export const RosActionType_Value = {
  'py/object': RosActionType_Name,
  type_str: ''
} as RosType

export type RosName = PyObject & {
  name: string
}
export const RosServiceName_Name = 'ros_bt_py.custom_types.RosServiceName'
export const RosServiceName_Value = {
  'py/object': RosServiceName_Name,
  name: ''
} as RosName
export const RosActionName_Name = 'ros_bt_py.custom_types.RosActionName'
export const RosActionName_Value = {
  'py/object': RosActionName_Name,
  name: ''
} as RosName
