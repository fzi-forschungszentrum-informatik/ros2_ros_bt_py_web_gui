/*
 * Copyright 2024 FZI Forschungszentrum Informatik
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
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import ROSLIB from 'roslib'
import type { Packages, Messages, TreeMsg, SubtreeInfo } from '@/types/types'
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
import type { AddNodeRequest, AddNodeResponse } from '@/types/services/AddNode'
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

export const useROSStore = defineStore(
  'ros',
  () => {
    const messages_store = useMessasgeStore()
    const packages_store = usePackageStore()

    const ros = ref<ROSLIB.Ros>(new ROSLIB.Ros({}))
    const connected = computed<boolean>(() => ros.value.isConnected)
    const url = ref<string>('ws://' + window.location.hostname + ':9090')
    const namespace = ref<string>('')
    const available_namespaces = ref<string[]>(['/'])

    const services_for_type_service = ref<
      ROSLIB.Service<ServicesForTypeRequest, ServicesForTypeResponse>
    >(
      new ROSLIB.Service({
        ros: ros.value,
        name: '/rosapi/services_for_type',
        serviceType: 'rosapi/ServicesForType'
      })
    )

    const load_tree_service = ref<ROSLIB.Service<LoadTreeRequest, LoadTreeResponse>>(
      new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'load_tree',
        serviceType: 'ros_bt_py_interfaces/srv/LoadTree'
      })
    )

    const fix_yaml_service = ref<ROSLIB.Service<FixYamlRequest, FixYamlResponse>>(
      new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'fix_yaml',
        serviceType: 'ros_bt_py_interfaces/srv/FixYaml'
      })
    )

    const control_tree_execution_service = ref<
      ROSLIB.Service<ControlTreeExecutionRequest, ControlTreeExecutionResponse>
    >(
      new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'control_tree_execution',
        serviceType: 'ros_bt_py_interfaces/srv/ControlTreeExecution'
      })
    )

    const clear_tree_service = ref<ROSLIB.Service<ClearTreeRequest, ClearTreeResponse>>(
      new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'clear',
        serviceType: 'ros_bt_py_interfaces/srv/ClearTree'
      })
    )

    const add_node_service = ref<ROSLIB.Service<AddNodeRequest, AddNodeResponse>>(
      new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'add_node',
        serviceType: 'ros_bt_py_interfaces/srv/AddNode'
      })
    )

    const set_publish_subtrees_service = ref<ROSLIB.Service<SetBoolRequest, SetBoolResponse>>(
      new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'debug/set_publish_subtrees',
        serviceType: 'std_srvs/srv/SetBool'
      })
    )

    const tree_sub = ref<ROSLIB.Topic<TreeMsg>>(
      new ROSLIB.Topic({
        ros: ros.value,
        name: namespace.value + 'tree',
        messageType: 'ros_bt_py_interfaces/msg/Tree',
        latch: true,
        reconnect_on_close: true
      })
    )

    const subtree_info_sub = ref<ROSLIB.Topic<SubtreeInfo>>(
      new ROSLIB.Topic({
        ros: ros.value,
        name: namespace.value + 'debug/subtree_info',
        messageType: 'ros_bt_py_interfaces/msg/SubtreeInfo',
        latch: true,
        reconnect_on_close: true
      })
    )

    const packages_sub = ref<ROSLIB.Topic<Packages>>(
      new ROSLIB.Topic({
        ros: ros.value,
        name: namespace.value + 'packages',
        messageType: 'ros_bt_py_interfaces/msg/Packages',
        latch: true,
        reconnect_on_close: true
      })
    )
    const messages_sub = ref<ROSLIB.Topic<Messages>>(
      new ROSLIB.Topic({
        ros: ros.value,
        name: namespace.value + 'messages',
        messageType: 'ros_bt_py_interfaces/msg/Messages',
        latch: true,
        reconnect_on_close: true
      })
    )

    const get_available_nodes_service = ref<
      ROSLIB.Service<GetAvailableNodesRequest, GetAvailableNodesResponse>
    >(
      new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'get_available_nodes',
        serviceType: 'ros_bt_py_interfaces/srv/GetAvailableNodes'
      })
    )

    const get_message_fields_service = ref<
      ROSLIB.Service<GetMessageFieldsRequest, GetMessageFieldsResponse>
    >(
      new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'get_message_fields',
        serviceType: 'ros_bt_py_interfaces/srv/GetMessageFields'
      })
    )

    const unwire_data_service = ref<ROSLIB.Service<WireNodeDataRequest, WireNodeDataResponse>>(
      new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'unwire_data',
        serviceType: 'ros_bt_py_interfaces/srv/WireNodeData'
      })
    )

    const remove_node_service = ref<ROSLIB.Service<RemoveNodeRequest, RemoveNodeResponse>>(
      new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'remove_node',
        serviceType: 'ros_bt_pt_interfaces/srv/RemoveNode'
      })
    )

    const replace_node_service = ref<ROSLIB.Service<ReplaceNodeRequest, ReplaceNodeResponse>>(
      new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'replace_node',
        serviceType: 'ros_bt_pt_interfaces/srv/ReplaceNode'
      })
    )

    const set_options_service = ref<ROSLIB.Service<SetOptionsRequest, SetOptionsResponse>>(
      new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'set_options',
        serviceType: 'ros_bt_pt_interfaces/srv/SetOptions'
      })
    )

    const morph_node_service = ref<ROSLIB.Service<MorphNodeRequest, MorphNodeResponse>>(
      new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'morph_node',
        serviceType: 'ros_bt_pt_interfaces/srv/MorphNode'
      })
    )

    const move_node_service = ref<ROSLIB.Service<MoveNodeRequest, MoveNodeResponse>>(
      new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'move_node',
        serviceType: 'ros_bt_py_interfaces/srv/MoveNode'
      })
    )

    const add_node_at_index_service = ref<
      ROSLIB.Service<AddNodeAtIndexRequest, AddNodeAtIndexResponse>
    >(
      new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'add_node_at_index',
        serviceType: 'ros_bt_py_interfaces/srv/AddNodeAtIndex'
      })
    )

    const wire_data_service = ref<ROSLIB.Service<WireNodeDataRequest, WireNodeDataResponse>>(
      new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'wire_data',
        serviceType: 'ros_bt_py_interfaces/srv/WireNodeData'
      })
    )

    const generate_subtree_service = ref<
      ROSLIB.Service<GenerateSubtreeRequest, GenerateSubtreeResponse>
    >(
      new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'generate_subtree',
        serviceType: 'ros_bt_py_interfaces/srv/GenerateSubtree'
      })
    )

    const get_storage_folders_service = ref<
      ROSLIB.Service<GetStorageFoldersRequest, GetStorageFoldersResponse>
    >(
      new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'get_storage_folders',
        serviceType: 'ros_bt_py_interfaces/srv/GetStorageFolders'
      })
    )

    const get_folder_structure_service = ref<
      ROSLIB.Service<GetFolderStructureRequest, GetFolderStructureResponse>
    >(
      new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'get_folder_structure',
        serviceType: 'ros_bt_py_interfaces/srv/GetFolderStructure'
      })
    )

    const get_package_structure_service = ref<
      ROSLIB.Service<GetPackageStructureRequest, GetPackageStructureResponse>
    >(
      new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'get_package_structure',
        serviceType: 'ros_bt_py_interfaces/srv/GetPackageStructure'
      })
    )

    const save_tree_service = ref<ROSLIB.Service<SaveTreeRequest, SaveTreeResponse>>(
      new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'save_tree',
        serviceType: 'ros_bt_py_interfaces/srv/SaveTree'
      })
    )

    const change_tree_name_service = ref<
      ROSLIB.Service<ChangeTreeNameRequest, ChangeTreeNameResponse>
    >(
      new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'change_tree_name',
        serviceType: 'ros_bt_py_interfaces/srv/ChangeTreeName'
      })
    )

    const load_tree_from_path_service = ref<
      ROSLIB.Service<LoadTreeFromPathRequest, LoadTreeFromPathResponse>
    >(
      new ROSLIB.Service({
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
      tree_sub.value.unsubscribe()
      tree_sub.value.removeAllListeners()
      tree_sub.value = new ROSLIB.Topic({
        ros: ros.value,
        name: namespace.value + 'tree',
        messageType: 'ros_bt_py_interfaces/msg/Tree',
        latch: true,
        reconnect_on_close: true
      })

      subtree_info_sub.value.unsubscribe()
      subtree_info_sub.value.removeAllListeners()
      subtree_info_sub.value = new ROSLIB.Topic({
        ros: ros.value,
        name: namespace.value + 'debug/subtree_info',
        messageType: 'ros_bt_py_interfaces/msg/SubtreeInfo',
        latch: true,
        reconnect_on_close: true
      })

      messages_sub.value.unsubscribe()
      messages_sub.value.removeAllListeners()
      messages_sub.value = new ROSLIB.Topic({
        ros: ros.value,
        name: namespace.value + 'messages',
        messageType: 'ros_bt_py_interfaces/msg/Messages',
        latch: true,
        reconnect_on_close: true
      })

      packages_sub.value.unsubscribe()
      packages_sub.value.removeAllListeners()
      packages_sub.value = new ROSLIB.Topic({
        ros: ros.value,
        name: namespace.value + 'packages',
        messageType: 'ros_bt_py_interfaces/msg/Packages',
        latch: true,
        reconnect_on_close: true
      })

      set_publish_subtrees_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'debug/set_publish_subtrees',
        serviceType: 'std_srvs/srv/SetBool'
      })

      services_for_type_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: '/rosapi/services_for_type',
        serviceType: 'rosapi/ServicesForType'
      })

      load_tree_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'load_tree',
        serviceType: 'ros_bt_py_interfaces/srv/LoadTree'
      })

      fix_yaml_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'fix_yaml',
        serviceType: 'ros_bt_py_interfaces/srv/FixYaml'
      })

      control_tree_execution_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'control_tree_execution',
        serviceType: 'ros_bt_py_interfaces/srv/ControlTreeExecution'
      })

      clear_tree_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'clear',
        serviceType: 'ros_bt_py_interfaces/srv/ClearTree'
      })

      get_available_nodes_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'get_available_nodes',
        serviceType: 'ros_bt_py_interfaces/srv/GetAvailableNodes'
      })

      add_node_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'add_node',
        serviceType: 'ros_bt_py_interfaces/srv/AddNode'
      })

      get_message_fields_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'get_message_fields',
        serviceType: 'ros_bt_py_interfaces/srv/GetMessageFields'
      })

      unwire_data_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'unwire_data',
        serviceType: 'ros_bt_py_interfaces/srv/WireNodeData'
      })

      remove_node_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'remove_node',
        serviceType: 'ros_bt_py_interfaces/srv/RemoveNode'
      })

      set_options_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'set_options',
        serviceType: 'ros_bt_py_interfaces/srv/SetOptions'
      })

      morph_node_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'morph_node',
        serviceType: 'ros_bt_py_interfaces/srv/MorphNode'
      })

      generate_subtree_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'generate_subtree',
        serviceType: 'ros_bt_py_interfaces/srv/GenerateSubtree'
      })

      wire_data_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'wire_data',
        serviceType: 'ros_bt_py_interfaces/srv/WireNodeData'
      })

      add_node_at_index_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'add_node_at_index',
        serviceType: 'ros_bt_py_interfaces/srv/AddNodeAtIndex'
      })

      move_node_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'move_node',
        serviceType: 'ros_bt_py_interfaces/srv/MoveNode'
      })

      get_storage_folders_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'get_storage_folders',
        serviceType: 'ros_bt_py_interfaces/srv/GetStorageFolders'
      })

      get_folder_structure_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'get_folder_structure',
        serviceType: 'ros_bt_py_interfaces/srv/GetFolderStructure'
      })

      get_package_structure_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'get_package_structure',
        serviceType: 'ros_bt_py_interfaces/srv/GetPackageStructure'
      })

      save_tree_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'save_tree',
        serviceType: 'ros_bt_py_interfaces/srv/SaveTree'
      })

      change_tree_name_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'change_tree_name',
        serviceType: 'ros_bt_py_interfaces/srv/ChangeTreeName'
      })

      load_tree_from_path_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'load_tree_from_path',
        serviceType: 'ros_bt_py_interfaces/srv/LoadTreeFromPath'
      })
    }

    function connect() {
      ros.value.connect(url.value)
    }

    function setUrl(new_url: string) {
      url.value = new_url
    }

    function hasConnected() {
      notify({
        title: 'ROS connection established!',
        type: 'success'
      })
    }

    function hasDisconnected() {
      messages_store.areMessagesAvailable(false)
      packages_store.arePackagesAvailable(false)

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
      services_for_type_service,
      load_tree_service,
      fix_yaml_service,
      control_tree_execution_service,
      clear_tree_service,
      get_available_nodes_service,
      add_node_service,
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
      get_storage_folders_service,
      get_folder_structure_service,
      get_package_structure_service,
      save_tree_service,
      change_tree_name_service,
      load_tree_from_path_service,
      tree_sub,
      subtree_info_sub,
      packages_sub,
      messages_sub,
      connect,
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
      paths: ['namespace', 'url', 'available_namespaces'],
      storage: sessionStorage,
      afterRestore: (context) => {
        context.store.updateROSServices()
        context.store.connect()
      }
    }
  }
)
