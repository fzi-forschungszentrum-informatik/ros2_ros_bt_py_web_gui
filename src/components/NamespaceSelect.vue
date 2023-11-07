<script setup lang="ts">
import { ref } from 'vue'
import type { ServicesForTypeRequest, ServicesForTypeResponse } from "@/types/services/ServicesForType";
import { useROSStore } from "../stores/ros";
const ros = useROSStore();

let edit_rosbridge_server = ref<boolean>(false);
let new_url = ref<string>(ros.url);

function handleNamespaceChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    ros.changeNamespace(target.value);
}

function updateAvailableNamespaces(_event: Event) {
    if (ros.services_for_type_service === undefined) {
        console.error("ServiceForTypeService not available!");
        return;
    }
    ros.services_for_type_service.callService(
        // Search for all Tree topics - we expect each BT node to
        // publish one of these, and also offer the corresponding
        // editing and runtime control services.
        {
            type: "ros_bt_py_interfaces/srv/AddNode",
        } as ServicesForTypeRequest,
        (response: ServicesForTypeResponse) => {
            const namespaces = response.services.map(
                // Chop off the topic name (but not the last slash), which leaves us with the BT
                // namespace
                (x) => x.substr(0, x.lastIndexOf("/")) + "/"
            );
            ros.setAvailableNamespaces(namespaces);
            if (ros.namespace === "" && namespaces.length > 0) {
                ros.changeNamespace(namespaces[0])
            }
        }
    );
}

function editRosbridgeServer(_event: Event) {
    edit_rosbridge_server.value = !edit_rosbridge_server.value;
}

function changeRosbridgeServer(event: Event) {
    const target = event.target as HTMLInputElement;
    new_url.value = target.value;
}

function saveRosbridgeServer(_event: Event) {
    ros.connect(new_url.value);
}

</script>

<template>
    <div key="connection_status_connected" v-if="ros.connected && ros.packages_available && ros.messages_available">
        <font-awesome-icon icon="fa-solid fa-wifi" aria-hidden="true" class="connected" title="Connected" />
    </div>
    <div key="connection_status_package" v-else-if="ros.connected && ros.messages_available">
        <font-awesome-icon icon="fa-solid fa-wifi" aria-hidden="true" class="packages-missing"
            title="Connected, package list not (yet) available. File browser will not work." />
    </div>
    <div key="connection_status_message" v-else-if="ros.connected">
        <font-awesome-icon icon="fa-solid fa-wifi" aria-hidden="true" class="messages-missing"
            title="Connected, message info not (yet) available. ROS-type autocompletion will not work." />
    </div>
    <div key="connection_status_disconnected" v-else>
        <font-awesome-icon icon="fa-solid fa-wifi" aria-hidden="true" class="disconnected" title="Disconnected" />
    </div>
    <div class="d-flex flex-row align-items-center">
        <label class="ms-1">Namespace:</label>
        <select class="form-select ms-1" v-bind:value="ros.namespace" @change="handleNamespaceChange">
            <option v-for="namespace in ros.available_namespaces" v-bind:key="namespace" v-bind:value="namespace">
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
        <div class="input-group m-1">
            <label class="input-group-text">Rosbridge Server:</label>
            <input class="form-control" type="text" placeholder="Websocket URL" aria-describedby="websocketURL"
                aria-label="Websocket URL" v-bind:value="new_url" @change="changeRosbridgeServer" />
            <button type="button" @click="saveRosbridgeServer" class="btn btn-primary">
                Save
            </button>
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