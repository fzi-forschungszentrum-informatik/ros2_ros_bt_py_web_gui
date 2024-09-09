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
import { useROSStore } from '@/stores/ros'
import type { ClearTreeRequest, ClearTreeResponse } from '@/types/services/ClearTree'
import { notify } from '@kyvg/vue3-notification'
import { ref } from 'vue'
import { useModal } from 'vue-final-modal'
import SaveFileModal from './modals/SaveFileModal.vue'
import LoadFileModal from './modals/LoadFileModal.vue'
import { useEditorStore } from '@/stores/editor'
import {
  TreeExecutionCommands,
  type ControlTreeExecutionRequest,
  type ControlTreeExecutionResponse
} from '@/types/services/ControlTreeExecution'
import jsyaml from 'js-yaml'
import type { LoadTreeRequest, LoadTreeResponse } from '@/types/services/LoadTree'
import type { TreeMsg } from '@/types/types'
import type { FixYamlRequest, FixYamlResponse } from '@/types/services/FixYaml'

const ros_store = useROSStore()
const editor_store = useEditorStore()

const file_input_ref = ref<HTMLInputElement>()

const file_reader = new FileReader()

const loadPackageModalHandle = useModal({
  component: LoadFileModal,
  attrs: {
    fromPackages: true,
    onClose() {
      loadPackageModalHandle.close()
    },
  },
})

const loadFileModalHandle = useModal({
  component: LoadFileModal,
  attrs: {
    fromPackages: false,
    onClose() {
      loadFileModalHandle.close()
    },
  },
})

const saveFileModalHandle = useModal({
  component: SaveFileModal,
  attrs: {
    onClose() {
      saveFileModalHandle.close()
    }
  },
})

function newTree() {
  if (ros_store.clear_tree_service === undefined) {
    notify({
      title: 'Service not available!',
      text: 'ClearTree ROS service not available.',
      type: 'error'
    })
    return
  }
  if (
    window.confirm(
      'Do you want to create a new tree? Warning: This will discard the tree that is loaded at the moment.'
    )
  ) {
    ros_store.clear_tree_service.callService(
      {} as ClearTreeRequest,
      (response: ClearTreeResponse) => {
        if (response.success) {
          console.log('called ClearTree service successfully')
          notify({
            title: 'Created new tree successfully!',
            type: 'success'
          })
        } else {
          notify({
            title: 'Could not create new tree!',
            type: 'warn',
            text: response.error_message
          })
        }
      },
      (failed) => {
        notify({
          title: 'ClearTree service call failed!',
          type: 'error',
          text: failed
        })
      }
    )
  }
}

function loadFromPackage() {
  loadPackageModalHandle.open()
}

function loadFromFile() {
  loadFileModalHandle.open()
}

function saveToFile() {
  if (ros_store.control_tree_execution_service === undefined) {
    notify({
      title: 'Service not available!',
      text: 'ControlTreeExecution ROS service is not connected.',
      type: 'error'
    })
    return
  }
  editor_store.runNewCommand(TreeExecutionCommands.SHUTDOWN)
  ros_store.control_tree_execution_service.callService(
    {
      command: TreeExecutionCommands.SHUTDOWN
    } as ControlTreeExecutionRequest,
    (response: ControlTreeExecutionResponse) => {
      editor_store.removeRunningCommand(TreeExecutionCommands.SHUTDOWN)
      if (response.success) {
        notify({
          title: 'Tree shutdown successful!',
          type: 'success'
        })
        saveFileModalHandle.open()
      } else {
        notify({
          title: 'Failed to shutdown tree, cannot save now!',
          text: response.error_message,
          type: 'warn'
        })
      }
    },
    (failed) => {
      notify({
        title: 'Calling ControlTreeExecution ROS service failed!',
        text: failed,
        type: 'error'
      })
    }
  )
}

function downloadURI(uri: string, name: string) {
  const link = document.createElement('a')
  link.download = name
  link.href = uri
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function loadTree(event: Event) {
  const target = event.target as HTMLInputElement

  file_reader.onloadend = handleFileRead
  if (target.files === null) {
    notify({
      title: 'File selection is null!',
      type: 'error'
    })
    return
  }
  file_reader.readAsText(target.files[0])
}

function openFileDialog() {
  if (file_input_ref.value === undefined) {
    console.error('Fileref is undefined!')
    return
  }
  file_input_ref.value.click()
}

function loadTreeMsg(msg: TreeMsg) {
  // do a version check before loading
  if (ros_store.load_tree_service === undefined) {
    notify({
      title: 'Service is unavailable!',
      text: 'LoadTree service is not connected!',
      type: 'error'
    })
    return
  }
  ros_store.load_tree_service.callService(
    {
      tree: msg,
      permissive: false
    } as LoadTreeRequest,
    (response: LoadTreeResponse) => {
      if (response.success) {
        notify({
          title: 'Loaded tree successfully!',
          type: 'success'
        })
      } else {
        if (
          response.error_message.startsWith(
            'Expected data to be of type type, got dict instead. Looks like failed jsonpickle decode,'
          ) ||
          response.error_message.startsWith(
            'AttributeError, maybe a ROS Message definition changed.'
          )
        ) {
          notify({
            title: 'Loaded tree has invalid input/output/option typings!',
            type: 'warn'
          })
          if (
            window.confirm(
              'The tree you want to load seems to have nodes with invalid options, do you want to load it in permissive mode? WARNING: this will probably change some option values!'
            )
          ) {
            if (ros_store.load_tree_service === undefined) {
              notify({
                title: 'Service is unavailable!',
                text: 'LoadTree service is not connected!',
                type: 'error'
              })
              return
            }
            ros_store.load_tree_service.callService(
              {
                tree: msg,
                permissive: true
              } as LoadTreeRequest,
              (response: LoadTreeResponse) => {
                if (response.success) {
                  notify({
                    title: 'Loaded tree successfully!',
                    type: 'success'
                  })
                } else {
                  notify({
                    title: 'Failed to load tree!',
                    text: response.error_message,
                    type: 'warn'
                  })
                }
              },
              (failed) => {
                notify({
                  title: 'Failed to call load tree service!',
                  text: failed,
                  type: 'error'
                })
              }
            )
          }
        }
        notify({
          title: 'Failed to load tree!',
          text: response.error_message,
          type: 'error'
        })
      }
    },
    (failed) => {
      notify({
        title: 'Failed to call load tree service!',
        text: failed,
        type: 'error'
      })
    }
  )
}

function handleFileRead() {
  let msgs: TreeMsg[] = []
  try {
    if (file_reader.result === null) {
      notify({
        title: 'Content of selected reads as null!',
        type: 'error'
      })
      return
    }
    const file_text: string = file_reader.result as string
    msgs = jsyaml.loadAll(file_text) as TreeMsg[]
    let msg: TreeMsg | null = null
    for (let i = 0; i < msgs.length; i++) {
      if (msgs[i] != null) {
        msg = msgs[i]
      }
    }

    loadTreeMsg(msg!)
  } catch (e) {
    if (ros_store.fix_yaml_service === undefined) {
      notify({
        title: 'Service is unavailable!',
        text: 'FixYaml service is not connected!',
        type: 'error'
      })
      return
    }
    // try fixing the YAML error
    ros_store.fix_yaml_service.callService(
      {
        broken_yaml: file_reader.result
      } as FixYamlRequest,
      (response: FixYamlResponse) => {
        if (response.success) {
          msgs = jsyaml.loadAll(response.fixed_yaml) as TreeMsg[]
          let msg = null
          for (let i = 0; i < msgs.length; i++) {
            if (msgs[i] != null) {
              msg = msgs[i]
            }
          }
          loadTreeMsg(msg!)
        }
      },
      (failed: string) => {
        notify({
          title: 'Failed to call FixYaml service!',
          text: failed,
          type: 'error'
        })
      }
    )
  }
}

function saveTree() {
  if (!ros_store.connected) {
    notify({
      title: 'Service not available!',
      text: 'ControlTreeExecution ROS service is not connected.',
      type: 'error'
    })
    return
  }
  editor_store.runNewCommand(TreeExecutionCommands.SHUTDOWN)
  ros_store.control_tree_execution_service.callService(
    {
      command: TreeExecutionCommands.SHUTDOWN
    } as ControlTreeExecutionRequest,
    (response: ControlTreeExecutionResponse) => {
      if (response.success) {
        notify({
          title: 'Tree shutdown successful!',
          type: 'success'
        })
        const tree = editor_store.tree
        if (tree === undefined) {
          notify({
            title: 'Tree is undefined, cannot save!',
            type: 'error'
          })
          return
        }

        for (const node in tree.nodes) {
          for (const node_input in tree.nodes[node].inputs) {
            tree.nodes[node].inputs[node_input].serialized_value = 'null'
          }
          for (const node_output in tree.nodes[node].outputs) {
            tree.nodes[node].outputs[node_output].serialized_value = 'null'
          }
        }
        const msg = jsyaml.dump(tree)

        downloadURI('data:text/plain,' + encodeURIComponent(msg), 'tree.yaml')
      } else {
        notify({
          title: 'Failed to shutdown tree, cannot save now!',
          text: response.error_message,
          type: 'error'
        })
      }
    },
    (failed) => {
      notify({
        title: 'Calling ControlTreeExecution ROS service failed!',
        text: failed,
        type: 'error'
      })
    }
  )
}
</script>

<template>
  <button @click="() => newTree()" class="btn btn-primary ms-1" title="New tree">
    <font-awesome-icon icon="fa-solid fa-file" aria-hidden="true" class="show-button-icon" />
    <span class="ms-1 hide-button-text">New</span>
  </button>
  <div class="btn-group" role="group">
    <button
      id="btnGroupDrop1"
      type="button"
      class="btn btn-primary dropdown-toggle ms-1"
      data-bs-toggle="dropdown"
      aria-expanded="false"
    >
      <font-awesome-icon icon="fa-solid fa-folder" aria-hidden="true" class="show-button-icon" />
      <span class="ms-1 hide-button-text">Load</span>
    </button>
    <ul class="dropdown-menu" aria-labelledby="btnGroupDrop1">
      <li>
        <button
          @click="() => loadFromPackage()"
          class="dropdown-item btn btn-primary"
          title="Load from package"
        >
          <font-awesome-icon
            icon="fa-solid fa-folder-tree"
            aria-hidden="true"
            class="show-button-icon"
          />
          <span class="ms-1">Package</span>
        </button>
      </li>
      <li>
        <button
          @click="() => loadFromFile()"
          class="dropdown-item btn btn-primary"
          title="Load from file"
        >
          <font-awesome-icon
            icon="fa-solid fa-folder-open"
            aria-hidden="true"
            class="show-button-icon"
          />
          <span className="ms-1">File</span>
        </button>
      </li>
    </ul>
  </div>
  <button @click="() => saveToFile()" class="btn btn-primary ms-1" title="Save to remote">
    <font-awesome-icon icon="fa-solid fa-save" aria-hidden="true" class="show-button-icon" />
    <span class="ms-1 hide-button-text">Save</span>
  </button>
  <div>
    <input ref="file_input_ref" type="file" class="file_input_ref" @change="loadTree" />
    <button @click="() => openFileDialog()" class="btn btn-primary ms-1" title="Upload">
      <font-awesome-icon
        icon="fa-solid fa-file-upload"
        aria-hidden="true"
        class="show-button-icon"
      />
      <span class="ms-1 hide-button-text">Upload</span>
    </button>
  </div>
  <button @click="() => saveTree()" class="btn btn-primary m-1" title="Download">
    <font-awesome-icon
      icon="fa-solid fa-file-download"
      aria-hidden="true"
      class="show-button-icon"
    />
    <span class="ms-1 hide-button-text">Download</span>
  </button>
</template>

<style lang="scss">
@import 'src/assets/utils.scss';

.file_input_ref {
  display: none;
}
</style>
