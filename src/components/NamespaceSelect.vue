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
import { onMounted, ref } from 'vue'
import type {
  ServicesForTypeRequest,
  ServicesForTypeResponse
} from '@/types/services/ServicesForType'
import { notify } from '@kyvg/vue3-notification'
import { useROSStore } from '../stores/ros'

const ros_store = useROSStore()

const edit_rosbridge_server = ref<boolean>(false)
const new_url = ref<string>(ros_store.url)

function handleNamespaceChange(event: Event) {
  const target = event.target as HTMLSelectElement
  ros_store.changeNamespace(target.value)
}

function updateAvailableNamespaces() {
  if (ros_store.services_for_type_service === undefined) {
    notify({
      title: 'Service not available!',
      text: 'ServiceForType ROS service is not connected!',
      type: 'error'
    })
    return
  }
  ros_store.services_for_type_service.callService(
    // Search for all Tree topics - we expect each BT node to
    // publish one of these, and also offer the corresponding
    // editing and runtime control services.
    {
      type: 'ros_bt_py_interfaces/srv/AddNode'
    } as ServicesForTypeRequest,
    (response: ServicesForTypeResponse) => {
      const namespaces = response.services.map(
        // Chop off the topic name (but not the last slash), which leaves us with the BT
        // namespace
        (x) => x.substring(0, x.lastIndexOf('/')) + '/'
      )
      if (namespaces.length > 0) {
        ros_store.setAvailableNamespaces(namespaces)
        if (ros_store.namespace === '') {
          ros_store.changeNamespace(namespaces[0])
        }
      }
    }
  )
}

function changeRosbridgeServer(event: Event) {
  const target = event.target as HTMLInputElement
  new_url.value = target.value
}

function saveRosbridgeServer() {
  ros_store.setUrl(new_url.value)
  edit_rosbridge_server.value = false
}

onMounted(updateAvailableNamespaces)
</script>

<template>
  <div>
    <div class="h4 my-3">Connection Settings</div>

    <div class="form-check form-switch my-3 fs-5">
      <input
        type="checkbox"
        class="form-check-input"
        :checked="ros_store.auto_connect"
        @click="ros_store.toggleAutoConnect"
      />
      <label class="form-check-label ms-2"> Automatic reconnect </label>
    </div>

    <div class="input-group flex-nowrap my-3">
      <label class="input-group-text">Namespace</label>
      <select
        class="form-select w-auto"
        :value="ros_store.namespace"
        @change="handleNamespaceChange"
      >
        <option
          v-for="namespace in ros_store.available_namespaces"
          :key="namespace"
          :value="namespace"
        >
          {{ namespace }}
        </option>
      </select>
      <button type="button" class="btn btn-outline-secondary" @click="updateAvailableNamespaces">
        <FontAwesomeIcon icon="fa-solid fa-sync" aria-hidden="true" />
      </button>
    </div>

    <div class="input-group flex-nowrap my-3">
      <label class="input-group-text">Rosbridge Server</label>
      <input
        class="form-control"
        type="text"
        placeholder="Websocket URL"
        aria-describedby="websocketURL"
        aria-label="Websocket URL"
        :value="new_url"
        @change="changeRosbridgeServer"
      />
      <button type="button" class="btn btn-primary" @click="saveRosbridgeServer">Save</button>
    </div>
  </div>
</template>
