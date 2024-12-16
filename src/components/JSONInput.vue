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
import { useEditNodeStore } from '@/stores/edit_node'
import { useEditorStore } from '@/stores/editor'
import { useROSStore } from '@/stores/ros'
import type {
  GetMessageFieldsRequest,
  GetMessageFieldsResponse
} from '@/types/services/GetMessageFields'
import type { ParamData } from '@/types/types'
import { getMessageType } from '@/utils'
import { notify } from '@kyvg/vue3-notification'
import JSONEditor from 'jsoneditor'

import 'jsoneditor/dist/jsoneditor.min.css'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

const editor_store = useEditorStore()
const edit_node_store = useEditNodeStore()
const ros_store = useROSStore()

const props = defineProps<{
  category: 'options'
  data_key: string
}>()

const param = computed<ParamData | undefined>(() =>
  edit_node_store.new_node_options.find((x) => x.key === props.data_key)
)

const is_valid = ref<boolean>(true)
const pyobjectstring = ref<string | undefined>(undefined)
const field_names = ref<string[]>([])

const editor_ref = ref<HTMLDivElement>()
let editor: JSONEditor | undefined = undefined

function onFocus() {
  edit_node_store.changeCopyMode(false)
}

function handleChange() {
  if (editor === undefined) {
    return
  }
  try {
    const new_value = editor.get()
    is_valid.value = true
    edit_node_store.updateParamValue(props.category, props.data_key, new_value)
  } catch (e) {
    is_valid.value = false
  }
}

//TODO maybe this would be better placed in the getDefaultValue utility function
function updateMessageType() {
  if (param.value === undefined) {
    return
  }

  // Trim the leading '__' that is sometimes added
  let message_type: string
  if (param.value.value.type.startsWith('__')) {
    message_type = param.value.value.type.substring('__'.length)
  } else {
    message_type = param.value.value.type
  }

  const message = getMessageType(message_type)
  if (message.msg === '/dict' || message.msg === '') {
    /*notify({
      title: 'Cannot request message infos!',
      text: 'Message is a dict not a ROS message!',
      type: 'warn'
    })*/
    return
  } else {
    ros_store.get_message_fields_service.callService(
      {
        message_type: message.msg,
        service: message.service,
        action: message.action,
        type: message.type
      } as GetMessageFieldsRequest,
      (response: GetMessageFieldsResponse) => {
        if (response.success) {
          pyobjectstring.value = response.fields
          field_names.value = response.field_names

          const new_value = JSON.parse(response.fields)
          console.log(new_value)

          if (editor === undefined) {
            return
          }
          editor.update(new_value)
          handleChange()
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

// This fires when param type changes and updates the editor accordingly
watch(
  () => {
    if (param.value === undefined) {
      return ''
    }
    return param.value.value.type
  },
  () => {
    if (editor === undefined || param.value === undefined) {
      return
    }
    editor.update(param.value.value.value)
    updateMessageType()
  }
)

onMounted(() => {
  if (editor_ref.value === undefined) {
    return
  }

  editor = new JSONEditor(editor_ref.value, {
    mode: 'code',
    onChange: () => handleChange()
  })
  editor.aceEditor.setOptions({ maxLines: 100 })
  editor.aceEditor.resize()

  if (param.value !== undefined) {
    editor.update(param.value.value.value)
  }
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
