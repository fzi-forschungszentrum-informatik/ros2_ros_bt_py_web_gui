<!--
 *  Copyright 2025-2026 FZI Forschungszentrum Informatik
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
import { useEditNodeStore } from '@/stores/edit_node'
import { useEditorStore } from '@/stores/editor'
import { useNodesStore } from '@/stores/nodes'
import type { DocumentedNode } from '@/types/types'
import { computed, ref } from 'vue'
import InlineSvg from 'vue-inline-svg'

import EnumSwitchIcon from '@/assets/flow_control_icons/EnumSwitch.svg'
import FallbackIcon from '@/assets/flow_control_icons/Fallback.svg'
import MemoryFallbackIcon from '@/assets/flow_control_icons/MemoryFallback.svg'
import MemorySequenceIcon from '@/assets/flow_control_icons/MemorySequence.svg'
import ParallelIcon from '@/assets/flow_control_icons/Parallel.svg'
import ParallelFailureTolereanceIcon from '@/assets/flow_control_icons/ParallelFailureTolerance.svg'
import SequenceIcon from '@/assets/flow_control_icons/Sequence.svg'

const nodes_store = useNodesStore()
const editor_store = useEditorStore()
const edit_node_store = useEditNodeStore()

const flow_control_nodes = computed<DocumentedNode[]>(() =>
  nodes_store.nodes.filter((node: DocumentedNode) => node.max_children === -1)
)

const nodelist_collapsed = ref<boolean>(false)

const css_grab = 'grab'
const css_highlight = 'border-primary'
function getNodeCss(node: DocumentedNode): string {
  if (!editor_store.dragging_new_node) {
    return css_grab
  }
  if (
    editor_store.dragging_new_node.node_class === node.node_class &&
    editor_store.dragging_new_node.module === node.module
  ) {
    return css_highlight
  }
  return css_grab
}

// A helper function that returns the correct URL for a given node name.
function getIconSrc(nodeName: string): string {
  switch (nodeName) {
    case 'EnumSwitch':
      return EnumSwitchIcon
    case 'Fallback':
      return FallbackIcon
    case 'MemoryFallback':
      return MemoryFallbackIcon
    case 'MemorySequence':
      return MemorySequenceIcon
    case 'Parallel':
      return ParallelIcon
    case 'ParallelFailureTolerance':
      return ParallelFailureTolereanceIcon
    case 'Sequence':
      return SequenceIcon
    default:
      return ''
  }
}
</script>

<template>
  <div class="border rounded mb-2">
    <div
      class="w-100 text-center cursor-pointer m-2"
      @click="nodelist_collapsed = !nodelist_collapsed"
    >
      Flow Control Nodes
      <FontAwesomeIcon
        :icon="'fa-solid ' + (nodelist_collapsed ? 'fa-angle-down' : 'fa-angle-up')"
        aria-hidden="true"
      />
    </div>
    <div v-if="!nodelist_collapsed" class="d-flex flex-wrap justify-content-center m-1">
      <div
        v-for="node in flow_control_nodes"
        :key="node.node_class + node.module"
        class="border rounded m-1 image-container"
        :class="getNodeCss(node)"
        tabindex="0"
        @click="edit_node_store.nodeListSelectionChange(node)"
        @mousedown.stop.prevent="() => editor_store.startDraggingNewNode(node)"
        @keydown.enter="edit_node_store.nodeListSelectionChange(node)"
      >
        <template v-if="node.node_class === 'NameSwitch'">
          <FontAwesomeIcon :title="node.node_class" class="icon" icon="fa-solid fa-network-wired" />
        </template>
        <template v-else>
          <InlineSvg :title="node.node_class" class="image" :src="getIconSrc(node.node_class)" />
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.grab:hover {
  cursor: grab;
}

.image-container {
  width: 35px;
  height: 30px;
  text-align: center;
}

.icon {
  margin: auto;
  vertical-align: middle;
  height: 20px;
  width: 20px;
}

.image {
  vertical-align: middle;
  height: 25px;
  width: 25px;
  fill: var(--bs-body-color);
  stroke: var(--bs-body-color);
}
</style>
