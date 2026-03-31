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

import { getDefaultTypeMsg, getTypeFromMsg, popFromTypeMessage, pushToTypeMessage } from '@/utils'
import {
  DataTypeValues,
  ELEMENT_KEY,
  FLOAT_LIMITS,
  IDENTIFIER_KEY,
  INT_FLOAT_MAX,
  INT_LIMITS,
  RosTypeValues,
  type NodeDataType,
  type TypeValueOption
} from './data_types'
import type { NodeData } from './editor_types'
import { useMessageStore } from '@/stores/message'

export abstract class DataContainer<ValueType = any> {
  allow_dynamic: boolean
  allow_static: boolean
  is_static: boolean

  constructor(type_msg: NodeDataType) {
    this.allow_dynamic = type_msg.allow_dynamic
    this.allow_static = type_msg.allow_static
    this.is_static = type_msg.is_static
  }

  toTypeMsg(): NodeDataType {
    return {
      allow_dynamic: this.allow_dynamic,
      allow_static: this.allow_static,
      is_static: this.is_static
    } as NodeDataType
  }

  abstract isCompatible(other: DataContainer): boolean

  abstract prettyprint(): string

  abstract validate(value: any): string

  abstract serializeValue(value: ValueType): string

  abstract parseValue(ser_value: string): ValueType

  abstract getSerializedDefault(): string
}

interface TypeContainer extends DataContainer {
  getValueField: (ser_value: string) => DataContainer
}

function isTypeContainer(cont: DataContainer): cont is TypeContainer {
  return 'getValueField' in cont
}

abstract class BuiltinContainer<ValueType> extends DataContainer<ValueType> {
  serializeValue(value: ValueType): string {
    return JSON.stringify(value)
  }

  parseValue(ser_value: string): ValueType {
    return JSON.parse(ser_value)
  }
}

export class BoolType extends BuiltinContainer<boolean> {
  constructor(type_msg: NodeDataType) {
    if (type_msg.type_identifier !== DataTypeValues.BOOL_TYPE) {
      throw Error(`Type msg ${type_msg} has incorrect identifier for bool`)
    }
    super(type_msg)
  }

  toTypeMsg(): NodeDataType {
    const type_msg = super.toTypeMsg()
    type_msg.type_identifier = DataTypeValues.BOOL_TYPE
    return type_msg
  }

  isCompatible(other: DataContainer): boolean {
    return other instanceof BoolType
  }

  prettyprint(): string {
    return 'bool'
  }

  validate(value: any): string {
    if (typeof value === 'boolean') {
      return ''
    }
    return `Value ${value} is not a boolean`
  }

  getSerializedDefault(): string {
    return this.serializeValue(false)
  }
}

export class IntType extends BuiltinContainer<number> {
  min_value: bigint
  max_value: bigint

  constructor(type_msg: NodeDataType) {
    if (type_msg.type_identifier !== DataTypeValues.INT_TYPE) {
      throw Error(`Type msg ${type_msg} has incorrect identifier for int`)
    }
    super(type_msg)
    this.min_value = BigInt(type_msg.min_value)
    this.max_value = BigInt(type_msg.max_value)
  }

  toTypeMsg(): NodeDataType {
    const type_msg = super.toTypeMsg()
    type_msg.type_identifier = DataTypeValues.INT_TYPE
    type_msg.min_value = this.min_value.toString()
    type_msg.max_value = this.max_value.toString()
    return type_msg
  }

  isCompatible(other: DataContainer): boolean {
    if (!(other instanceof IntType)) {
      return false
    }
    if (this.min_value > other.min_value) {
      return false
    }
    if (this.max_value < other.max_value) {
      return false
    }
    return true
  }

  prettyprint(): string {
    for (const [key, [min, max]] of Object.entries(INT_LIMITS)) {
      if (min === this.min_value && max === this.max_value) {
        return key
      }
    }
    return `int(min=${this.min_value},max=${this.max_value})`
  }

  validate(value: any): string {
    if (!Number.isInteger(value)) {
      return `Value ${value} is not an integer`
    }
    const int_value = BigInt(value)
    if (int_value > this.max_value) {
      return `Value ${value} is above maximum`
    }
    if (int_value < this.min_value) {
      return `Value ${value} is below minimum`
    }
    return ''
  }

  getSerializedDefault(): string {
    return this.serializeValue(0)
  }
}

export class FloatType extends BuiltinContainer<number> {
  min_value: number
  max_value: number

  constructor(type_msg: NodeDataType) {
    if (type_msg.type_identifier !== DataTypeValues.FLOAT_TYPE) {
      throw Error(`Type msg ${type_msg} has incorrect identifier for float`)
    }
    super(type_msg)
    this.min_value = Number(type_msg.min_value)
    this.max_value = Number(type_msg.max_value)
  }

  toTypeMsg(): NodeDataType {
    const type_msg = super.toTypeMsg()
    type_msg.type_identifier = DataTypeValues.FLOAT_TYPE
    type_msg.min_value = this.min_value.toString()
    type_msg.max_value = this.max_value.toString()
    return type_msg
  }

  isCompatible(other: DataContainer): boolean {
    if (!(other instanceof FloatType)) {
      return false
    }
    if (this.min_value > other.min_value) {
      return false
    }
    if (this.max_value < other.max_value) {
      return false
    }
    return true
  }

  prettyprint(): string {
    for (const [key, [min, max]] of Object.entries(FLOAT_LIMITS)) {
      if (min === this.min_value && max === this.max_value) {
        return key
      }
    }
    return `float(min=${this.min_value},max=${this.max_value})`
  }

  validate(value: any): string {
    if (!Number.isFinite(value)) {
      return `Value ${value} is not a float`
    }
    if (value > this.max_value) {
      return `Value ${value} is above maximum`
    }
    if (value < this.min_value) {
      return `Value ${value} is below minimum`
    }
    return ''
  }

  getSerializedDefault(): string {
    return this.serializeValue(1.2)
  }
}

export class StringType extends BuiltinContainer<string> {
  max_length: number
  valid_values: string[]

  constructor(type_msg: NodeDataType) {
    if (type_msg.type_identifier !== DataTypeValues.STRING_TYPE) {
      throw Error(`Type msg ${type_msg} has incorrect identifier for string`)
    }
    super(type_msg)
    this.max_length = type_msg.string_max_length
    this.valid_values = type_msg.serialized_value_options
  }

  toTypeMsg(): NodeDataType {
    const type_msg = super.toTypeMsg()
    type_msg.type_identifier = DataTypeValues.STRING_TYPE
    type_msg.string_max_length = this.max_length
    type_msg.serialized_value_options = this.valid_values
    return type_msg
  }

  isCompatible(other: DataContainer): boolean {
    if (!(other instanceof StringType)) {
      return false
    }
    if (this.max_length < other.max_length) {
      return false
    }
    if (this.valid_values.length > 0) {
      for (const val of other.valid_values) {
        if (!this.valid_values.includes(val)) {
          return false
        }
      }
    }
    return true
  }

  prettyprint(): string {
    if (this.max_length === INT_FLOAT_MAX) {
      return 'string'
    }
    return `string<=${this.max_length}`
  }

  validate(value: any): string {
    if (this.valid_values.length > 0) {
      if (this.valid_values.includes(value)) {
        return `Value ${value} is not a valid value`
      }
    }
    if (!(typeof value === 'string')) {
      return `Value ${value} is not a string`
    }
    if (value.length > this.max_length) {
      return `Value ${value} is too long`
    }
    return ''
  }

  getSerializedDefault(): string {
    if (this.valid_values.length > 0) {
      return this.serializeValue(this.valid_values[0])
    }
    return this.serializeValue('foobarbaz'.substring(0, this.max_length))
  }
}

export class PathType extends BuiltinContainer<string> {
  max_length: number
  valid_values: string[]

  constructor(type_msg: NodeDataType) {
    if (type_msg.type_identifier !== DataTypeValues.PATH_TYPE) {
      throw Error(`Type msg ${type_msg} has incorrect identifier for path`)
    }
    super(type_msg)
    this.max_length = type_msg.string_max_length
    this.valid_values = type_msg.serialized_value_options
  }

  toTypeMsg(): NodeDataType {
    const type_msg = super.toTypeMsg()
    type_msg.string_max_length = this.max_length
    type_msg.serialized_value_options = this.valid_values
    return type_msg
  }

  isCompatible(other: DataContainer): boolean {
    if (!(other instanceof PathType)) {
      return false
    }
    if (this.max_length < other.max_length) {
      return false
    }
    if (this.valid_values.length > 0) {
      for (const val of other.valid_values) {
        if (!this.valid_values.includes(val)) {
          return false
        }
      }
    }
    return true
  }

  prettyprint(): string {
    if (this.max_length === INT_FLOAT_MAX) {
      return 'path'
    }
    return `path<=${this.max_length}`
  }

  validate(value: any): string {
    if (this.valid_values.length > 0) {
      if (this.valid_values.includes(value)) {
        return `Value ${value} is not a valid value`
      }
    }
    if (!(typeof value === 'string')) {
      return `Value ${value} is not a string`
    }
    if (value.length > this.max_length) {
      return `Value ${value} is too long`
    }
    return ''
  }

  getSerializedDefault(): string {
    throw Error('No default path available')
  }
}

export class BytesType extends BuiltinContainer<string> {
  max_length: number
  valid_values: string[]

  constructor(type_msg: NodeDataType) {
    if (type_msg.type_identifier !== DataTypeValues.BYTES_TYPE) {
      throw Error(`Type msg ${type_msg} has incorrect identifier for bytes`)
    }
    super(type_msg)
    this.max_length = type_msg.string_max_length
    this.valid_values = type_msg.serialized_value_options
  }

  toTypeMsg(): NodeDataType {
    const type_msg = super.toTypeMsg()
    type_msg.string_max_length = this.max_length
    type_msg.serialized_value_options = this.valid_values
    return type_msg
  }

  isCompatible(other: DataContainer): boolean {
    if (!(other instanceof BytesType)) {
      return false
    }
    if (this.max_length < other.max_length) {
      return false
    }
    if (this.valid_values.length > 0) {
      for (const val of other.valid_values) {
        if (!this.valid_values.includes(val)) {
          return false
        }
      }
    }
    return true
  }

  prettyprint(): string {
    if (this.max_length === 1) {
      return 'byte'
    }
    if (this.max_length === INT_FLOAT_MAX) {
      return 'bytes'
    }
    return `bytes==${this.max_length}`
  }

  validate(value: any): string {
    if (this.valid_values.length > 0) {
      if (this.valid_values.includes(value)) {
        return `Value ${value} is not a valid value`
      }
    }
    if (!(typeof value === 'string')) {
      return `Value ${value} is not a string`
    }
    if (value.length > this.max_length * 2) {
      return `Value ${value} is too long`
    }
    if (value.length < this.max_length * 2) {
      return `Value ${value} is too short`
    }
    if (!value.match(/[0-9A-F]+/)) {
      return `Value ${value} is not valid hex`
    }
    return ''
  }

  getSerializedDefault(): string {
    if (this.valid_values.length > 0) {
      return this.serializeValue(this.valid_values[0])
    }
    return this.serializeValue('00'.repeat(this.max_length))
  }
}

export class ListType extends BuiltinContainer<any[]> {
  max_length: number
  strict_length: boolean
  element_type: DataContainer

  constructor(type_msg: NodeDataType) {
    if (type_msg.type_identifier !== DataTypeValues.LIST_TYPE) {
      throw Error(`Type msg ${type_msg} has incorrect identifier for list`)
    }
    super(type_msg)
    const [max_length, strict_length, out_msg] = popFromTypeMessage(type_msg)
    this.max_length = max_length
    this.strict_length = strict_length
    this.element_type = getTypeFromMsg(out_msg)
  }

  toTypeMsg(): NodeDataType {
    return pushToTypeMessage(
      DataTypeValues.LIST_TYPE,
      this.max_length,
      this.strict_length,
      this.element_type.toTypeMsg()
    )
  }

  isCompatible(other: DataContainer): boolean {
    if (!(other instanceof ListType)) {
      return false
    }
    if (this.max_length < other.max_length) {
      return false
    }
    if (this.strict_length && !other.strict_length) {
      return false
    }
    return this.element_type.isCompatible(other.element_type)
  }

  prettyprint(): string {
    let prt_str = `list[${this.element_type.prettyprint()}]`
    if (this.max_length !== INT_FLOAT_MAX) {
      prt_str += `${this.strict_length ? '=' : '<'}=${this.max_length}`
    }
    return prt_str
  }

  validate(value: any): string {
    if (!(value instanceof Array)) {
      return `Value ${value} is not an array`
    }
    if (value.length > this.max_length) {
      return `Value ${value} is too long`
    }
    if (this.strict_length && value.length < this.max_length) {
      return `Value ${value} is too short`
    }
    for (let index = 0; index < value.length; index++) {
      const error = this.element_type.validate(value[index])
      if (error !== '') {
        return `At index ${index}: ${error}`
      }
    }
    return ''
  }

  serializeValue(value: any[]): string {
    const ser_list: any[] = []
    for (const elem of value) {
      ser_list.push(this.element_type.serializeValue(elem))
    }
    return super.serializeValue(ser_list)
  }

  parseValue(ser_value: string): any[] {
    if (this.element_type === undefined) {
      return super.parseValue(ser_value)
    }
    const value_list = JSON.parse(ser_value) as any[]
    const value: any[] = []
    for (const elem of value_list) {
      value.push(this.element_type.parseValue(elem))
    }
    return value
  }

  getSerializedDefault(): string {
    const default_elem = this.element_type.getSerializedDefault()
    const default_list = []
    for (let index = 0; index < (this.strict_length ? this.max_length : 1); index++) {
      default_list.push(this.element_type.parseValue(default_elem))
    }
    return this.serializeValue(default_list)
  }
}

export class DictType extends BuiltinContainer<Record<string, any>> {
  max_length: number
  strict_length: boolean
  element_type: DataContainer

  constructor(type_msg: NodeDataType) {
    if (type_msg.type_identifier !== DataTypeValues.DICT_TYPE) {
      throw Error(`Type msg ${type_msg} has incorrect identifier for dict`)
    }
    super(type_msg)
    const [max_length, strict_length, out_msg] = popFromTypeMessage(type_msg)
    this.max_length = max_length
    this.strict_length = strict_length
    this.element_type = getTypeFromMsg(out_msg)
  }

  toTypeMsg(): NodeDataType {
    return pushToTypeMessage(
      DataTypeValues.DICT_TYPE,
      this.max_length,
      this.strict_length,
      this.element_type.toTypeMsg()
    )
  }

  isCompatible(other: DataContainer): boolean {
    if (!(other instanceof ListType)) {
      return false
    }
    if (this.max_length < other.max_length) {
      return false
    }
    if (this.strict_length && !other.strict_length) {
      return false
    }
    return this.element_type.isCompatible(other.element_type)
  }

  prettyprint(): string {
    let prt_str = `dict[${this.element_type.prettyprint()}]`
    if (this.max_length !== INT_FLOAT_MAX) {
      prt_str += `${this.strict_length ? '=' : '<'}=${this.max_length}`
    }
    return prt_str
  }

  validate(value: any): string {
    if (!(value instanceof Object)) {
      return `Value ${value} is not a dict`
    }
    if (value.length > this.max_length) {
      return `Value ${value} is too long`
    }
    if (this.strict_length && value.length < this.max_length) {
      return `Value ${value} is too short`
    }
    for (const [k, v] of Object.entries(value)) {
      const error = this.element_type.validate(v)
      if (error !== '') {
        return `At key ${k}: ${error}`
      }
    }
    return ''
  }

  serializeValue(value: Record<string, any>): string {
    const ser_dict: Record<string, string> = {}
    for (const [k, v] of Object.entries(value)) {
      ser_dict[k] = this.element_type!.serializeValue(v)
    }
    return super.serializeValue(ser_dict)
  }

  parseValue(ser_value: string): Record<string, any> {
    const value_dict = JSON.parse(ser_value) as Record<string, string>
    const value: Record<string, any> = {}
    for (const [k, v] of Object.entries(value_dict)) {
      value[k] = this.element_type.parseValue(v)
    }
    return value
  }

  getSerializedDefault(): string {
    const default_elem = this.element_type.getSerializedDefault()
    const default_dict: Record<string, any> = {}
    for (let index = 0; index < (this.strict_length ? this.max_length : 1); index++) {
      default_dict[`i${index}`] = this.element_type.parseValue(default_elem)
    }
    return this.serializeValue(default_dict)
  }
}

export class BuiltinType extends BuiltinContainer<Record<string, any>> {
  valid_types: TypeValueOption[]

  constructor(type_msg: NodeDataType) {
    if (type_msg.type_identifier !== DataTypeValues.BUILTIN_TYPE) {
      throw Error(`Type msg ${type_msg} has incorrect identifier for builtin`)
    }
    super(type_msg)
    this.valid_types = type_msg.serialized_value_options.map((x) => JSON.parse(x))
  }

  toTypeMsg(): NodeDataType {
    const type_msg = super.toTypeMsg()
    type_msg.type_identifier = DataTypeValues.BUILTIN_TYPE
    type_msg.serialized_value_options = this.valid_types.map((x) => JSON.stringify(x))
    return type_msg
  }

  isCompatible(other: DataContainer): boolean {
    if (!(other instanceof BuiltinType)) {
      return false
    }
    if (this.valid_types.length > 0) {
      for (const val of other.valid_types) {
        if (!this.valid_types.includes(val)) {
          return false
        }
      }
    }
    return true
  }

  prettyprint(): string {
    return 'type'
  }

  validate(value: any): string {
    if (this.valid_types.includes(value)) {
      return `Value ${value} is not a valid type primitive`
    }
    return ''
  }

  static setTypeMsgFields(value: Record<string, any>): NodeDataType {
    if (Object.keys(value).includes(ELEMENT_KEY)) {
      const inner_type_msg = BuiltinType.setTypeMsgFields(value[ELEMENT_KEY])
      return pushToTypeMessage(
        value[IDENTIFIER_KEY],
        value.max_length,
        value.strict_length,
        inner_type_msg
      )
    }
    const type_msg = getDefaultTypeMsg()
    for (const [k, v] of Object.entries(value)) {
      // Map type dict keys to msg type fields
      if (k === 'max_length') {
        const new_k = `string_${k}`
        type_msg[new_k] = v
      } else {
        type_msg[k] = v
      }
    }
    return type_msg
  }

  getValueField(ser_value: string): DataContainer {
    return getTypeFromMsg(BuiltinType.setTypeMsgFields(this.parseValue(ser_value)))
  }

  getSerializedDefault(): string {
    return this.serializeValue(this.valid_types[0].value)
  }
}

export class RosValueType extends DataContainer<Record<string, any>> {
  msg_type: string

  constructor(type_msg: NodeDataType) {
    if (type_msg.type_identifier !== DataTypeValues.ROS_INTERFACE_VALUE) {
      throw Error(`Type msg ${type_msg} has incorrect identifier for ros value`)
    }
    super(type_msg)
    this.msg_type = type_msg.ros_msg_type
  }

  toTypeMsg(): NodeDataType {
    const type_msg = super.toTypeMsg()
    type_msg.type_identifier = DataTypeValues.ROS_INTERFACE_VALUE
    type_msg.ros_interface_kind = RosTypeValues.ROS_TOPIC
    type_msg.ros_msg_type = this.msg_type
    return type_msg
  }

  isCompatible(other: DataContainer): boolean {
    if (!(other instanceof RosValueType)) {
      return false
    }
    return this.msg_type === other.msg_type
  }

  prettyprint(): string {
    return this.msg_type
  }

  validate(value: any): string {
    const message_store = useMessageStore()
    const msg_info = message_store.ros_topic_messages.find((msg) => msg.name === this.msg_type)
    if (msg_info === undefined) {
      return `Can't find information for message ${this.msg_type}`
    }
    for (const field of msg_info.fields) {
      const field_type = getTypeFromMsg(field.type)
      const field_valid = field_type.validate(value[field.key])
      if (field_valid !== '') {
        return `Field ${field.key}: ${field_valid}`
      }
    }
    return ''
  }

  serializeValue(value: Record<string, any>): string {
    const message_store = useMessageStore()
    const msg_info = message_store.ros_topic_messages.find((msg) => msg.name === this.msg_type)
    if (msg_info === undefined) {
      throw Error(`Can't find information for message ${this.msg_type}`)
    }
    const ser_fields: Record<string, string> = {}
    for (const field of msg_info.fields) {
      const field_type = getTypeFromMsg(field.type)
      const field_value = field_type.serializeValue(value[field.key])
      ser_fields[field.key] = field_value
    }
    return JSON.stringify(ser_fields)
  }

  parseValue(ser_value: string): Record<string, any> {
    const message_store = useMessageStore()
    const msg_info = message_store.ros_topic_messages.find((msg) => msg.name === this.msg_type)
    if (msg_info === undefined) {
      throw Error(`Can't find information for message ${this.msg_type}`)
    }
    const dict_value = JSON.parse(ser_value)
    const value: Record<string, any> = {}
    for (const field of msg_info.fields) {
      const field_type = getTypeFromMsg(field.type)
      const field_value = field_type.parseValue(dict_value[field.key])
      value[field.key] = field_value
    }
    return value
  }

  getSerializedDefault(): string {
    const message_store = useMessageStore()
    const msg_info = message_store.ros_topic_messages.find((msg) => msg.name === this.msg_type)
    if (msg_info === undefined) {
      throw Error(`Can't find information for message ${this.msg_type}`)
    }
    const ser_fields: Record<string, string> = {}
    for (const field of msg_info.fields) {
      const field_type = getTypeFromMsg(field.type)
      const field_value = field_type.getSerializedDefault()
      ser_fields[field.key] = field_value
    }
    return JSON.stringify(ser_fields)
  }
}

export class RosNameType extends BuiltinContainer<string> {
  interface_kind: RosTypeValues
  interface_id: number

  constructor(type_msg: NodeDataType) {
    if (type_msg.type_identifier !== DataTypeValues.ROS_INTERFACE_NAME) {
      throw Error(`Type msg ${type_msg} has incorrect identifier for ros name`)
    }
    super(type_msg)
    this.interface_kind = type_msg.ros_interface_kind
    this.interface_id = type_msg.interface_id
  }

  toTypeMsg(): NodeDataType {
    const type_msg = super.toTypeMsg()
    type_msg.type_identifier = DataTypeValues.ROS_INTERFACE_NAME
    type_msg.ros_interface_kind = this.interface_kind
    type_msg.interface_id = this.interface_id
    return type_msg
  }

  isCompatible(other: DataContainer): boolean {
    if (!(other instanceof RosNameType)) {
      return false
    }
    if (this.interface_kind !== other.interface_kind) {
      return false
    }
    if (this.interface_id !== other.interface_id) {
      return false
    }
    return true
  }

  prettyprint(): string {
    switch (this.interface_kind) {
      case RosTypeValues.ROS_TOPIC:
        return 'topic name'
      case RosTypeValues.ROS_SERVICE:
        return 'service name'
      case RosTypeValues.ROS_ACTION:
        return 'action name'
      default:
        return 'ros name'
    }
  }

  validate(value: any): string {
    if (!(typeof value === 'string')) {
      return `Value ${value} is not a string`
    }
    return ''
  }

  getSerializedDefault(): string {
    return this.serializeValue('/foo')
  }
}

export class RosTypeType extends DataContainer<string> {
  interface_kind: RosTypeValues
  interface_id: number

  constructor(type_msg: NodeDataType) {
    if (type_msg.type_identifier !== DataTypeValues.ROS_INTERFACE_TYPE) {
      throw Error(`Type msg ${type_msg} has incorrect identifier for ros type`)
    }
    super(type_msg)
    this.interface_kind = type_msg.ros_interface_kind
    this.interface_id = type_msg.interface_id
  }

  toTypeMsg(): NodeDataType {
    const type_msg = super.toTypeMsg()
    type_msg.type_identifier = DataTypeValues.ROS_INTERFACE_TYPE
    type_msg.ros_interface_kind = this.interface_kind
    type_msg.interface_id = this.interface_id
    return type_msg
  }

  isCompatible(other: DataContainer): boolean {
    if (!(other instanceof RosNameType)) {
      return false
    }
    if (this.interface_kind !== other.interface_kind) {
      return false
    }
    if (this.interface_id !== other.interface_id) {
      return false
    }
    return true
  }

  prettyprint(): string {
    switch (this.interface_kind) {
      case RosTypeValues.ROS_TOPIC:
        return 'topic type'
      case RosTypeValues.ROS_SERVICE:
        return 'service type'
      case RosTypeValues.ROS_ACTION:
        return 'action type'
      case RosTypeValues.ROS_COMPONENT:
        return 'component type'
      default:
        return 'ros type'
    }
  }

  validate(value: any): string {
    if (!(typeof value === 'string')) {
      return `Value ${value} is not a string`
    }
    const message_store = useMessageStore()
    let type_list: string[] = []
    switch (this.interface_kind) {
      case RosTypeValues.ROS_TOPIC:
        type_list = message_store.ros_topic_messages.map((x) => x.name)
      case RosTypeValues.ROS_SERVICE:
        type_list = message_store.ros_service_messages
      case RosTypeValues.ROS_ACTION:
        type_list = message_store.ros_action_messages
      case RosTypeValues.ROS_COMPONENT:
        type_list = message_store.ros_all_messages
    }
    if (!type_list.includes(value)) {
      return `Value ${value} is not a valid type`
    }
    return ''
  }

  serializeValue(value: string): string {
    return value
  }

  parseValue(ser_value: string): string {
    return ser_value
  }

  getValueField(ser_value: string): DataContainer {
    const type_msg = getDefaultTypeMsg()
    type_msg.type_identifier = DataTypeValues.ROS_INTERFACE_VALUE
    type_msg.ros_interface_kind = this.interface_kind
    type_msg.ros_msg_type = this.parseValue(ser_value)
    return getTypeFromMsg(type_msg)
  }

  getSerializedDefault(): string {
    switch (this.interface_kind) {
      case RosTypeValues.ROS_TOPIC:
      case RosTypeValues.ROS_COMPONENT:
        return 'example_interfaces/msg/Empty'
      case RosTypeValues.ROS_SERVICE:
        return 'example_interfaces/srv/Trigger'
      case RosTypeValues.ROS_ACTION:
        return 'example_interfaces/action/Fibonacci'
      default:
        throw Error('Unknown ros type')
    }
  }
}

export class BuiltinOrRosType extends DataContainer<any> {
  inner_type: BuiltinType | RosTypeType
  valid_types: TypeValueOption[]

  constructor(type_msg: NodeDataType) {
    if (type_msg.type_identifier !== DataTypeValues.BUILTIN_OR_ROS_TYPE) {
      throw Error(`Type msg ${type_msg} has incorrect identifier for builtin`)
    }
    super(type_msg)
    this.valid_types = type_msg.serialized_value_options.map((x) => JSON.parse(x))
    const inner_type_msg = getDefaultTypeMsg()
    inner_type_msg.allow_dynamic = type_msg.allow_dynamic
    inner_type_msg.allow_static = type_msg.allow_static
    inner_type_msg.is_static = type_msg.is_static
    if (type_msg.ros_interface_kind === RosTypeValues.ROS_UNDEFINED) {
      inner_type_msg.type_identifier = DataTypeValues.BUILTIN_TYPE
      inner_type_msg.serialized_value_options = type_msg.serialized_value_options
      this.inner_type = new BuiltinType(inner_type_msg)
    } else {
      inner_type_msg.type_identifier = DataTypeValues.ROS_INTERFACE_TYPE
      inner_type_msg.ros_interface_kind = RosTypeValues.ROS_TOPIC
      this.inner_type = new RosTypeType(inner_type_msg)
    }
  }

  setInnerType(type: RosTypeValues) {
    const inner_type_msg = getDefaultTypeMsg()
    inner_type_msg.allow_dynamic = this.allow_dynamic
    inner_type_msg.allow_static = this.allow_static
    inner_type_msg.is_static = this.is_static
    if (type === RosTypeValues.ROS_UNDEFINED) {
      inner_type_msg.type_identifier = DataTypeValues.BUILTIN_TYPE
      inner_type_msg.serialized_value_options = this.valid_types.map((x) => JSON.stringify(x))
      this.inner_type = new BuiltinType(inner_type_msg)
    } else {
      inner_type_msg.type_identifier = DataTypeValues.ROS_INTERFACE_TYPE
      inner_type_msg.ros_interface_kind = RosTypeValues.ROS_TOPIC
      this.inner_type = new RosTypeType(inner_type_msg)
    }
  }

  toTypeMsg(): NodeDataType {
    const type_msg = this.inner_type.toTypeMsg()
    type_msg.type_identifier = DataTypeValues.BUILTIN_OR_ROS_TYPE
    type_msg.serialized_value_options = this.valid_types.map((x) => JSON.stringify(x))
    return type_msg
  }

  isCompatible(other: DataContainer): boolean {
    if (!(other instanceof BuiltinOrRosType)) {
      return false
    }
    return this.inner_type.isCompatible(other.inner_type)
  }

  prettyprint(): string {
    return this.inner_type.prettyprint()
  }

  validate(value: any): string {
    return this.inner_type.validate(value)
  }

  serializeValue(value: any): string {
    return this.inner_type.serializeValue(value)
  }

  parseValue(ser_value: string): any {
    return this.inner_type.parseValue(ser_value)
  }

  getValueField(ser_value: string): DataContainer {
    return this.inner_type.getValueField(ser_value)
  }

  getSerializedDefault(): string {
    return this.inner_type.getSerializedDefault()
  }
}

export abstract class ReferenceContainer extends DataContainer<any> {
  reference: string
  target_type?: NodeData

  constructor(type_msg: NodeDataType) {
    super(type_msg)
    this.reference = type_msg.reference_target
  }

  toTypeMsg(): NodeDataType {
    const type_msg = super.toTypeMsg()
    type_msg.reference_target = this.reference
    return type_msg
  }

  setInnerType(inputs: NodeData[]) {
    this.target_type = inputs.find((x) => x.key === this.reference)
  }

  getInnerType(): DataContainer | null {
    if (this.target_type === undefined) {
      return null
    }
    if (!isTypeContainer(this.target_type.type)) {
      throw Error(`Target ${this.reference} is not a type field`)
    }
    return this.target_type.type.getValueField(this.target_type.serialized_value)
  }
}

export class ReferenceType extends ReferenceContainer {
  constructor(type_msg: NodeDataType) {
    if (type_msg.type_identifier !== DataTypeValues.REFERENCE_TYPE) {
      throw Error(`Type msg ${type_msg} has incorrect identifier for reference`)
    }
    super(type_msg)
  }

  toTypeMsg(): NodeDataType {
    const type_msg = super.toTypeMsg()
    type_msg.type_identifier = DataTypeValues.REFERENCE_TYPE
    return type_msg
  }

  isCompatible(other: DataContainer): boolean {
    if (!(other instanceof ReferenceType)) {
      return false
    }
    return this.reference === other.reference
  }

  prettyprint(): string {
    const inner_type = this.getInnerType()
    if (inner_type === null) {
      return `Value reference (target: ${this.reference})`
    }
    return inner_type.prettyprint() + ` ref(${this.reference})`
  }

  validate(value: any): string {
    const inner_type = this.getInnerType()
    if (inner_type === null) {
      return `Cannot get inner type for reference ${this.reference}`
    }
    return inner_type.validate(value)
  }

  serializeValue(value: any): string {
    const inner_type = this.getInnerType()
    if (inner_type === null) {
      throw Error('Reference has no valid target')
    }
    return inner_type.serializeValue(value)
  }

  parseValue(value: any): string {
    const inner_type = this.getInnerType()
    if (inner_type === null) {
      throw Error('Reference has no valid target')
    }
    return inner_type.parseValue(value)
  }

  getSerializedDefault(): string {
    throw Error('No default for type fields')
  }
}
