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
import type { ParamData } from '@/types/types'

defineProps<{
  param: ParamData
  name: string
}>()
</script>

<template>
  <div class="list-group-item">
    <div
      v-if="
        param.value.type === 'int' || param.value.type === 'float' || param.value.type === 'string'
      "
    >
      <h5>
        {{ param.key + ' ' }}
        <span className="text-muted">(type: {{ param.value.type }})</span>
      </h5>
      <span>{{ param.value.value as string }}</span>
    </div>
    <div v-else-if="param.value.type === 'type'">
      <h5>
        {{ param.key + ' ' }}
        <span className="text-muted">(type: {{ param.value.type }})</span>
      </h5>
      <pre>{{ param.value.value as string }}</pre>
    </div>
    <div v-else-if="param.value.type === 'boolean'">
      <h5>
        {{ param.key + ' ' }}
        <span className="text-muted">(type: {{ param.value.type }})</span>
      </h5>
      <pre>{{ param.value.value ? 'True' : 'False' }}</pre>
    </div>
    <div v-else-if="param.value.type === 'unset_optionref'">
      <h5>
        {{ param.key + ' ' }}
        <span className="text-muted">(type: {{ param.value.type }})</span>
      </h5>
      <pre class="text-muted">{{ param.value.value as string }}</pre>
    </div>
    <div v-else>
      <h5>
        {{ param.key + ' ' }}
        <span className="text-muted">(type: {{ param.value.type }})</span>
      </h5>
      <pre>{{ JSON.stringify(param.value.value, null, 2) }}</pre>
    </div>
  </div>
</template>
