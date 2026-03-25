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
import type { BytesType } from '@/types/data_classes'

const props = defineProps<{
  type: BytesType
}>()

const value = defineModel<string>({
  get(value) {
    return props.type.parseValue(value)
  },
  set(value) {
    return props.type.serializeValue(cleanHexString(value))
  }
})

const nonhex_regex = /[^0-9A-F]/g

function cleanHexString(input: string): string {
  // Normalize to uppercase and strip non-hex characters
  let val = input.toUpperCase().replaceAll(nonhex_regex, '')

  // If length is odd, prepend a zero
  if (val.length % 2 !== 0) {
    val = '0' + val
  }

  return val
}

function validate(event: Event) {
  const target = event.target as HTMLInputElement

  const value = cleanHexString(target.value)

  console.log(props.type.validate(value))

  if (props.type.validate(value) !== '') {
    target.classList.add('is-invalid')
  } else {
    target.classList.remove('is-invalid')
  }
}

function setValue(event: Event) {
  const target = event.target as HTMLInputElement

  value.value = target.value
}
</script>

<template>
  <input
    type="text"
    class="form-control"
    :value="value"
    :minlength="type.max_length * 2 - 1"
    :maxlength="type.max_length * 2"
    @input="validate"
    @change="setValue"
  />
</template>
