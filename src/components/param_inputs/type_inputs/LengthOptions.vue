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
import { INT_FLOAT_MAX } from '@/types/data_types'
import { ref, watch } from 'vue'

const value = defineModel<Record<string, any>>()

const enable_length_limit = ref<boolean>(value.value!.max_length !== INT_FLOAT_MAX)
watch(enable_length_limit, (val) => {
  if (value.value === undefined) {
    return
  }
  if (!val) {
    value.value.max_length = INT_FLOAT_MAX
    value.value.strict_length = false
  }
})
</script>

<template>
  <div v-if="value !== undefined" class="row mx-0 mb-1">
    <div class="input-group input-group-sm">
      <span class="input-group-text">Length:</span>
      <input
        v-model="value.max_length"
        type="number"
        class="form-control"
        :disabled="!enable_length_limit"
      />
      <span class="input-group-text">
        <input v-model="enable_length_limit" type="checkbox" />
      </span>
    </div>
    <div v-if="value.strict_length !== undefined" class="form-check ms-3">
      <input
        v-model="value.strict_length"
        type="checkbox"
        class="form-check-input"
        :disabled="!enable_length_limit"
      />
      <label class="form-check-label">Strict</label>
    </div>
  </div>
  <div v-else>Error loading param data</div>
</template>
