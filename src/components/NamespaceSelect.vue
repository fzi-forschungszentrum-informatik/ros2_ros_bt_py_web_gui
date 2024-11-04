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
import { onMounted, ref } from 'vue'
import type {
  ServicesForTypeRequest,
  ServicesForTypeResponse
} from '@/types/services/ServicesForType'
import { notify } from '@kyvg/vue3-notification'
import { useROSStore } from '../stores/ros'
import { useMessasgeStore } from '@/stores/message'
import { usePackageStore } from '@/stores/package'
const ros_store = useROSStore()
const messages_store = useMessasgeStore()
const packages_store = usePackageStore()

let edit_rosbridge_server = ref<boolean>(false)
let new_url = ref<string>(ros_store.url)

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

function editRosbridgeServer() {
  edit_rosbridge_server.value = !edit_rosbridge_server.value
}

function changeRosbridgeServer(event: Event) {
  const target = event.target as HTMLInputElement
  new_url.value = target.value
}

function saveRosbridgeServer() {
  ros_store.setUrl(new_url.value)
  ros_store.connect()
}

onMounted(updateAvailableNamespaces)

</script>

<template>
  <!--TODO redo layout using input-group properly-->
  <div class="d-flex align-items-center">
    <div
      key="connection_status_connected"
      v-if="
        ros_store.connected && packages_store.packages_available && messages_store.messages_available
      "
    >
      <font-awesome-icon
        icon="fa-solid fa-wifi"
        aria-hidden="true"
        class="connected"
        title="Connected"
      />
    </div>
    <div
      key="connection_status_package"
      v-else-if="ros_store.connected && messages_store.messages_available"
    >
      <font-awesome-icon
        icon="fa-solid fa-wifi"
        aria-hidden="true"
        class="packages-missing"
        title="Connected, package list not (yet) available. File browser will not work."
      />
    </div>
    <div key="connection_status_message" v-else-if="ros_store.connected">
      <font-awesome-icon
        icon="fa-solid fa-wifi"
        aria-hidden="true"
        class="messages-missing"
        title="Connected, message info not (yet) available. ROS-type autocompletion will not work."
      />
    </div>
    <div key="connection_status_disconnected" v-else>
      <font-awesome-icon
        icon="fa-solid fa-wifi"
        aria-hidden="true"
        class="disconnected"
        title="Disconnected"
      />
    </div>
    <div class="d-flex flex-row align-items-center">
      <label class="ms-1">Namespace:</label>
      <select
        class="form-select ms-1"
        v-bind:value="ros_store.namespace"
        @change="handleNamespaceChange"
      >
        <option
          v-for="namespace in ros_store.available_namespaces"
          v-bind:key="namespace"
          v-bind:value="namespace"
        >
          {{ namespace }}
        </option>
      </select>
    </div>
    <button type="button" class="btn btn-sm m-1" @click="updateAvailableNamespaces">
      <font-awesome-icon icon="fa-solid fa-sync" aria-hidden="true" />
      <span class="sr-only">Refresh Namespaces</span>
    </button>
    <button type="button" class="btn btn-sm m-1" @click="editRosbridgeServer">
      <font-awesome-icon icon="fa-solid fa-cog" aria-hidden="true" />
      <span class="sr-only">Edit rosbridge server</span>
    </button>
    <div className="d-flex flex-row align-items-center" v-if="edit_rosbridge_server">
      <div class="input-group">
        <label class="input-group-text">Rosbridge Server:</label>
        <input
          class="form-control"
          type="text"
          placeholder="Websocket URL"
          aria-describedby="websocketURL"
          aria-label="Websocket URL"
          v-bind:value="new_url"
          @change="changeRosbridgeServer"
        />
        <button type="button" @click="saveRosbridgeServer" class="btn btn-primary">Save</button>
      </div>
    </div>
  </div>
</template>

<style>
.connected {
  padding: 0.25rem;
  color: #0caa19;
}

.disconnected {
  padding: 0.25rem;
  color: #ff0000;
}

.packages-missing {
  padding: 0.25rem;
  color: #ff7300;
}

.messages-missing {
  padding: 0.25rem;
  color: #ffd000;
}
</style>
