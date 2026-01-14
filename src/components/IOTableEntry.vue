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
import type { NodeIO } from '@/types/types'
import { prettyprint_type } from '@/utils'
import { ref } from 'vue'

defineProps<{
  io_node_data: NodeIO[]
  title: string
}>()

const show_details = ref<boolean>(true)
</script>

<template>
  <div class="list-group-item">
    <div class="d-flex w-100">
      <div class="fs-5">{{ title }}</div>
      <FontAwesomeIcon
        :icon="'fa-solid ' + (show_details ? 'fa-angle-up' : 'fa-angle-down')"
        aria-hidden="true"
        class="cursor-pointer ms-auto"
        @click="() => (show_details = !show_details)"
      />
    </div>
    <template v-if="show_details">
      <template v-for="node_data in io_node_data" :key="title + node_data.key">
        <div class="text-truncate">
          {{ node_data.key }}
        </div>
        <div class="text-truncate text-muted ms-2 mb-2">
          {{ prettyprint_type(node_data.serialized_type) }}
        </div>
      </template>
    </template>
  </div>
</template>
