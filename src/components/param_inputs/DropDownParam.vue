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
<script setup lang="ts">
import type { ParamData, PyLogger } from '@/types/types'
import { ref } from 'vue'

const props = defineProps<{
  param: ParamData
  name: string
  updateValue: (param_type: string, key: string, value: any) => void
}>()

function handleChange(event: Event) {
  const target = event.target as HTMLSelectElement
  logger_level.value = target.value

  let logger = props.param.value.value as PyLogger
  logger.logger_level = logger_level.value

  props.updateValue(props.param.value.type, props.param.key, logger)
}

const logger_level = ref<string>((props.param.value.value as PyLogger).logger_level)
</script>

<template>
  <div class="form-group">
    <label class="d-block">
      {{ param.key }}
    </label>
    <select :value="logger_level" @change="handleChange">
      <option value="debug">DEBUG</option>
      <option value="info">INFO</option>
      <option value="warning">WARNING</option>
      <option value="error">ERROR</option>
      <option value="fatal">FATAL</option>
    </select>
  </div>
</template>
