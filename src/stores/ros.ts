import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import ROSLIB from 'roslib'
import type { DebugSettings, Message, Package } from '@/types/types'
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
import type { ClearTreeRequest, ClearTreeResponse } from '@/types/services/ClearTree'

export const useROSStore = defineStore('ros', () => {
  const ros = ref<ROSLIB.Ros>(new ROSLIB.Ros({}))
  const connected = computed<boolean>(() => ros.value.isConnected)
  const url = ref<string>('ws://' + window.location.hostname + ':9090')
  const namespace = ref<string>('/')
  const available_namespaces = ref<string[]>(['/'])

  const packages = ref<Package[]>([])
  const packages_available = ref<boolean>(false)

  const messages = ref<Message[]>([])
  const messages_available = ref<boolean>(false)

  const services_for_type_service = ref<
    ROSLIB.Service<ServicesForTypeRequest, ServicesForTypeResponse> | undefined
  >(undefined)

  const step_service = ref<ROSLIB.Service<ContinueRequest, ContinueResponse> | undefined>(undefined)

  const set_execution_mode_service = ref<
    ROSLIB.Service<SetExecutionModeRequest, SetExecutionModeResponse> | undefined
  >(undefined)

  const debug_settings_sub = ref<ROSLIB.Topic<DebugSettings> | undefined>(undefined)

  const tick_service = ref<
    ROSLIB.Service<ControlTreeExecutionRequest, ControlTreeExecutionResponse> | undefined
  >(undefined)

  const clear_tree_service = ref<ROSLIB.Service<ClearTreeRequest, ClearTreeResponse> | undefined>(
    undefined
  )

  function createROSServices() {
    debug_settings_sub.value = new ROSLIB.Topic({
      ros: ros.value,
      name: namespace.value + 'debug/debug_settings',
      messageType: 'ros_bt_py_interfaces/msg/DebugSettings'
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

    tick_service.value = new ROSLIB.Service({
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
    debug_settings_sub.value = undefined
    set_execution_mode_service.value = undefined
    services_for_type_service.value = undefined
    step_service.value = undefined
    clear_tree_service.value = undefined
    tick_service.value = undefined
  }

  ros.value.on('connection', () => {
    createROSServices()
  })

  ros.value.on('close', () => {
    destroyROSServices()
  })

  function connect(new_url: string) {
    url.value = new_url
    ros.value.connect(new_url)
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
    packages,
    messages,
    packages_available,
    messages_available,
    services_for_type_service,
    set_execution_mode_service,
    step_service,
    tick_service,
    clear_tree_service,
    debug_settings_sub,
    connect,
    changeNamespace,
    setAvailableNamespaces
  }
})
