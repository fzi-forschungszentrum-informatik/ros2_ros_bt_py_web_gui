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
import { useEditNodeStore } from '@/stores/edit_node';
import type { OptionData, PyB64 } from '@/types/types';
import { hexToPyB64, pyB64ToHex } from '@/utils';
import { computed } from 'vue';


const edit_node_store = useEditNodeStore()

const props = defineProps<{
    category: 'options',
    data_key: string
}>()

const param = computed<OptionData | undefined>(() =>
  edit_node_store.new_node_options.find((x) => x.key === props.data_key)
)

const display_value = computed<string>(() => {
  if (param.value === undefined) {
    return ''
  }
  const value = param.value.value.value as PyB64
  return pyB64ToHex(value)
})

function validate(event: Event) {
  if (param.value === undefined) {
    console.error('Undefined parameter')
    return
  }

  const target = event.target as HTMLInputElement

  try {
    hexToPyB64(target.value)
  } catch {
    target.classList.add('is-invalid')
    //edit_node_store.node_is_valid = false
    return
  }
  target.classList.remove('is-invalid')
  //edit_node_store.node_is_valid = true
}

function onChange(event: Event) {
  if (param.value === undefined) {
    console.error('Undefined parameter')
    return
  }

  const target = event.target as HTMLInputElement
  let py_b64: PyB64
  try {
    py_b64 = hexToPyB64(target.value)
  } catch {
    return
  }
  edit_node_store.updateParamValue(props.category, param.value.key, py_b64)
}

</script>

<template>
  <div v-if="param !== undefined" class="form-group">
    <label class="d-block">
      {{ param.key }}
    </label>
    <input
      class="form-control"
      type="text"
      :value="display_value"
      @change="onChange"
      @input="validate"
    />
  </div>
  <div v-else>Error loading param data</div>
</template>
