import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import ROSLIB from 'roslib'
import type { Packages, DebugSettings, Messages } from '@/types/types'
import type {
  ServicesForTypeRequest,
  ServicesForTypeResponse
} from '@/types/services/ServicesForType'
import type { ContinueRequest, ContinueResponse } from '@/types/services/Continue'
import type {
  SetExecutionModeRequest,
  SetExecutionModeResponse
} from '@/types/services/SetExecutionMode'
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

export const useROSStore = defineStore(
  'ros',
  () => {
    const messages_store = useMessasgeStore()
    const packages_store = usePackageStore()

    const ros = ref<ROSLIB.Ros>(new ROSLIB.Ros({}))
    const connected = computed<boolean>(() => ros.value.isConnected)
    const url = ref<string>('ws://' + window.location.hostname + ':9090')
    const namespace = ref<string>('/')
    const available_namespaces = ref<string[]>(['/'])

    const services_for_type_service = ref<
      ROSLIB.Service<ServicesForTypeRequest, ServicesForTypeResponse> | undefined
    >(undefined)

    const step_service = ref<ROSLIB.Service<ContinueRequest, ContinueResponse> | undefined>(
      undefined
    )

    const set_execution_mode_service = ref<
      ROSLIB.Service<SetExecutionModeRequest, SetExecutionModeResponse> | undefined
    >(undefined)

    const debug_settings_sub = ref<ROSLIB.Topic<DebugSettings> | undefined>(undefined)

    const load_tree_service = ref<ROSLIB.Service<LoadTreeRequest, LoadTreeResponse> | undefined>(
      undefined
    )

    const fix_yaml_service = ref<ROSLIB.Service<FixYamlRequest, FixYamlResponse> | undefined>(
      undefined
    )

    const control_tree_execution_service = ref<
      ROSLIB.Service<ControlTreeExecutionRequest, ControlTreeExecutionResponse> | undefined
    >(undefined)

    const clear_tree_service = ref<ROSLIB.Service<ClearTreeRequest, ClearTreeResponse> | undefined>(
      undefined
    )

    const packages_sub = ref<ROSLIB.Topic<Packages> | undefined>(undefined)
    const messages_sub = ref<ROSLIB.Topic<Messages> | undefined>(undefined)

    function createROSServices() {
      debug_settings_sub.value = new ROSLIB.Topic({
        ros: ros.value,
        name: namespace.value + 'debug/debug_settings',
        messageType: 'ros_bt_py_interfaces/msg/DebugSettings'
      })

      messages_sub.value = new ROSLIB.Topic({
        ros: ros.value,
        name: namespace.value + 'messages',
        messageType: 'ros_bt_py_interfaces/msg/Messages'
      })

      packages_sub.value = new ROSLIB.Topic({
        ros: ros.value,
        name: namespace.value + 'packages',
        messageType: 'ros_bt_py_interfaces/msg/Packages'
      })

      set_execution_mode_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'debug/set_execution_mode',
        serviceType: 'ros_bt_py_interfaces/srv/SetExecutionMode'
      })

      services_for_type_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: '/rosapi/services_for_type',
        serviceType: 'rosapi/ServicesForType'
      })

      step_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'debug/continue',
        serviceType: 'ros_bt_py_interfaces/srv/Continue'
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
    }

    function destroyROSServices() {
      if (debug_settings_sub.value) {
        debug_settings_sub.value.removeAllListeners()
        debug_settings_sub.value = undefined
      }
      if (packages_sub.value) {
        packages_sub.value.removeAllListeners()
        packages_sub.value = undefined
      }
      if (messages_sub.value) {
        messages_sub.value.removeAllListeners()
        messages_sub.value = undefined
      }
      set_execution_mode_service.value = undefined
      services_for_type_service.value = undefined
      step_service.value = undefined
      clear_tree_service.value = undefined
      load_tree_service.value = undefined
      fix_yaml_service.value = undefined
      control_tree_execution_service.value = undefined
    }

    ros.value.on('connection', () => {
      createROSServices()

      notify({
        title: 'ROS connection established!',
        type: 'success'
      })
    })

    ros.value.on('close', () => {
      destroyROSServices()
      messages_store.areMessagesAvailable(false)
      packages_store.arePackagesAvailable(false)

      notify({
        title: 'ROS connection closed!',
        type: 'warn'
      })
    })

    ros.value.on('error', () => {
      notify({
        title: 'ROS connection error!',
        type: 'error'
      })
    })

    function connect() {
      ros.value.connect(url.value)
    }

    function setUrl(new_url: string) {
      url.value = new_url
    }

    function changeNamespace(new_namespace: string) {
      namespace.value = new_namespace
      if (available_namespaces.value.indexOf(new_namespace) === -1) {
        available_namespaces.value.push(namespace.value)
      }
      if (connected.value) {
        destroyROSServices()
        createROSServices()
      }
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
      set_execution_mode_service,
      load_tree_service,
      step_service,
      fix_yaml_service,
      control_tree_execution_service,
      clear_tree_service,
      debug_settings_sub,
      packages_sub,
      messages_sub,
      connect,
      setUrl,
      changeNamespace,
      setAvailableNamespaces
    }
  },
  {
    persist: {
      paths: ['namespace', 'url', 'available_namespaces'],
      storage: sessionStorage
    }
  }
)
