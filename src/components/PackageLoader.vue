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
import { onMounted, ref } from 'vue'
import { useROSStore } from '@/stores/ros'
import type {
  GetAvailableNodesRequest,
  GetAvailableNodesResponse
} from '@/types/services/GetAvailableNodes'
import { useNodesStore } from '@/stores/nodes'
import { notify } from '@kyvg/vue3-notification'

const ros_store = useROSStore()
const nodes_store = useNodesStore()

const collapsed = ref<boolean>(false)
const package_name = ref<string>('ros_bt_py.nodes.sequence')

function toggleCollapsed() {
  collapsed.value = !collapsed.value
}

function handlePackageNameChange(event: Event) {
  const target = event.target as HTMLInputElement
  package_name.value = target.value
}

function getNodes(package_name: string) {
  ros_store.get_available_nodes_service.callService(
    {
      node_modules: [package_name]
    } as GetAvailableNodesRequest,
    (response: GetAvailableNodesResponse) => {
      if (response.success) {
        nodes_store.updateAvailableNode(response.available_nodes)
        notify({
          title: 'Updated available BT nodes!',
          type: 'success'
        })
      } else {
        notify({
          title: 'Failed to update available BT nodes!',
          text: response.error_message,
          type: 'error'
        })
      }
    },
    (failed: string) => {
      notify({
        title: 'Failed to call GetAvailableNodes service!',
        text: failed,
        type: 'error'
      })
    }
  )
}
onMounted(() => {
  getNodes('')
})
</script>

<template>
  <div class="border rounded mb-2">
    <div @click="toggleCollapsed" class="text-center cursor-pointer font-weight-bold m-2">
      Package Loader
      <font-awesome-icon v-if="!collapsed" icon="fa-solid fa-angle-up" aria-hidden="true" />
      <font-awesome-icon v-else icon="fa-solid fa-angle-down" aria-hidden="true" />
    </div>
    <div class="m-2" v-if="!collapsed">
      <div class="d-grid gap-2 mb-2">
        <button id="refresh" class="btn btn-block btn-primary mt-2" @click="() => getNodes('')">
          Refresh
        </button>
      </div>
      <div class="input-group mb-3">
        <input
          type="text"
          class="form-control"
          id="loadPackageForm"
          aria-describedby="loadPackageFormConfirm"
          aria-label="Load Package"
          v-bind:value="package_name"
          @change="handlePackageNameChange"
        />
        <button
          type="button"
          className="btn btn-block btn-outline-primary"
          @click="() => getNodes(package_name)"
          id="loadPackageFormConfirm"
        >
          Load package
        </button>
      </div>
    </div>
  </div>
</template>
