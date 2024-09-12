<!--
 *  Copyright 2024 FZI Forschungszentrum Informatik
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
import { useEditorStore } from '@/stores/editor'
import { useROSStore } from '@/stores/ros'
import type {
  GetMessageFieldsRequest,
  GetMessageFieldsResponse
} from '@/types/services/GetMessageFields'
import { getMessageType } from '@/utils'
import { notify } from '@kyvg/vue3-notification'
import JSONEditor from 'jsoneditor'

import 'jsoneditor/dist/jsoneditor.min.css'
import { onMounted, onUnmounted, ref } from 'vue'

const editor_store = useEditorStore()
const ros_store = useROSStore()

const props = defineProps<{
  param_key: string
  json: string | undefined
  message_type: string
  output: string
  updateValidity: (valid: boolean) => void
  updateValue: (param_type: string, key: string, value: any) => void
}>()

function onFocus() {
  editor_store.changeCopyMode(false)
}

function handleChange() {
  if (editor === undefined) {
    return
  }
  try {
    const new_json = editor.get()
    current_json.value = JSON.stringify(new_json)
    is_valid.value = true

    if (props.output == 'pickled') {
      if (pyobjectstring.value === undefined) {
        return
      }
      const reconstructed = getPyObjectFromJSON(JSON.parse(pyobjectstring.value), current_json)

      props.updateValue(message_type.value, props.param_key, reconstructed)
    } else {
      props.updateValue(message_type.value, props.param_key, current_json.value)
    }
    props.updateValidity(true)
  } catch (e) {
    is_valid.value = false
    props.updateValidity(false)
  }
}

function updateMessageType(new_message_type: string, json: string | object, just_mounted: boolean) {
  /*let type_changed = true
  if (message_type.value === new_message_type) {
    type_changed = false
  } else {
    message_type.value = new_message_type
    type_changed = true
  }*/
  const message = getMessageType(new_message_type)
  if (message.message_type === '/dict' || message.message_type === undefined) {
    notify({
      title: 'Cannot request message infos!',
      text: 'Message is a dict not a ROS message!',
      type: 'warn'
    })
    return
  } else {
    ros_store.get_message_fields_service.callService(
      {
        message_type: message.message_type,
        service: message.service,
        action: message.action
      } as GetMessageFieldsRequest,
      (response: GetMessageFieldsResponse) => {
        if (response.success) {
          pyobjectstring.value = response.fields

          /*let new_value
          if (type_changed) {
            //new_value = getJSONfromPyObject(JSON.parse(response.fields), response.field_names).json
            new_value = JSON.parse(response.fields)
          } else {
            //new_value = getJSONfromPyObject(json, response.field_names).json
          }*/
          //const new_value = getJSONfromPyObject(JSON.parse(response.fields), response.field_names).json
          const new_value = JSON.parse(response.fields)
          console.error(new_value)
          current_json.value = new_value
          field_names.value = response.field_names
          if (editor) {
            editor.update(new_value)
          }

          if (!just_mounted) {
            handleChange()
          }
        } else {
          notify({
            title: 'GetMessageFields Service Error',
            text: response.error_message,
            type: 'error'
          })
        }
      },
      (failed) => {
        notify({
          title: 'Failure calling GetMessageFields Service',
          text: failed,
          type: 'error'
        })
      }
    )
  }
}

const current_json = ref<object | string>(props.json ? props.json : {})
let initial_validity = false

try {
  JSON.parse(JSON.stringify(props.json))
  initial_validity = true
} catch (e) {
  initial_validity = false
}

const is_valid = ref<boolean>(initial_validity)
const pyobjectstring = ref<string | undefined>(undefined)
const field_names = ref<string[]>([])
// getDefaultValue prepends an '__' to unrecognized types, we need to strip it here
const message_type = ref<string>(props.message_type.replace('__', ''))

const editor_ref = ref<HTMLDivElement>()
let editor: JSONEditor | undefined = undefined

function getJSONfromPyObject(
  pyobject: object,
  field_names: string[]
): { json: object; counter: number } {
  const json = {}
  let counter = 0
  // eslint-disable-next-line no-prototype-builtins
  if (pyobject.hasOwnProperty('py/object')) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: Unsafe accessor
    for (const field_name of field_names) {
      // eslint-disable-next-line no-prototype-builtins
      if (pyobject.hasOwnProperty('_' + field_name)) {
        json[field_name as keyof typeof json] =
          pyobject[('_' + field_name) as keyof typeof pyobject]
        counter += 1
      }
    }
  }
  return { json: json, counter: counter }
}

function getPyObjectFromJSON(pyobject: object, json: object) {
  const keys = Object.keys(json)
  // eslint-disable-next-line no-prototype-builtins
  if (pyobject.hasOwnProperty('py/object')) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: Unsafe accessor
    for (const key of keys) {
      // eslint-disable-next-line no-prototype-builtins
      if (pyobject.hasOwnProperty('_' + key)) {
        pyobject[('_' + key) as keyof typeof pyobject] = json[key as keyof typeof json]
      }
    }
  }
  return pyobject
}

onMounted(() => {
  if (editor_ref.value === undefined) {
    return
  }

  editor = new JSONEditor(editor_ref.value, {
    mode: 'code',
    onChange: handleChange
  })
  editor.set(current_json.value)
  editor.aceEditor.setOptions({ maxLines: 100 })
  editor.aceEditor.resize()

  updateMessageType(message_type.value, current_json.value, true)
})

onUnmounted(() => {
  if (editor !== undefined) {
    editor.destroy()
  }
})
</script>

<template>
  <div id="editor" ref="editor_ref" @focus="onFocus"></div>
</template>
