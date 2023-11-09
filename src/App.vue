<script setup lang="ts">
import ExecutionBar from './components/ExecutionBar.vue'
import { ModalsContainer } from 'vue-final-modal'
import { useROSStore } from './stores/ros'
import { useMessasgeStore } from './stores/message'
import { usePackageStore } from './stores/package'
import { computed, onMounted, ref } from 'vue'
import PackageLoader from './components/PackageLoader.vue'
import type { Messages, NodeMsg, Packages } from './types/types'
import { useEditorStore } from './stores/editor'
import NodeList from './components/NodeList.vue'
import SelectSubtree from './components/SelectSubtree.vue'
import RightAlignSpacer from './components/RightAlignSpacer.vue'
import SelectEditorSkin from './components/SelectEditorSkin.vue'
import D3BehaviorTreeEditor from './components/D3BehaviorTreeEditor.vue'
import BehaviorTreeEdge from './components/BehaviorTreeEdge.vue'
import MultipleSelection from './components/MultipleSelection.vue'
import NewNode from './components/NewNode.vue'
import SelectedNode from './components/SelectedNode.vue'

const ros_store = useROSStore()
const messages_store = useMessasgeStore()
const packages_store = usePackageStore()
const editor_store = useEditorStore()

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

function handleNodeSearch(event: Event) {
  const target = event.target as HTMLInputElement
  node_search.value = target.value
  editor_store.filterNodes(target.value)
}

function handleNodeSearchClear(event: KeyboardEvent) {
  if (event.key == 'Escape') {
    node_search.value = ''
    editor_store.clearFilteredNodes()
  }
}

function findPossibleParents() {
  if (editor_store.selected_subtree.tree) {
    return editor_store.selected_subtree.tree.nodes
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

const tree_name = computed<string>(() => {
  if (editor_store.tree) {
    return editor_store.tree.name
  } else {
    return ''
  }
})

const tree_state = computed<string>(() => {
  if (editor_store.tree) {
    return editor_store.tree.state
  } else {
    return 'UNKNOWN'
  }
})

ros_store.$onAction(({ name, after }) => {
  if (name !== 'changeNamespace' && name != 'hasConnected') {
    return
  }

  after(() => {
    updateMessagesSubscription()
    updatePackagesSubscription()
  })
})

onMounted(() => {
  ros_store.connect()
  updateMessagesSubscription()
  updatePackagesSubscription()
})
</script>

<template>
  <header>
    <ExecutionBar v-if="execution_bar_visible"></ExecutionBar>
  </header>

  <main>
    <div :class="editor_store.dragging_node ? 'cursor-grabbing' : ''">
      <div class="container-fluid">
        <div class="row row-height">
          <div class="col scroll-col" id="nodelist_container" v-if="nodelist_visible">
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
                    @change="handleNodeSearch"
                    @keydown="handleNodeSearchClear"
                  />
                </div>
              </div>
            </div>
            <NodeList></NodeList>
          </div>
          <div :class="nodelist_visible ? 'col-9 scroll-col' : 'col scroll-col'" id="main_pane">
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
            <!-- Subtree selection -->
            <div class="container-fluid d-flex h-100 flex-column">
              <div class="row">
                <div class="col d-flex align-items-center">
                  <SelectSubtree></SelectSubtree>
                  <button
                    class="btn btn-primary m-1"
                    @click="editor_store.enableShowDataGraph(!editor_store.show_data_graph)"
                  >
                    Toggle Data Graph
                  </button>
                  <button
                    v-if="execution_bar_visible"
                    class="btn btn-primary m-1"
                    @click="
                      () => {
                        execution_bar_visible = false
                        nodelist_visible = false
                      }
                    "
                  >
                    Hide User Interface
                  </button>
                  <button
                    v-else
                    class="btn btn-primary m-1"
                    @click="
                      () => {
                        execution_bar_visible = true
                        nodelist_visible = true
                      }
                    "
                  >
                    Show User Interface
                  </button>
                  <div class="d-flex flex-row align-items-center">
                    <label class="form-label m-1 ml-2" for="treeNameForm"> Name: </label>
                    <input
                      id="treeNameForm"
                      class="form-control ml-1"
                      type="text"
                      disabled="true"
                      :value="tree_name"
                    />
                  </div>
                  <div class="d-flex flex-row align-items-center">
                    <label class="form-label m-1 ml-2" for="treeStateForm"> State: </label>
                    <input
                      id="treeStateForm"
                      class="form-control ml-1"
                      type="text"
                      disabled="true"
                      :value="tree_state"
                    />
                  </div>
                  <RightAlignSpacer></RightAlignSpacer>
                  <SelectEditorSkin></SelectEditorSkin>
                </div>
                <div class="row edit_canvas h-100 pb-2">
                  <div class="col p-0">
                    <D3BehaviorTreeEditor></D3BehaviorTreeEditor>
                  </div>
                </div>
                <div class="row maxh50">
                  <div class="col pl-0">
                    <!--Node Selection list-->
                    <MultipleSelection v-if="editor_store.last_seletion_source === 'multiple'" />
                    <NewNode
                      v-else-if="editor_store.last_seletion_source === 'nodelist'"
                      :key="
                        ros_store.namespace +
                        (editor_store.selected_node
                          ? editor_store.selected_node.module +
                            editor_store.selected_node.node_class
                          : '')
                      "
                      :node="editor_store.selected_node!"
                      :parents="findPossibleParents()"
                    />
                    <SelectedNode
                      v-else-if="editor_store.last_seletion_source === 'editor'"
                      :key="
                        ros_store.namespace +
                        (editor_store.selected_node ? editor_store.selected_node.name : '')
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
        </div>
      </div>
    </div>
    <notifications animation-type="velocity" />
    <ModalsContainer />
  </main>
</template>

<style lang="scss">
.box {
  border: 3px solid;
  margin: 5px;
  padding: 10px;
}

.node {
  cursor: pointer;
}

.node circle {
  fill: #fff;
  stroke: steelblue;
  stroke-width: 1.5px;
}

.node text {
  font: 10px sans-serif;
}

.link {
  fill: none;
  stroke: #1e2226;
  stroke-width: 3.5px;
}

.btnode,
.label {
  font-family: sans-serif;
  display: inline-block;
  background: #2a2d36;
  border: solid;
  border-width: 6px;
  border-color: #4e5666;
  color: #eff0f4;
  fill: #eff0f4;
  /*FIXME: max-width: 200px;*/
  overflow-wrap: break-word;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

.label {
  pointer-events: none;
}

.btnode h5 {
  color: #858e99;
}

.node_list {
  font-family: sans-serif;
  display: inline-block;
  background: #2a2d36;
  border: solid;
  border-width: 6px;
  border-color: #4e5666;
  color: #eff0f4;
}

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

.svg-button:hover {
  fill: #bebebe;
}

.btnode tbody {
  color: #cecfd2;
}

.btnode h3 {
  margin: 4px;
}

.btnode tbody tr {
  background: #313740;
}

.btnode td.key {
  font-weight: bold;
}

.btnode tbody tr:hover {
  background: #3a414c;
}

.btnode td {
  /*
border: solid;
*/
  vertical-align: top;
}

.btnode th {
  text-align: left;
}

.json {
  white-space: pre;
}

.btnode td pre {
  margin: 0;
}

.btnode table {
  margin: 4px;
}

.scroll-col {
  height: 100%;
  overflow-y: scroll;
}

.row-height {
  height: 94vh;
}

.reactive-svg {
  display: block;
  position: relative;
  top: 0;
  left: 0;
  width: 100%;
  /* only required for <img /> */
  height: 100%;
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

.control-bar {
  background: #bebebe;
}

rect.selection {
  stroke: gray;
  stroke-dasharray: 4px;
  stroke-opacity: 0.5;
  fill: transparent;
}

path.data-hover {
  stroke: #148050;
  background: #148050;
}

.data-link,
.drawing-indicator {
  fill: none;
  stroke: #64676f;
  stroke-width: 3px;
}

.data-hover rect {
  stroke: #148050;
  background: #148050;
  fill: #148050;
}

.compatible rect {
  stroke: #14d050;
}

.drawing-indicator {
  pointer-events: none;
}

.darkmode {
  background: #34393c;
}

.lightmode {
  background: #ffffff;
}

.clear-error {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 10;
}

.gripper {
  fill: #74777f;
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

.node-selected {
  background: #27406d;
}

.search-results {
  padding-left: 10px;
}

.search-result:hover {
  background-color: #007bff;
}

.search-result-highlighted {
  background-color: #007bff;
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

.connected {
  padding: 0.25rem;
  color: #0caa19;
}

.disconnected {
  padding: 0.25rem;
  color: #ff0000;
}

.cm_available {
  padding: 0.25rem;
  color: #007bff;
}

.packages-missing {
  padding: 0.25rem;
  color: #ff7300;
}

.messages-missing {
  padding: 0.25rem;
  color: #ffd000;
}

.filebrowser-bar:hover {
  background-color: #007bff;
  color: #ffffff;
}

@media screen and (max-width: 1910px) {
  .hide-button-text {
    display: none;
  }

  .show-button-icon {
    visibility: visible;
  }
}

@media screen and (max-width: 1640px) {
  .hide-button-text-control {
    display: none;
  }

  .show-button-icon {
    visibility: visible;
  }
}

.tag:hover {
  border: 1px solid #007bff !important;
  cursor: pointer;
}

.grab:hover {
  cursor: grab;
}
</style>
