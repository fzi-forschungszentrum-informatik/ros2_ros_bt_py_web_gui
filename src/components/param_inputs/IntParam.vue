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
import type { IntType } from '@/types/data_classes'

const props = defineProps<{
  type: IntType
}>()

const value = defineModel<string, never, bigint, bigint>({
  get(value) {
    return BigInt(props.type.parseValue(value))
  },
  set(value) {
    return props.type.serializeValue(Number(value))
  }
})

function parseBigInt(string_value: string): bigint | null {
  let value: bigint
  try {
    value = BigInt(string_value)
  } catch {
    try {
      value = BigInt(Number(string_value))
    } catch {
      return null
    }
  }
  return value
}

function validate(event: Event) {
  const target = event.target as HTMLInputElement

  const new_val = parseBigInt(target.value)
  if (new_val === null) {
    target.classList.add('is-invalid')
    return
  }

  if (new_val < props.type.min_value || new_val > props.type.max_value) {
    target.classList.add('is-invalid')
    return
  }
  target.classList.remove('is-invalid')
}

function setValue(event: Event) {
  const target = event.target as HTMLInputElement

  const new_val = parseBigInt(target.value)
  if (new_val === null) {
    return
  }
  value.value = new_val
}
</script>

<template>
  <input
    type="number"
    class="form-control"
    :value="value"
    :min="Number(type.min_value)"
    :max="Number(type.max_value)"
    @input="validate"
    @change="setValue"
  />
</template>
