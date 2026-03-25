<!--
 *  Copyright 2026 FZI Forschungszentrum Informatik
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
import type { StringType } from '@/types/data_classes'
import SearchableInput from '../SearchableInput.vue'
import Fuse from 'fuse.js'

const props = defineProps<{
  type: StringType
}>()

const value = defineModel<string>({
  get(value) {
    return props.type.parseValue(value)
  },
  set(value) {
    return props.type.serializeValue(value)
  }
})

function validate(event: Event) {
  const target = event.target as HTMLInputElement

  const value = target.value

  if (props.type.validate(value) !== '') {
    target.classList.add('is-invalid')
    return
  }

  target.classList.remove('is-invalid')
}
</script>

<template>
  <input
    v-if="type.valid_values.length === 0"
    v-model="value"
    type="text"
    class="form-control"
    :maxlength="type.max_length"
    @input="validate"
  />
  <SearchableInput
    v-else
    v-model="value"
    :item_list="type.valid_values"
    :search_fuse="new Fuse(type.valid_values)"
    :parse="(s: string) => s"
    :search_target="(s: string) => s"
    :render_function="(s: string) => s"
  />
</template>
