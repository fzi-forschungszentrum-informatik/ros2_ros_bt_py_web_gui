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
import { ModalsContainer } from 'vue-final-modal'
import { useROSStore } from './stores/ros'
import { useMessasgeStore } from './stores/message'
import { usePackageStore } from './stores/package'
import { useNodesStore } from './stores/nodes'
import { computed, onMounted, ref } from 'vue'
import PackageLoader from './components/PackageLoader.vue'
import type { Messages, NodeMsg, Packages, SubtreeInfo, TreeMsg } from './types/types'
import { EditorSkin, useEditorStore } from './stores/editor'
import { useEditNodeStore } from './stores/edit_node'
import NodeList from './components/NodeList.vue'
import SelectSubtree from './components/SelectSubtree.vue'
import D3BehaviorTreeEditor from './components/D3BehaviorTreeEditor.vue'
import BehaviorTreeEdge from './components/BehaviorTreeEdge.vue'
import MultipleSelection from './components/MultipleSelection.vue'
import NewNode from './components/NewNode.vue'
import SelectedNode from './components/SelectedNode.vue'
import TreeNameStateDisplay from './components/TreeNameStateDisplay.vue'
import EditorDisplayButtons from './components/EditorDisplayButtons.vue'
import LoadSaveControls from './components/LoadSaveControls.vue'
import NamespaceSelect from './components/NamespaceSelect.vue'
import TickControls from './components/TickControls.vue'



const ros_store = useROSStore()
const messages_store = useMessasgeStore()
const packages_store = usePackageStore()
const nodes_store = useNodesStore()
const editor_store = useEditorStore()
const edit_node_store = useEditNodeStore()

function onNewPackagesMsg(msg: Packages) {
  if (!packages_store.packages_available) {
    packages_store.arePackagesAvailable(true)
  }
  packages_store.updateAvailablePackages(msg.packages)
}

function updatePackagesSubscription() {
  ros_store.packages_sub.subscribe(onNewPackagesMsg)
}

function onNewMessagesMsg(msg: Messages) {
  if (!messages_store.messages_available) {
    messages_store.areMessagesAvailable(true)
  }
  messages_store.updateAvailableMessages(msg.messages)
}

function updateMessagesSubscription() {
  ros_store.messages_sub.subscribe(onNewMessagesMsg)
}

function onNewTreeMsg(msg: TreeMsg) {
  editor_store.tree = msg
}

function updateTreeSubscription() {
  ros_store.tree_sub.subscribe(onNewTreeMsg)
}

function onNewSubtreeInfoMsg(msg: SubtreeInfo) {
  editor_store.subtree_states = msg.subtree_states
}

function updateSubtreeInfoSubscription() {
  ros_store.subtree_info_sub.subscribe(onNewSubtreeInfoMsg)
}

function handleNodeSearch(event: Event) {
  const target = event.target as HTMLInputElement
  node_search.value = target.value
  nodes_store.filterNodes(target.value)
}

function handleNodeSearchClear(event: KeyboardEvent) {
  if (event.key == 'Escape') {
    node_search.value = ''
    nodes_store.clearFilteredNodes()
  }
}

function findPossibleParents() {
  if (editor_store.tree) {
    return editor_store.tree.nodes
      .filter(
        (node: NodeMsg) => node.max_children < 0 || node.child_names.length < node.max_children
      )
      .sort(function (a: NodeMsg, b: NodeMsg) {
        if (a.name < b.name) {
          return -1
        } else if (a.name > b.name) {
          return 1
        } else {
          return 0
        }
      })
  }
  return []
}

const nodelist_visible = ref<boolean>(true)
const nodelist_input_ref = ref<HTMLInputElement>()
const node_search = ref<string>('')

const execution_bar_visible = ref<boolean>(true)

ros_store.$onAction(({ name, after }) => {
  if (name !== 'changeNamespace' && name != 'hasConnected') {
    return
  }

  after(() => {
    updateTreeSubscription()
    updateSubtreeInfoSubscription()
    updateMessagesSubscription()
    updatePackagesSubscription()
  })
})

onMounted(() => {
  ros_store.connect()
  updateTreeSubscription()
  updateSubtreeInfoSubscription()
  updateMessagesSubscription()
  updatePackagesSubscription()
})
</script>

<template>
  <header v-if="execution_bar_visible" 
  class="d-flex justify-content-between align-items-center p-2"
  style="background-color: #bebebe;">
    <NamespaceSelect></NamespaceSelect>

    <TickControls></TickControls>

    <LoadSaveControls></LoadSaveControls>
  </header>

  <main>
    <div :class="editor_store.is_dragging ? 'cursor-grabbing' : ''" class="container-fluid"
    @mouseup="() => editor_store.stopDragging()"
    @mouseleave="() => editor_store.stopDragging()"
    >
      <div class="row row-height">
        <div class="col-3 scroll-col" id="nodelist_container" v-if="nodelist_visible">
          <button
            class="hide_button btn btn-outline-primary btn-sm"
            title="Hide nodelist"
            @click="
              () => {
                nodelist_visible = !nodelist_visible
              }
            "
          >
            <font-awesome-icon
              icon="fa-solid fa-angle-double-left"
              aria-hidden="true"
              class="show-button-icon"
            />
          </button>
          <div class="available-nodes m-1">
            <PackageLoader v-bind:key="ros_store.namespace + 'PackageLoader'" />
            <div class="border rounded">
              <div class="input-group p-2">
                <label for="nodelist_search" class="input-group-text"> Search: </label>
                <input
                  id="nodelist_search"
                  type="text"
                  ref="nodelist_input_ref"
                  class="form-control"
                  v-bind:value="node_search"
                  @input="handleNodeSearch"
                  @keydown="handleNodeSearchClear"
                />
              </div>
            </div>
          </div>
          <NodeList></NodeList>
        </div>
        <div class="col d-flex flex-column" id="main_pane">
          <!-- Show nodelist button -->
          <button
            v-if="!nodelist_visible"
            class="hide_button btn btn-outline-primary btn-sm"
            title="Show nodelist"
            @click="
              () => {
                nodelist_visible = !nodelist_visible
              }
            "
          >
            <font-awesome-icon
              icon="fa-solid fa-angle-double-right"
              aria-hidden="true"
              class="show-button-icon"
            />
          </button>

          <div class="row justify-content-between">
            <!--Elements are dynamically reordered when inlining all three-->
            <SelectSubtree class="col col-xl-3 order-xl-1"></SelectSubtree>

            <EditorDisplayButtons :exec-bar-visible="execution_bar_visible" class="col-auto order-xl-3"
            @show="() => {execution_bar_visible = true; nodelist_visible = true}"
            @hide="() => {execution_bar_visible = false; nodelist_visible = false}"
            ></EditorDisplayButtons>

            <TreeNameStateDisplay class="col-12 col-xl-6 order-xl-2"></TreeNameStateDisplay>
          </div>

          <div class="row edit_canvas flex-grow-1 pb-2">
            <div class="col p-0">
              <D3BehaviorTreeEditor></D3BehaviorTreeEditor>
            </div>
          </div>
          <div class="row maxh50">
            <div class="col pl-0">
              <!--Node Selection list-->
              <MultipleSelection v-if="edit_node_store.last_seletion_source === 'multiple'" />
              <NewNode
                v-else-if="edit_node_store.last_seletion_source === 'nodelist'"
                :key="
                  ros_store.namespace +
                  (edit_node_store.selected_node
                    ? edit_node_store.selected_node.module +
                      edit_node_store.selected_node.node_class
                    : '')
                "
                :node="edit_node_store.selected_node!"
                :parents="findPossibleParents()"
              />
              <SelectedNode
                v-else-if="edit_node_store.last_seletion_source === 'editor'"
                :key="
                  ros_store.namespace +
                  (edit_node_store.selected_node ? edit_node_store.selected_node.name : '')
                "
              />
              <div v-else class="d-flex flex-column">No Node Selected</div>
            </div>
            <div class="col">
              <div className="row pt-0 pl-0 pr-0">
                <!-- BT Edge selection-->
                <BehaviorTreeEdge
                  v-if="editor_store.selected_edge !== undefined"
                ></BehaviorTreeEdge>
                <div v-else class="d-flex flex-column">No Edge Selected</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <notifications position="bottom right" :pauseOnHover=true />
    <ModalsContainer />
  </main>
</template>

<style lang="scss">


.maxw0 {
  max-width: 0;
}

.minw0 {
  min-width: 0;
}

.maxh50 {
  max-height: 50%;
}

.cursor-pointer {
  cursor: pointer;
}

.cursor-grabbing {
  cursor: grabbing;
}



.json {
  white-space: pre;
}



.scroll-col {
  height: 100%;
  overflow-y: scroll;
}

.row-height {
  height: 94vh;
}



.fill-screen {
  height: 100vh;
}

.fill-parent {
  height: 100%;
}

.top-bar {
  height: 6vh;
  width: 100%;
  background: #fedede;
}


.placeholder {
  background: #8e0000;
}



.clear-error {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 10;
}



#nodelist_container {
  border-right: solid;
}

#nodelist_container > .hide_button {
  margin-left: -10px;
  margin-top: 5px;
}

#main_pane > .hide_button {
  position: absolute;
  margin-left: -10px;
  margin-top: 5px;
  z-index: 1;
}



div.jsoneditor,
div.jsoneditor-menu {
  border-color: #4b4b4b;
}

div.jsoneditor-menu {
  background-color: #4b4b4b;
}

.ace-jsoneditor,
textarea.jsoneditor-text {
  min-height: 35px;
}



#loading-icon {
  position: absolute;
  left: 50%;
  top: 50%;
  -webkit-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
  text-align: center;
  font: 100px sans-serif;
}



@keyframes fade {
  0% {
    opacity: 0.1;
  }

  30% {
    opacity: 0.9;
  }

  100% {
    opacity: 0.1;
  }
}

.wave span {
  animation-name: fade;
  animation-duration: 2s;
  animation-iteration-count: infinite;
  animation-fill-mode: both;
}

.wave span:nth-child(2) {
  animation-delay: 0.2s;
}

.wave span:nth-child(3) {
  animation-delay: 0.4s;
}

.wave span:nth-child(4) {
  animation-delay: 0.6s;
}

.wave span:nth-child(5) {
  animation-delay: 0.8s;
}

.wave span:nth-child(6) {
  animation-delay: 1s;
}

.wave span:nth-child(7) {
  animation-delay: 1.2s;
}



.cm_available {
  padding: 0.25rem;
  color: #007bff;
}



.filebrowser-bar:hover {
  background-color: #007bff;
  color: #ffffff;
}


</style>
