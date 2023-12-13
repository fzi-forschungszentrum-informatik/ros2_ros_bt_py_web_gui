<script setup lang="ts">
import { useEditorStore } from '@/stores/editor'
import { useROSStore } from '@/stores/ros'
import type { WireNodeDataRequest, WireNodeDataResponse } from '@/types/services/WireNodeData'
import type { NodeDataWiring } from '@/types/types'
import { notify } from '@kyvg/vue3-notification'

const ros_store = useROSStore()
const editor_store = useEditorStore()

const props = defineProps<{
  edge: NodeDataWiring
}>()

function onClickDelete() {
  editor_store.unselectEdge()
  ros_store.unwire_data_service.callService(
    {
      wirings: [
        {
          source: props.edge.source,
          target: props.edge.target
        }
      ]
    } as WireNodeDataRequest,
    (response: WireNodeDataResponse) => {
      if (response.success) {
        notify({
          title: 'Removed data edge: ' + props.edge.source + ' -> ' + props.edge.target + '!',
          type: 'success'
        })
      } else {
        notify({
          title:
            'Failed to remove data edge: ' + props.edge.source + ' -> ' + props.edge.target + '!',
          text: response.error_message,
          type: 'error'
        })
      }
    }
  )
}
function selectSourceNode() {
  editor_store.editorSelectionChange(props.edge.source.node_name)
}

function selectTargetNode() {
  editor_store.editorSelectionChange(props.edge.target.node_name)
}
</script>

<template>
  <div class="d-flex flex-column">
    <div class="btn-group d-flex mb-2" role="group">
      <button
        class="btn btn-danger w-100"
        @click="
          {
            onClickDelete()
          }
        "
      >
        Delete Edge
      </button>
    </div>
    <div class="row">
      <div class="col">
        <a
          href="#"
          class="text-primary"
          @click="
            {
              selectSourceNode()
            }
          "
        >
          {{ props.edge.source.node_name }}
        </a>
        <span>{{ props.edge.source.data_kind }}.</span>
        <span>{{ props.edge.source.data_key }}</span>
      </div>
      <div class="col">
        <span aria-hidden="true" class="fas fa-lg fa-long-arrow-alt-right" />
        <span class="sr-only">is connected to</span>
      </div>
      <div class="col">
        <a
          href="#"
          class="text-primary"
          @click="
            {
              selectTargetNode()
            }
          "
        >
          {{ props.edge.target.node_name }}
        </a>
        <span>{{ props.edge.target.data_kind }}</span>
        <span>{{ props.edge.target.data_key }}</span>
      </div>
    </div>
  </div>
</template>
