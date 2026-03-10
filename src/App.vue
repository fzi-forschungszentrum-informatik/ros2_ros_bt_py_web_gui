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
import { ModalsContainer } from 'vue-final-modal'
import { useROSStore } from './stores/ros'
import { useMessasgeStore } from './stores/message'
import { usePackageStore } from './stores/package'
import { useLogsStore } from './stores/logs'
import { useNodesStore } from './stores/nodes'
import { onMounted, ref, watch } from 'vue'
import PackageLoader from './components/PackageLoader.vue'
import type {
  MessageTypes,
  Packages,
  TreeDataList,
  TreeStateList,
  TreeStructureList
} from './types/types'
import { useEditorStore } from './stores/editor'
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
import LoadSaveClient from './components/LoadSaveClient.vue'
import LoadSaveServer from './components/LoadSaveServer.vue'
import NamespaceSelect from './components/NamespaceSelect.vue'
import TickControls from './components/TickControls.vue'
import NodeQuickSelect from './components/NodeQuickSelect.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import ConnectionStatus from './components/ConnectionStatus.vue'
import LogsDisplay from './components/LogsDisplay.vue'

const ros_store = useROSStore()
const messages_store = useMessasgeStore()
const packages_store = usePackageStore()
const logs_store = useLogsStore()
const nodes_store = useNodesStore()
const editor_store = useEditorStore()
const edit_node_store = useEditNodeStore()

const dark_mode = ref<boolean>(false)
// Bootstrap docs say to apply their theme specifier to the root element,
// hence the plain js solution instead of a cleaner vue approach
watch(dark_mode, (dark_mode) => {
  if (dark_mode) {
    document.documentElement.setAttribute('data-bs-theme', 'dark')
  } else {
    document.documentElement.removeAttribute('data-bs-theme')
  }
})

function onNewPackagesMsg(msg: Packages) {
  if (!packages_store.packages_available) {
    packages_store.arePackagesAvailable(true)
  }
  packages_store.updateAvailablePackages(msg.packages)
}

function updatePackagesSubscription() {
  ros_store.packages_sub.subscribe(onNewPackagesMsg)
}

function onNewMessagesMsg(msg: MessageTypes) {
  if (!messages_store.messages_available) {
    messages_store.areMessagesAvailable(true)
  }
  messages_store.updateAvailableMessages(msg)
}

function updateMessagesSubscription() {
  ros_store.messages_sub.subscribe(onNewMessagesMsg)
}

function onNewTreeStructure(msg: TreeStructureList) {
  editor_store.tree_structure_list = msg.tree_structures
}

function onNewTreeState(msg: TreeStateList) {
  editor_store.tree_state_list = msg.tree_states
}

function onNewTreeData(msg: TreeDataList) {
  editor_store.tree_data_list = msg.tree_data
}

function updateTreeSubscription() {
  ros_store.tree_structure_sub.subscribe(onNewTreeStructure)
  ros_store.tree_state_sub.subscribe(onNewTreeState)
  ros_store.tree_data_sub.subscribe(onNewTreeData)
}

function updateChannelsSubscription() {
  ros_store.channels_sub.subscribe(messages_store.updateMessageChannels)
}

function updateLogSubscription() {
  ros_store.log_msgs_sub.subscribe(logs_store.storeLogMessage)
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

const nodelist_visible = ref<boolean>(true)
const node_search = ref<string>('')

const execution_bar_visible = ref<boolean>(true)

const filter_logs = ref<boolean>(false)

watch(
  () => ros_store.connected,
  (connected) => {
    if (connected) {
      console.log('Update subscriptions')
      updateTreeSubscription()
      updateMessagesSubscription()
      updateChannelsSubscription()
      updatePackagesSubscription()
      updateLogSubscription()
    }
  }
)

onMounted(() => {
  ros_store.connect()
})
</script>

<template>
  <div id="settings" class="offcanvas offcanvas-start" tabindex="-1">
    <div class="offcanvas-header">
      <h5 class="offcanvas-title">Settings</h5>
      <button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
    </div>
    <div class="offcanvas-body">
      <SettingsPanel />
      <br />
      <NamespaceSelect />
    </div>
  </div>

  <div id="logging" class="offcanvas offcanvas-start" tabindex="-1">
    <div class="offcanvas-header">
      <h5 class="offcanvas-title">Logging</h5>
      <button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
    </div>
    <div class="offcanvas-body">
      <div class="form-check form-switch mb-3">
        <input v-model="filter_logs" type="checkbox" class="form-check-input" />
        <label class="form-check-label ms-2"> Filter for Current Tree </label>
      </div>
      <LogsDisplay
        :tree_id="filter_logs ? editor_store.selected_tree : undefined"
        style="max-height: 80vh"
      />
    </div>
  </div>

  <header
    v-if="execution_bar_visible"
    class="d-flex justify-content-between align-items-center w-100 p-2 top-bar"
  >
    <div class="d-flex align-items-center">
      <ConnectionStatus />
      <div class="btn-group" role="group">
        <button
          class="btn btn-outline-contrast"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#settings"
        >
          <FontAwesomeIcon icon="fa-solid fa-cog" />
        </button>

        <button
          class="btn btn-outline-contrast"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#logging"
        >
          <FontAwesomeIcon icon="fa-solid fa-align-justify" />
        </button>
      </div>
    </div>

    <TickControls />

    <div class="btn-group">
      <LoadSaveServer />
      <LoadSaveClient />
    </div>
  </header>

  <main>
    <div
      :class="editor_store.is_dragging ? 'cursor-grabbing' : ''"
      class="container-fluid"
      @mouseup="() => editor_store.stopDragging()"
      @mouseleave="() => editor_store.stopDragging()"
    >
      <div class="row" :class="execution_bar_visible ? 'row-height' : 'vh-100'">
        <div v-if="nodelist_visible" id="nodelist_container" class="col-3 d-flex flex-column h-100">
          <div class="d-flex justify-content-between m-1 mt-2">
            <button
              class="btn btn-outline-primary"
              title="Hide nodelist"
              @click="
                () => {
                  nodelist_visible = !nodelist_visible
                }
              "
            >
              <FontAwesomeIcon
                icon="fa-solid fa-angle-double-left"
                aria-hidden="true"
                class="show-button-icon"
              />
            </button>

            <button
              class="btn btn-outline-primary"
              title="Change window appearance"
              @click="dark_mode = !dark_mode"
            >
              <FontAwesomeIcon
                :class="dark_mode ? '' : 'text-secondary'"
                icon="fa-regular fa-moon"
              />
              <FontAwesomeIcon
                :class="!dark_mode ? '' : 'text-secondary'"
                icon="fa-regular fa-sun"
              />
            </button>
          </div>

          <div class="m-1">
            <PackageLoader />
            <NodeQuickSelect />
            <div class="border rounded">
              <div class="input-group p-2">
                <label for="nodelist_search" class="input-group-text"> Search: </label>
                <input
                  id="nodelist_search"
                  ref="nodelist_input_ref"
                  type="text"
                  class="form-control"
                  :value="node_search"
                  placeholder="Node Name"
                  @input="handleNodeSearch"
                  @keydown="handleNodeSearchClear"
                />
              </div>
            </div>
          </div>
          <NodeList style="min-height: 0" />
        </div>
        <div
          id="main_pane"
          class="d-flex flex-column"
          :class="nodelist_visible ? 'col-9' : 'col-12'"
        >
          <div class="row justify-content-between bg-secondary">
            <!-- Show nodelist button -->
            <button
              v-if="!nodelist_visible"
              class="btn btn-outline-light m-2 col-auto order-first"
              title="Show nodelist"
              @click="
                () => {
                  nodelist_visible = !nodelist_visible
                }
              "
            >
              <FontAwesomeIcon
                icon="fa-solid fa-angle-double-right"
                aria-hidden="true"
                class="show-button-icon"
              />
            </button>

            <!--Elements are dynamically reordered when inlining all three-->
            <div class="col col-xxl-auto order-xxl-1">
              <SelectSubtree />
            </div>

            <div class="col-auto order-xxl-3">
              <EditorDisplayButtons
                :exec-bar-visible="execution_bar_visible"
                @show="
                  () => {
                    execution_bar_visible = true
                    nodelist_visible = true
                  }
                "
                @hide="
                  () => {
                    execution_bar_visible = false
                    nodelist_visible = false
                  }
                "
              />
            </div>

            <div class="col-12 col-xxl order-xxl-2">
              <TreeNameStateDisplay />
            </div>
          </div>

          <div class="row edit_canvas flex-grow-1 pb-2">
            <D3BehaviorTreeEditor />
          </div>
          <div class="row">
            <div class="col-6">
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
            <div class="col-6">
              <!-- BT Edge selection-->
              <BehaviorTreeEdge v-if="editor_store.selected_edge !== undefined" />
              <div v-else class="d-flex flex-column">No Edge Selected</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <notifications position="bottom right" :pause-on-hover="true" />
    <ModalsContainer />
  </main>
</template>

<style lang="scss">
@use '@/assets/utils.scss';

.cursor-pointer {
  cursor: pointer;
}

.cursor-grabbing {
  cursor: grabbing;
}

.json {
  white-space: pre;
}

.row-height {
  /* subtract the height of the top-bar from 100vh*/
  height: calc(100vh - 50px);
}

.top-bar {
  height: 50px;
  width: 100%;
  background-color: #bebebe;
}

[data-bs-theme='dark'] .top-bar {
  background-color: #4b4b4b;
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
