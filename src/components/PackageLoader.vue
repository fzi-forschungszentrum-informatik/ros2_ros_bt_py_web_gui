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
