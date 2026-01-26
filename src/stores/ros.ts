/*
 * Copyright 2024-2026 FZI Forschungszentrum Informatik
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *    * Redistributions of source code must retain the above copyright
 *      notice, this list of conditions and the following disclaimer.
 *
 *    * Redistributions in binary form must reproduce the above copyright
 *      notice, this list of conditions and the following disclaimer in the
 *      documentation and/or other materials provided with the distribution.
 *
 *    * Neither the name of the {copyright_holder} nor the names of its
 *      contributors may be used to endorse or promote products derived from
 *      this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */
import { ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { Service, Topic, Ros } from 'roslib'
import type {
  Packages,
  MessageTypes,
  Channels,
  TreeStructureList,
  TreeStateList,
  TreeDataList,
  RosLogMsg
} from '@/types/types'
import type {
  ServicesForTypeRequest,
  ServicesForTypeResponse
} from '@/types/services/ServicesForType'
import type {
  ControlTreeExecutionRequest,
  ControlTreeExecutionResponse
} from '@/types/services/ControlTreeExecution'
import type { LoadTreeRequest, LoadTreeResponse } from '@/types/services/LoadTree'
import type { ClearTreeRequest, ClearTreeResponse } from '@/types/services/ClearTree'
import type { FixYamlRequest, FixYamlResponse } from '@/types/services/FixYaml'
import { useMessasgeStore } from './message'
import { usePackageStore } from './package'
import { notify } from '@kyvg/vue3-notification'
import type {
  GetAvailableNodesRequest,
  GetAvailableNodesResponse
} from '@/types/services/GetAvailableNodes'
import type {
  GetMessageFieldsRequest,
  GetMessageFieldsResponse
} from '@/types/services/GetMessageFields'
import type { MorphNodeRequest, MorphNodeResponse } from '@/types/services/MorphNode'
import type { WireNodeDataRequest, WireNodeDataResponse } from '@/types/services/WireNodeData'
import type { RemoveNodeRequest, RemoveNodeResponse } from '@/types/services/RemoveNode'
import type { SetOptionsRequest, SetOptionsResponse } from '@/types/services/SetOptions'
import type { MoveNodeRequest, MoveNodeResponse } from '@/types/services/MoveNode'
import type { AddNodeAtIndexRequest, AddNodeAtIndexResponse } from '@/types/services/AddNodeAtIndex'
import type { ReplaceNodeRequest, ReplaceNodeResponse } from '@/types/services/ReplaceNode'
import type {
  GenerateSubtreeRequest,
  GenerateSubtreeResponse
} from '@/types/services/GenerateSubtree'
import type { SetBoolRequest, SetBoolResponse } from '@/types/services/SetBool'
import type {
  GetFolderStructureRequest,
  GetFolderStructureResponse
} from '@/types/services/GetFolderStructure'
import type {
  GetStorageFoldersRequest,
  GetStorageFoldersResponse
} from '@/types/services/GetStorageFolders'
import type {
  GetPackageStructureRequest,
  GetPackageStructureResponse
} from '@/types/services/GetPackageStructure'
import type { SaveTreeRequest, SaveTreeResponse } from '@/types/services/SaveTree'
import type {
  LoadTreeFromPathRequest,
  LoadTreeFromPathResponse
} from '@/types/services/LoadTreeFromPath'
import type { ChangeTreeNameRequest, ChangeTreeNameResponse } from '@/types/services/ChangeTreeName'
import { useNodesStore } from './nodes'
import { useEditorStore } from './editor'

export const useROSStore = defineStore(
  'ros',
  () => {
    const messages_store = useMessasgeStore()
    const packages_store = usePackageStore()
    const nodes_store = useNodesStore()
    const editor_store = useEditorStore()
    const ros = shallowRef<Ros>(new Ros({}))
    const connected = ref<boolean>(false)
    const url = ref<string>('ws://' + window.location.hostname + ':9090')
    const namespace = ref<string>('')
    const available_namespaces = ref<string[]>(['/'])

    function connect() {
      console.log('Start connect attempt')
      ros.value.connect(url.value)
    }

    const auto_connect = ref<boolean>(true)
    let connect_timeout: number = 0
    function startConnectTimeout() {
      console.log('Start connect timeout')
      clearTimeout(connect_timeout)
      if (auto_connect.value) {
        connect_timeout = setTimeout(() => {
          console.log('Connect callback')
          if (auto_connect.value) {
            connect()
          }
        }, 1000)
      }
    }

    function toggleAutoConnect() {
      auto_connect.value = !auto_connect.value
      if (auto_connect.value) {
        startConnectTimeout()
      }
    }

    const services_for_type_service = shallowRef<
      Service<ServicesForTypeRequest, ServicesForTypeResponse>
    >(
      new Service({
        ros: ros.value,
        name: '/rosapi/services_for_type',
        serviceType: 'rosapi/ServicesForType'
      })
    )

    const load_tree_service = shallowRef<Service<LoadTreeRequest, LoadTreeResponse>>(
      new Service({
        ros: ros.value,
        name: namespace.value + 'load_tree',
        serviceType: 'ros_bt_py_interfaces/srv/LoadTree'
      })
    )

    const fix_yaml_service = shallowRef<Service<FixYamlRequest, FixYamlResponse>>(
      new Service({
        ros: ros.value,
        name: namespace.value + 'fix_yaml',
        serviceType: 'ros_bt_py_interfaces/srv/FixYaml'
      })
    )

    const control_tree_execution_service = shallowRef<
      Service<ControlTreeExecutionRequest, ControlTreeExecutionResponse>
    >(
      new Service({
        ros: ros.value,
        name: namespace.value + 'control_tree_execution',
        serviceType: 'ros_bt_py_interfaces/srv/ControlTreeExecution'
      })
    )

    const clear_tree_service = shallowRef<Service<ClearTreeRequest, ClearTreeResponse>>(
      new Service({
        ros: ros.value,
        name: namespace.value + 'clear',
        serviceType: 'ros_bt_py_interfaces/srv/ClearTree'
      })
    )

    const set_publish_subtrees_service = shallowRef<Service<SetBoolRequest, SetBoolResponse>>(
      new Service({
        ros: ros.value,
        name: namespace.value + 'debug/set_publish_subtrees',
        serviceType: 'std_srvs/srv/SetBool'
      })
    )

    const set_publish_data_service = shallowRef<Service<SetBoolRequest, SetBoolResponse>>(
      new Service({
        ros: ros.value,
        name: namespace.value + 'debug/set_publish_data',
        serviceType: 'std_srvs/srv/SetBool'
      })
    )

    const tree_structure_sub = shallowRef<Topic<TreeStructureList>>(
      new Topic({
        ros: ros.value,
        name: namespace.value + 'tree_structure_list',
        messageType: 'ros_bt_py_interfaces/msg/TreeStructureList',
        latch: true,
        reconnect_on_close: true
      })
    )

    const tree_state_sub = shallowRef<Topic<TreeStateList>>(
      new Topic({
        ros: ros.value,
        name: namespace.value + 'tree_state_list',
        messageType: 'ros_bt_py_interfaces/msg/TreeStateList',
        latch: true,
        reconnect_on_close: true
      })
    )

    const tree_data_sub = shallowRef<Topic<TreeDataList>>(
      new Topic({
        ros: ros.value,
        name: namespace.value + 'tree_data_list',
        messageType: 'ros_bt_py_interfaces/msg/TreeDataList',
        latch: true,
        reconnect_on_close: true
      })
    )

    const packages_sub = shallowRef<Topic<Packages>>(
      new Topic({
        ros: ros.value,
        name: namespace.value + 'packages',
        messageType: 'ros_bt_py_interfaces/msg/Packages',
        latch: true,
        reconnect_on_close: true
      })
    )

    const messages_sub = shallowRef<Topic<MessageTypes>>(
      new Topic({
        ros: ros.value,
        name: namespace.value + 'message_types',
        messageType: 'ros_bt_py_interfaces/msg/MessageTypes',
        latch: true,
        reconnect_on_close: true
      })
    )

    const channels_sub = shallowRef<Topic<Channels>>(
      new Topic({
        ros: ros.value,
        name: namespace.value + 'message_channels',
        messageType: 'ros_bt_py_interfaces/msg/MessageChannels',
        latch: true,
        reconnect_on_close: true
      })
    )

    const log_msgs_sub = shallowRef<Topic<RosLogMsg>>(
      new Topic({
        ros: ros.value,
        name: namespace.value + 'log_messages',
        messageType: 'ros_bt_py_interfaces/msg/BTLogMessage',
        latch: true,
        reconnect_on_close: true
      })
    )

    const get_available_nodes_service = shallowRef<
      Service<GetAvailableNodesRequest, GetAvailableNodesResponse>
    >(
      new Service({
        ros: ros.value,
        name: namespace.value + 'get_available_nodes',
        serviceType: 'ros_bt_py_interfaces/srv/GetAvailableNodes'
      })
    )

    const get_message_fields_service = shallowRef<
      Service<GetMessageFieldsRequest, GetMessageFieldsResponse>
    >(
      new Service({
        ros: ros.value,
        name: namespace.value + 'get_message_fields',
        serviceType: 'ros_bt_py_interfaces/srv/GetMessageFields'
      })
    )

    const unwire_data_service = shallowRef<Service<WireNodeDataRequest, WireNodeDataResponse>>(
      new Service({
        ros: ros.value,
        name: namespace.value + 'unwire_data',
        serviceType: 'ros_bt_py_interfaces/srv/WireNodeData'
      })
    )

    const remove_node_service = shallowRef<Service<RemoveNodeRequest, RemoveNodeResponse>>(
      new Service({
        ros: ros.value,
        name: namespace.value + 'remove_node',
        serviceType: 'ros_bt_pt_interfaces/srv/RemoveNode'
      })
    )

    const replace_node_service = shallowRef<Service<ReplaceNodeRequest, ReplaceNodeResponse>>(
      new Service({
        ros: ros.value,
        name: namespace.value + 'replace_node',
        serviceType: 'ros_bt_pt_interfaces/srv/ReplaceNode'
      })
    )

    const set_options_service = shallowRef<Service<SetOptionsRequest, SetOptionsResponse>>(
      new Service({
        ros: ros.value,
        name: namespace.value + 'set_options',
        serviceType: 'ros_bt_pt_interfaces/srv/SetOptions'
      })
    )

    const morph_node_service = shallowRef<Service<MorphNodeRequest, MorphNodeResponse>>(
      new Service({
        ros: ros.value,
        name: namespace.value + 'morph_node',
        serviceType: 'ros_bt_pt_interfaces/srv/MorphNode'
      })
    )

    const move_node_service = shallowRef<Service<MoveNodeRequest, MoveNodeResponse>>(
      new Service({
        ros: ros.value,
        name: namespace.value + 'move_node',
        serviceType: 'ros_bt_py_interfaces/srv/MoveNode'
      })
    )

    const add_node_at_index_service = shallowRef<
      Service<AddNodeAtIndexRequest, AddNodeAtIndexResponse>
    >(
      new Service({
        ros: ros.value,
        name: namespace.value + 'add_node_at_index',
        serviceType: 'ros_bt_py_interfaces/srv/AddNodeAtIndex'
      })
    )

    const wire_data_service = shallowRef<Service<WireNodeDataRequest, WireNodeDataResponse>>(
      new Service({
        ros: ros.value,
        name: namespace.value + 'wire_data',
        serviceType: 'ros_bt_py_interfaces/srv/WireNodeData'
      })
    )

    const generate_subtree_service = shallowRef<
      Service<GenerateSubtreeRequest, GenerateSubtreeResponse>
    >(
      new Service({
        ros: ros.value,
        name: namespace.value + 'generate_subtree',
        serviceType: 'ros_bt_py_interfaces/srv/GenerateSubtree'
      })
    )

    const get_storage_folders_service = shallowRef<
      Service<GetStorageFoldersRequest, GetStorageFoldersResponse>
    >(
      new Service({
        ros: ros.value,
        name: namespace.value + 'get_storage_folders',
        serviceType: 'ros_bt_py_interfaces/srv/GetStorageFolders'
      })
    )

    const get_folder_structure_service = shallowRef<
      Service<GetFolderStructureRequest, GetFolderStructureResponse>
    >(
      new Service({
        ros: ros.value,
        name: namespace.value + 'get_folder_structure',
        serviceType: 'ros_bt_py_interfaces/srv/GetFolderStructure'
      })
    )

    const get_package_structure_service = shallowRef<
      Service<GetPackageStructureRequest, GetPackageStructureResponse>
    >(
      new Service({
        ros: ros.value,
        name: namespace.value + 'get_package_structure',
        serviceType: 'ros_bt_py_interfaces/srv/GetPackageStructure'
      })
    )

    const save_tree_service = shallowRef<Service<SaveTreeRequest, SaveTreeResponse>>(
      new Service({
        ros: ros.value,
        name: namespace.value + 'save_tree',
        serviceType: 'ros_bt_py_interfaces/srv/SaveTree'
      })
    )

    const change_tree_name_service = shallowRef<
      Service<ChangeTreeNameRequest, ChangeTreeNameResponse>
    >(
      new Service({
        ros: ros.value,
        name: namespace.value + 'change_tree_name',
        serviceType: 'ros_bt_py_interfaces/srv/ChangeTreeName'
      })
    )

    const load_tree_from_path_service = shallowRef<
      Service<LoadTreeFromPathRequest, LoadTreeFromPathResponse>
    >(
      new Service({
        ros: ros.value,
        name: namespace.value + 'load_tree_from_path',
        serviceType: 'ros_bt_py_interfaces/srv/LoadTreeFromPath'
      })
    )

    ros.value.on('connection', () => {
      hasConnected()
    })

    ros.value.on('close', () => {
      hasDisconnected()
    })

    ros.value.on('error', () => {
      notify({
        title: 'ROS connection error!',
        type: 'error'
      })
    })

    function updateROSServices() {
      tree_structure_sub.value.unsubscribe()
      tree_structure_sub.value.removeAllListeners()
      tree_structure_sub.value = new Topic({
        ros: ros.value,
        name: namespace.value + 'tree_structure_list',
        messageType: 'ros_bt_py_interfaces/msg/TreeStructureList',
        latch: true,
        reconnect_on_close: true
      })

      tree_state_sub.value.unsubscribe()
      tree_state_sub.value.removeAllListeners()
      tree_state_sub.value = new Topic({
        ros: ros.value,
        name: namespace.value + 'tree_state_list',
        messageType: 'ros_bt_py_interfaces/msg/TreeStateList',
        latch: true,
        reconnect_on_close: true
      })

      tree_data_sub.value.unsubscribe()
      tree_data_sub.value.removeAllListeners()
      tree_data_sub.value = new Topic({
        ros: ros.value,
        name: namespace.value + 'tree_data_list',
        messageType: 'ros_bt_py_interfaces/msg/TreeDataList',
        latch: true,
        reconnect_on_close: true
      })

      messages_sub.value.unsubscribe()
      messages_sub.value.removeAllListeners()
      messages_sub.value = new Topic({
        ros: ros.value,
        name: namespace.value + 'message_types',
        messageType: 'ros_bt_py_interfaces/msg/MessageTypes',
        latch: true,
        reconnect_on_close: true
      })

      packages_sub.value.unsubscribe()
      packages_sub.value.removeAllListeners()
      packages_sub.value = new Topic({
        ros: ros.value,
        name: namespace.value + 'packages',
        messageType: 'ros_bt_py_interfaces/msg/Packages',
        latch: true,
        reconnect_on_close: true
      })

      channels_sub.value.unsubscribe()
      channels_sub.value.removeAllListeners()
      channels_sub.value = new Topic({
        ros: ros.value,
        name: namespace.value + 'message_channels',
        messageType: 'ros_bt_py_interfaces/msg/MessageChannels',
        latch: true,
        reconnect_on_close: true
      })

      log_msgs_sub.value.unsubscribe()
      log_msgs_sub.value.removeAllListeners()
      log_msgs_sub.value = new Topic({
        ros: ros.value,
        name: namespace.value + 'log_messages',
        messageType: 'ros_bt_py_interfaces/msg/BTLogMessage',
        latch: true,
        reconnect_on_close: true
      })

      set_publish_subtrees_service.value = new Service({
        ros: ros.value,
        name: namespace.value + 'debug/set_publish_subtrees',
        serviceType: 'std_srvs/srv/SetBool'
      })

      set_publish_data_service.value = new Service({
        ros: ros.value,
        name: namespace.value + 'debug/set_publish_data',
        serviceType: 'std_srvs/srv/SetBool'
      })

      services_for_type_service.value = new Service({
        ros: ros.value,
        name: '/rosapi/services_for_type',
        serviceType: 'rosapi/ServicesForType'
      })

      load_tree_service.value = new Service({
        ros: ros.value,
        name: namespace.value + 'load_tree',
        serviceType: 'ros_bt_py_interfaces/srv/LoadTree'
      })

      fix_yaml_service.value = new Service({
        ros: ros.value,
        name: namespace.value + 'fix_yaml',
        serviceType: 'ros_bt_py_interfaces/srv/FixYaml'
      })

      control_tree_execution_service.value = new Service({
        ros: ros.value,
        name: namespace.value + 'control_tree_execution',
        serviceType: 'ros_bt_py_interfaces/srv/ControlTreeExecution'
      })

      clear_tree_service.value = new Service({
        ros: ros.value,
        name: namespace.value + 'clear',
        serviceType: 'ros_bt_py_interfaces/srv/ClearTree'
      })

      get_available_nodes_service.value = new Service({
        ros: ros.value,
        name: namespace.value + 'get_available_nodes',
        serviceType: 'ros_bt_py_interfaces/srv/GetAvailableNodes'
      })

      get_message_fields_service.value = new Service({
        ros: ros.value,
        name: namespace.value + 'get_message_fields',
        serviceType: 'ros_bt_py_interfaces/srv/GetMessageFields'
      })

      unwire_data_service.value = new Service({
        ros: ros.value,
        name: namespace.value + 'unwire_data',
        serviceType: 'ros_bt_py_interfaces/srv/WireNodeData'
      })

      remove_node_service.value = new Service({
        ros: ros.value,
        name: namespace.value + 'remove_node',
        serviceType: 'ros_bt_py_interfaces/srv/RemoveNode'
      })

      replace_node_service.value = new Service({
        ros: ros.value,
        name: namespace.value + 'replace_node',
        serviceType: 'ros_bt_pt_interfaces/srv/ReplaceNode'
      })

      set_options_service.value = new Service({
        ros: ros.value,
        name: namespace.value + 'set_options',
        serviceType: 'ros_bt_py_interfaces/srv/SetOptions'
      })

      morph_node_service.value = new Service({
        ros: ros.value,
        name: namespace.value + 'morph_node',
        serviceType: 'ros_bt_py_interfaces/srv/MorphNode'
      })

      generate_subtree_service.value = new Service({
        ros: ros.value,
        name: namespace.value + 'generate_subtree',
        serviceType: 'ros_bt_py_interfaces/srv/GenerateSubtree'
      })

      wire_data_service.value = new Service({
        ros: ros.value,
        name: namespace.value + 'wire_data',
        serviceType: 'ros_bt_py_interfaces/srv/WireNodeData'
      })

      add_node_at_index_service.value = new Service({
        ros: ros.value,
        name: namespace.value + 'add_node_at_index',
        serviceType: 'ros_bt_py_interfaces/srv/AddNodeAtIndex'
      })

      move_node_service.value = new Service({
        ros: ros.value,
        name: namespace.value + 'move_node',
        serviceType: 'ros_bt_py_interfaces/srv/MoveNode'
      })

      get_storage_folders_service.value = new Service({
        ros: ros.value,
        name: namespace.value + 'get_storage_folders',
        serviceType: 'ros_bt_py_interfaces/srv/GetStorageFolders'
      })

      get_folder_structure_service.value = new Service({
        ros: ros.value,
        name: namespace.value + 'get_folder_structure',
        serviceType: 'ros_bt_py_interfaces/srv/GetFolderStructure'
      })

      get_package_structure_service.value = new Service({
        ros: ros.value,
        name: namespace.value + 'get_package_structure',
        serviceType: 'ros_bt_py_interfaces/srv/GetPackageStructure'
      })

      save_tree_service.value = new Service({
        ros: ros.value,
        name: namespace.value + 'save_tree',
        serviceType: 'ros_bt_py_interfaces/srv/SaveTree'
      })

      change_tree_name_service.value = new Service({
        ros: ros.value,
        name: namespace.value + 'change_tree_name',
        serviceType: 'ros_bt_py_interfaces/srv/ChangeTreeName'
      })

      load_tree_from_path_service.value = new Service({
        ros: ros.value,
        name: namespace.value + 'load_tree_from_path',
        serviceType: 'ros_bt_py_interfaces/srv/LoadTreeFromPath'
      })

      nodes_store.getNodes('')
    }

    function setUrl(new_url: string) {
      url.value = new_url
      ros.value.close()
    }

    function hasConnected() {
      connected.value = true
      clearTimeout(connect_timeout)
      notify({
        title: 'ROS connection established!',
        type: 'success'
      })
    }

    function hasDisconnected() {
      connected.value = false
      messages_store.areMessagesAvailable(false)
      packages_store.arePackagesAvailable(false)

      editor_store.enableSubtreePublishing(false)
      editor_store.publish_data = false

      startConnectTimeout()

      notify({
        title: 'ROS connection closed!',
        type: 'warn'
      })
    }

    function changeNamespace(new_namespace: string) {
      namespace.value = new_namespace
      if (available_namespaces.value.indexOf(new_namespace) === -1) {
        available_namespaces.value.push(namespace.value)
      }
      updateROSServices()
    }

    function setAvailableNamespaces(new_namespaces: string[]) {
      available_namespaces.value = new_namespaces
    }

    return {
      ros,
      connected,
      url,
      namespace,
      available_namespaces,
      connect,
      auto_connect,
      toggleAutoConnect,
      services_for_type_service,
      load_tree_service,
      fix_yaml_service,
      control_tree_execution_service,
      clear_tree_service,
      get_available_nodes_service,
      get_message_fields_service,
      unwire_data_service,
      remove_node_service,
      morph_node_service,
      set_options_service,
      move_node_service,
      replace_node_service,
      wire_data_service,
      add_node_at_index_service,
      generate_subtree_service,
      set_publish_subtrees_service,
      set_publish_data_service,
      get_storage_folders_service,
      get_folder_structure_service,
      get_package_structure_service,
      save_tree_service,
      change_tree_name_service,
      load_tree_from_path_service,
      tree_structure_sub,
      tree_state_sub,
      tree_data_sub,
      packages_sub,
      messages_sub,
      channels_sub,
      log_msgs_sub,
      startConnectTimeout,
      setUrl,
      changeNamespace,
      setAvailableNamespaces,
      hasConnected,
      hasDisconnected,
      updateROSServices
    }
  },
  {
    persist: {
      pick: ['namespace', 'url', 'available_namespaces', 'auto_connect'],
      storage: localStorage,
      afterHydrate: (context) => {
        context.store.updateROSServices()
        context.store.connect()
      }
    }
  }
)
