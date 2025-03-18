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
import { useROSStore } from '@/stores/ros'
import { RosTopicType_Name, type RosType } from '@/types/python_types'
import type { GetMessageFieldsRequest, GetMessageFieldsResponse } from '@/types/services/GetMessageFields'
import type { OptionData } from '@/types/types'
import { notify } from '@kyvg/vue3-notification'
import JSONEditor from 'jsoneditor'

import 'jsoneditor/dist/jsoneditor.min.css'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

const edit_node_store = useEditNodeStore()
const ros_store = useROSStore()

const props = defineProps<{
  category: 'options'
  data_key: string
}>()

const param = computed<OptionData | undefined>(() =>
  edit_node_store.new_node_options.find((x) => x.key === props.data_key)
)

const is_valid = ref<boolean>(true)

const editor_ref = ref<HTMLDivElement>()
let editor: JSONEditor | undefined = undefined

// Checks if there is a parameter that could be used to fetch
// a default value for Ros Messages
const is_topic_ref = computed<boolean>(() => {
  if (param.value === undefined) {
    return false
  }
  if (param.value.value.type === 'dict(ros)') {
    return true
  }
  return false
})

const topic_ref_param = computed<OptionData | undefined>(() => {
  if (!is_topic_ref.value) {
    return undefined
  }
  return edit_node_store.new_node_options.find((x) => x.value.type === RosTopicType_Name)
})

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
    console.debug(e)
    is_valid.value = false
  }
}

function fetchRosMessageDefault() {
  if (topic_ref_param.value === undefined) {
    console.warn("Nothing to fetch")
    return
  }
  const message_type = (topic_ref_param.value.value.value as RosType).type_str
  console.log(message_type)
  ros_store.get_message_fields_service.callService(
    {
      message_type: message_type
    } as GetMessageFieldsRequest,
    (response: GetMessageFieldsResponse) => {
      console.log(response)
      if (response.success) {
        const fields_json = JSON.parse(response.fields)
        if (editor !== undefined) {
          editor.update(fields_json)
        }
        edit_node_store.updateParamValue(props.category, props.data_key, fields_json)
        notify({
          title: 'Successfully loaded message fields!',
          text: '',
          type: 'success'
        })
      } else {
        notify({
          title: 'Failed to load message fields!',
          text: response.error_message,
          type: 'warn'
        })
      }
    },
    (error: string) => {
      notify({
        title: 'Failed to call GetMessageFields service!',
        text: error,
        type: 'error'
      })
    }
  )
  console.log("Sent message fields request")
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
  <div class="d-flex align-items-center justify-content-between mb-1">
    <label>
      {{ param?.key }}
    </label>
    <button
      v-if="topic_ref_param"
      class="btn btn-primary btn-sm"
      @click="fetchRosMessageDefault"
    >
      Fetch default message fields
    </button>
  </div>
  <div id="editor" ref="editor_ref" @focus="onFocus"></div>
</template>
