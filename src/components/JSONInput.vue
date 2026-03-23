<!--
 *  Copyright 2024-2026 FZI Forschungszentrum Informatik
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
import type { DataContainer } from '@/types/data_classes'
import JSONEditor from 'jsoneditor'
import 'jsoneditor/dist/jsoneditor.min.css'
import { onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  type: DataContainer
}>()

const value = defineModel()

const editor_ref = ref<HTMLDivElement>()
let editor: JSONEditor | undefined = undefined

// We have to watch the `type` prop instead of `value` to not act on our own changes,
//   since pausing and resuming the watcher doesn't work.
watch(
  () => props.type,
  () => {
    if (editor === undefined) {
      return
    }
    editor.set(value.value)
  }
)

function handleChange() {
  if (editor === undefined) {
    return
  }
  try {
    value.value = editor.get()
  } catch {
    return
  }
}

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

  editor.update(value.value)
})

onUnmounted(() => {
  if (editor !== undefined) {
    editor.destroy()
  }
})
</script>

<template>
  <div id="editor" ref="editor_ref"></div>
</template>
