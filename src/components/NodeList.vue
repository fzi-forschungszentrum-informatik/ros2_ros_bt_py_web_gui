<script setup lang="ts">
import { useEditorStore } from '@/stores/editor'
import { useNodesStore } from '@/stores/nodes'
import type { DocumentedNode } from '@/types/types'
import { computed, onMounted, ref } from 'vue'
import NodeListItem from './NodeListItem.vue'
import { useROSStore } from '@/stores/ros'
import type {
  GetAvailableNodesRequest,
  GetAvailableNodesResponse
} from '@/types/services/GetAvailableNodes'
import { notify } from '@kyvg/vue3-notification'

const nodelist_collapsed = ref<boolean>(false)

const nodes_store = useNodesStore()
const editor_store = useEditorStore()
const ros_store = useROSStore()

const byName = function (a: DocumentedNode, b: DocumentedNode) {
  if (a.node_class < b.node_class) {
    return -1
  } else if (a.node_class > b.node_class) {
    return 1
  }

  return 0
}

const moduleThenName = function (a: DocumentedNode, b: DocumentedNode) {
  if (a.module < b.module) {
    return -1
  } else if (a.module > b.module) {
    return 1
  }

  return byName(a, b)
}

const nodes = computed<DocumentedNode[]>(() => {
  if (editor_store.filtered_nodes.length > 0) {
    return editor_store.filtered_nodes
  } else {
    let nodes = [...nodes_store.nodes].sort(byName)
    nodes = nodes.sort(moduleThenName)
    return nodes
  }
})

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
  <div class="available-nodes m-1">
    <div class="vertical_list">
      <div class="border rounded mb-2">
        <div
          @click="
            () => {
              nodelist_collapsed = !nodelist_collapsed
            }
          "
          class="text-center cursor-pointer font-weight-bold m-2"
        >
          Node List
          <font-awesome-icon
            v-if="!nodelist_collapsed"
            icon="fa-solid fa-angle-up"
            aria-hidden="true"
          />
          <font-awesome-icon v-else icon="fa-solid fa-angle-down" aria-hidden="true" />
        </div>
        <div v-if="!nodelist_collapsed">
          <NodeListItem
            v-for="node in nodes"
            :key="node.node_class + node.module"
            :node="node"
          ></NodeListItem>
        </div>
      </div>
    </div>
  </div>
</template>
