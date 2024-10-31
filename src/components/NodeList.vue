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
import { useNodesStore } from '@/stores/nodes'
import type { DocumentedNode } from '@/types/types'
import { computed, ref } from 'vue'
import NodeListItem from './NodeListItem.vue'

const nodelist_collapsed = ref<boolean>(false)

const nodes_store = useNodesStore()

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
  if (nodes_store.filtered_nodes.length > 0) {
    return nodes_store.filtered_nodes
  } else {
    let nodes = [...nodes_store.nodes].sort(byName)
    nodes = nodes.sort(moduleThenName)
    return nodes
  }
})


</script>
<template>
  <!--TODO clean up unused css classes, redo with bootstrap utilities-->
  <div class="available-nodes border rounded m-1 d-flex flex-column">
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
    <div v-if="!nodelist_collapsed" class="scroll-col flex-shrink-1">
      <NodeListItem
        v-for="node in nodes"
        :key="node.node_class + node.module"
        :node="node"
      ></NodeListItem>
    </div>
  </div>
</template>

<style lang="scss">

.scroll-col {
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;

  @supports (scrollbar-width: thin) and (scrollbar-gutter: stable) {
    padding-right: 5px;
    margin-right: -14px;
    scrollbar-width: thin;
    scrollbar-gutter: stable;
  }

}

</style>
