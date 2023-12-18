import { Component } from "react";

import "./RosBtPy.scss";
import "./style.scss";

import "./utils";
import ROSLIB from "roslib";
import Fuse from "fuse.js";

import ReactModal from "react-modal";

import { MultipleSelection } from "./components/MultipleSelection";
import { NewNode } from "./components/NewNode";
import { SelectedNode } from "./components/SelectedNode";
import { PackageLoader } from "./components/PackageLoader";
import { NodeList } from "./components/NodeList";
import { ExecutionBar } from "./components/ExecutionBar";
import { Spacer } from "./components/Spacer";
import { SelectEditorSkin } from "./components/SelectEditorSkin";
import { SelectTree } from "./components/SelectTree";
import { D3BehaviorTreeEditor } from "./components/D3BehaviorTreeEditor";
import { BehaviorTreeEdge } from "./components/BehaviorTreeEdge";
import { ErrorHistory } from "./components/ErrorHistory";
import { LoadPackageFileBrowser } from "./components/LoadPackageFileBrowser";
import {
  DebugInfo,
  DocumentedNode,
  Error,
  Message,
  Messages,
  NodeDataWiring,
  NodeMsg,
  Package,
  Packages,
  TreeMsg,
} from "./types/types";
import {
  GetAvailableNodesRequest,
  GetAvailableNodesResponse,
} from "./types/services/GetAvailableNodes";
import { TreeExecutionCommands } from "./types/services/ControlTreeExecution";
import { error_id } from "./utils";
import { AddNodeRequest, AddNodeResponse } from "./types/services/AddNode";
import {
  RemoveNodeRequest,
  RemoveNodeResponse,
} from "./types/services/RemoveNode";
import {
  SetExecutionModeRequest,
  SetExecutionModeResponse,
} from "./types/services/SetExecutionMode";
import { SaveFileBrowser } from "./components/SaveFileBrowser";
import { LoadFileBrowser } from "./components/LoadFileBrowser";

interface AppState {
  bt_namespace: string;
  ros_uri: string;
  selected_tree: { name: string; is_subtree: boolean };
  error_history: Error[];
  error_history_sorting_asc: boolean;
  selected_edge: NodeDataWiring | null;
  available_nodes: DocumentedNode[];
  filtered_nodes: DocumentedNode[] | null;
  subtree_names: string[];
  selected_node: DocumentedNode | null; // FIXME
  selected_node_names: string[];
  copied_node: NodeMsg | null;
  showDataGraph: boolean;
  dragging_node_list_item: DocumentedNode | null;
  last_tree_msg: TreeMsg | null;
  // Can be 'nodelist' or 'editor'. The value decides whether the
  // "Add node" or "change node options" widget is shown.
  last_selection_source: string;
  // The corresponding object from available_nodes for the
  // currently selected node. We need this because information
  // about OptionRefs isn't included in live nodes, but we need it
  // to edit options.
  selected_node_info: DocumentedNode | undefined;
  node_changed: boolean;
  ros: ROSLIB.Ros;
  skin: string;
  copy_node: boolean;
  connected: boolean;
  publishing_subtrees: boolean;
  last_selected_package: string;
  last_selected_storage_folder: string;
  show_file_modal: string | null;
  current_time: number;
  nodelist_visible: boolean;
  executionbar_visible: boolean;
  running_commands: Set<TreeExecutionCommands>;
  packages_available: boolean;
  messages_available: boolean;
  node_search: string;
  selected_node_name: string | null;
}

interface AppProps {}

export class RosBtPyApp extends Component<AppProps, AppState> {
  nodes_fuse: Fuse<DocumentedNode> | null;
  tree_topic: ROSLIB.Topic<TreeMsg>;
  debug_topic: ROSLIB.Topic<DebugInfo>;
  messages_topic: ROSLIB.Topic<Messages>;
  get_nodes_service: ROSLIB.Service<
    GetAvailableNodesRequest,
    GetAvailableNodesResponse
  > | null;
  add_node_service: ROSLIB.Service<AddNodeRequest, AddNodeResponse>;
  remove_node_service: ROSLIB.Service<RemoveNodeRequest, RemoveNodeResponse>;
  set_execution_mode_service: ROSLIB.Service<
    SetExecutionModeRequest,
    SetExecutionModeResponse
  >;
  packages_topic: ROSLIB.Topic<Packages>;
  lastTreeUpdate: number | null;
  topicTimeoutID: number | null;
  newMsgDelay: number;
  last_received_tree_msg?: TreeMsg;
  last_received_debug_msg!: DebugInfo;
  messages: Message[];
  messagesFuse: Fuse<Message> | null;
  last_received_packages_msg?: Packages;
  packages: Package[];
  packagesFuse: Fuse<Package> | null;
  last_tree_update?: number;
  nameInput?: HTMLInputElement | null;

  constructor(props: AppProps) {
    super(props);

    let ros_uri = "ws://" + window.location.hostname + ":9090";

    const parameters = window.location.search.substr(1);

    const prmarr = parameters.split("&");
    for (let i = 0; i < prmarr.length; i++) {
      const tmparr = prmarr[i].split("=");
      if (tmparr[0] === "ros_uri") {
        ros_uri = tmparr[1];
      }
    }

    const ros = new ROSLIB.Ros({
      url: ros_uri,
    });

    this.state = {
      bt_namespace: "",
      ros_uri: ros_uri,
      selected_tree: {
        is_subtree: false,
        name: "",
      },
      error_history: [],
      error_history_sorting_asc: false,
      selected_edge: null,
      available_nodes: [],
      filtered_nodes: [],
      subtree_names: [],
      selected_node: null, // FIXME
      selected_node_names: [],
      copied_node: null,
      showDataGraph: true,
      dragging_node_list_item: null,
      last_tree_msg: null,
      // Can be 'nodelist' or 'editor'. The value decides whether the
      // "Add node" or "change node options" widget is shown.
      last_selection_source: "nodelist",
      // The corresponding object from available_nodes for the
      // currently selected node. We need this because information
      // about OptionRefs isn't included in live nodes, but we need it
      // to edit options.
      selected_node_info: undefined,
      node_changed: false,
      ros: ros,
      skin: "darkmode",
      copy_node: false,
      connected: false,
      publishing_subtrees: false,
      last_selected_package: "",
      last_selected_storage_folder: "",
      show_file_modal: null,
      current_time: Date.now(),
      nodelist_visible: true,
      executionbar_visible: true,
      running_commands: new Set(),
      packages_available: false,
      messages_available: false,
      node_search: "",
      selected_node_name: null,
    };

    this.nodes_fuse = null;
    this.messagesFuse = null;
    this.packagesFuse = null;

    this.tree_topic = new ROSLIB.Topic({
      ros: this.state.ros,
      name: this.state.bt_namespace + "tree",
      messageType: "ros_bt_py_interfaces/msg/Tree",
    });

    this.debug_topic = new ROSLIB.Topic({
      ros: this.state.ros,
      name: this.state.bt_namespace + "debug/debug_info",
      messageType: "ros_bt_py_interfaces/msg/DebugInfo",
    });

    this.messages_topic = new ROSLIB.Topic({
      ros: this.state.ros,
      name: this.state.bt_namespace + "messages",
      messageType: "ros_bt_py_interfaces/msg/Messages",
    });

    this.get_nodes_service = null;

    this.state.ros.getServices((result: string | string[]) => {
      if (result.includes(this.state.bt_namespace + "get_available_nodes")) {
        this.get_nodes_service = new ROSLIB.Service({
          ros: this.state.ros,
          name: this.state.bt_namespace + "get_available_nodes",
          serviceType: "ros_bt_py_interfaces/srv/GetAvailableNodes",
        });
        this.setState({ current_time: Date.now() });
      }
    });

    this.add_node_service = new ROSLIB.Service({
      ros: this.state.ros,
      name: this.state.bt_namespace + "add_node",
      serviceType: "ros_bt_py_interfaces/srv/AddNode",
    });

    this.remove_node_service = new ROSLIB.Service({
      ros: this.state.ros,
      name: this.state.bt_namespace + "remove_node",
      serviceType: "ros_bt_py_interfaces/srv/RemoveNode",
    });

    this.set_execution_mode_service = new ROSLIB.Service({
      ros: this.state.ros,
      name: this.state.bt_namespace + "debug/set_execution_mode",
      serviceType: "ros_bt_py_interfaces/srv/SetExecutionMode",
    });

    this.packages_topic = new ROSLIB.Topic<Packages>({
      ros: this.state.ros,
      name: this.state.bt_namespace + "packages",
      messageType: "ros_bt_py_interfaces/msg/Packages",
    });

    this.lastTreeUpdate = null;
    this.topicTimeoutID = null;
    this.messages = [];
    this.packages = [];
    this.newMsgDelay = 500; // ms

    // Bind these here so this works as expected in callbacks
    this.getNodes = this.getNodes.bind(this);
    this.onError = this.onError.bind(this);
    this.onClearErrors = this.onClearErrors.bind(this);
    this.onChangeErrorHistorySorting =
      this.onChangeErrorHistorySorting.bind(this);
    this.onNodeListSelectionChange = this.onNodeListSelectionChange.bind(this);
    this.onNodeListDragging = this.onNodeListDragging.bind(this);
    this.onChangeFileModal = this.onChangeFileModal.bind(this);
    this.check_dragging = this.check_dragging.bind(this);
    this.onNodeChanged = this.onNodeChanged.bind(this);
    this.onEditorSelectionChange = this.onEditorSelectionChange.bind(this);
    this.onMultipleSelectionChange = this.onMultipleSelectionChange.bind(this);
    this.onSelectedPackageChange = this.onSelectedPackageChange.bind(this);
    this.onSelectedStorageFolderChange =
      this.onSelectedStorageFolderChange.bind(this);
    this.onSelectedEdgeChange = this.onSelectedEdgeChange.bind(this);
    this.onTreeUpdate = this.onTreeUpdate.bind(this);
    this.onDebugUpdate = this.onDebugUpdate.bind(this);
    this.onMessagesUpdate = this.onMessagesUpdate.bind(this);
    this.findPossibleParents = this.findPossibleParents.bind(this);
    this.onSelectedTreeChange = this.onSelectedTreeChange.bind(this);
    this.onNamespaceChange = this.onNamespaceChange.bind(this);
    this.updateTreeMsg = this.updateTreeMsg.bind(this);
    this.changeSkin = this.changeSkin.bind(this);
    this.changeCopyMode = this.changeCopyMode.bind(this);
    this.onPublishingSubtreesChange =
      this.onPublishingSubtreesChange.bind(this);
    this.onPackagesUpdate = this.onPackagesUpdate.bind(this);
    this.handleNodeSearch = this.handleNodeSearch.bind(this);
    this.handleNodeSearchClear = this.handleNodeSearchClear.bind(this);
    this.onNewRunningCommand = this.onNewRunningCommand.bind(this);
    this.onRunningCommandCompleted = this.onRunningCommandCompleted.bind(this);
  }

  onTreeUpdate(msg: TreeMsg) {
    if (
      this.state.publishing_subtrees &&
      this.last_received_tree_msg &&
      this.last_received_tree_msg.nodes
    ) {
      let setup_and_shutdown = false;
      if (this.last_received_tree_msg.nodes.length != msg.nodes.length) {
        setup_and_shutdown = true;
      } else {
        for (let i = 0; i < msg.nodes.length; i++) {
          if (
            msg.nodes[i].module !=
              this.last_received_tree_msg.nodes[i].module ||
            msg.nodes[i].node_class !=
              this.last_received_tree_msg.nodes[i].node_class ||
            msg.nodes[i].name != this.last_received_tree_msg.nodes[i].name
          ) {
            setup_and_shutdown = true;
          }
        }
      }
      if (setup_and_shutdown) {
        this.set_execution_mode_service.callService(
          {
            single_step: false,
            publish_subtrees: true,
            collect_performance_data: false,
          } as SetExecutionModeRequest,
          () => {
            console.debug("Set execution mode response received!");
          }
        );
      }
    }
    this.last_received_tree_msg = msg;
    if (!this.state.selected_tree.is_subtree) {
      this.updateTreeMsg(msg);
    }
  }

  onDebugUpdate(msg: DebugInfo) {
    this.last_received_debug_msg = msg;
    this.setState({
      subtree_names: msg.subtree_states.map((x: TreeMsg) => x.name).sort(),
    });
    if (this.state.selected_tree.is_subtree) {
      const selectedSubtree = msg.subtree_states.find(
        (x: TreeMsg) => x.name === this.state.selected_tree.name
      );
      if (selectedSubtree) {
        this.updateTreeMsg(selectedSubtree);
      } else {
        this.onSelectedTreeChange(false, "");
      }
    }
  }

  onMessagesUpdate(msg: Messages) {
    this.messages = [];
    for (let i = 0; i < msg.messages.length; i++) {
      const components = msg.messages[i].msg.split("/");

      if (components.length == 3) {
        if (msg.messages[i].service) {
          this.messages.push({
            msg: components[0] + ".srv." + components[2],
            service: true,
            action: false,
          });
          this.messages.push({
            msg: components[0] + ".srv." + components[2] + ".Request",
            action: true,
            service: false,
          });
          this.messages.push({
            msg: components[0] + ".srv." + components[2] + ".Response",
            action: true,
            service: false,
          });
        } else if (msg.messages[i].action) {
          this.messages.push({
            msg: components[0] + ".action." + components[2],
            action: true,
            service: false,
          });
          this.messages.push({
            msg: components[0] + ".action." + components[2] + ".Goal",
            action: true,
            service: false,
          });
          this.messages.push({
            msg: components[0] + ".action." + components[2] + ".Result",
            action: true,
            service: false,
          });
          this.messages.push({
            msg: components[0] + ".action." + components[2] + ".Feedback",
            action: true,
            service: false,
          });
        } else {
          this.messages.push({
            msg: components[0] + ".msg." + components[2],
            service: false,
            action: false,
          });
        }
      }
    }
    const options = {
      shouldSort: true,
      threshold: 0.3,
      location: 0,
      distance: 100,
      maxPatternLength: 200,
      minMatchCharLength: 3,
      keys: ["msg"],
      isCaseSensitive: false,
      ignoreLocation: true,
      useExtendedSearch: true,
    };
    this.messagesFuse = new Fuse(this.messages, options);
    this.setState({ messages_available: true });
  }

  onPackagesUpdate(msg: Packages) {
    this.last_received_packages_msg = msg;
    this.packages = msg.packages;

    const options = {
      shouldSort: true,
      threshold: 0.3,
      location: 0,
      distance: 100,
      maxPatternLength: 200,
      minMatchCharLength: 0,
      keys: ["package", "path"],
      isCaseSensitive: false,
      ignoreLocation: true,
      useExtendedSearch: true,
    };
    this.packagesFuse = new Fuse(this.packages, options);

    this.setState({ packages_available: true });
  }

  changeSkin(skin: string) {
    this.setState({ skin: skin });
  }

  changeCopyMode(mode: boolean) {
    if (mode) {
      // node copy/paste
      this.setState({ copy_node: true });
    } else {
      // "normal" copy/paste for text
      this.setState({ copy_node: false });
    }
  }

  onPublishingSubtreesChange(enable: boolean) {
    this.setState({ publishing_subtrees: enable });
  }

  updateTreeMsg(msg: TreeMsg) {
    // Clear any timers for previously received messages (see below)
    if (this.topicTimeoutID) {
      window.clearTimeout(this.topicTimeoutID);
      this.topicTimeoutID = null;
    }

    const now = Date.now();
    if (
      this.lastTreeUpdate === null ||
      now - this.lastTreeUpdate > this.newMsgDelay
    ) {
      this.setState({ last_tree_msg: msg });
      this.lastTreeUpdate = now;
    } else {
      // if it hasn't been long enough since the last tree update,
      // schedule a retry so we don't drop a message.
      this.topicTimeoutID = window.setTimeout(() => {
        this.updateTreeMsg(msg);
      }, this.newMsgDelay * 2);
    }
  }

  onSelectedTreeChange(is_subtree: boolean, name: string) {
    // Find the correct tree message (if any) to set for the new
    // selected tree
    let tree_msg = undefined;
    if (is_subtree) {
      tree_msg = this.last_received_debug_msg.subtree_states.find(
        (x: TreeMsg) => x.name === name
      );
    } else {
      tree_msg = this.last_received_tree_msg;
    }

    if (tree_msg) {
      this.setState({
        selected_tree: {
          is_subtree: is_subtree,
          name: name,
        },
        last_tree_msg: tree_msg,
      });
      this.last_tree_update = Date.now();
    } else {
      this.setState({
        selected_tree: {
          is_subtree: is_subtree,
          name: name,
        },
      });
    }
  }

  onNamespaceChange(namespace: string) {
    if (namespace !== this.state.bt_namespace) {
      this.tree_topic = new ROSLIB.Topic({
        ros: this.state.ros,
        name: namespace + "tree",
        messageType: "ros_bt_py_interfaces/msg/Tree",
      });

      this.debug_topic = new ROSLIB.Topic({
        ros: this.state.ros,
        name: namespace + "debug/debug_info",
        messageType: "ros_bt_py_interfaces/msg/DebugInfo",
      });

      this.messages_topic = new ROSLIB.Topic({
        ros: this.state.ros,
        name: namespace + "messages",
        messageType: "ros_bt_py_interfaces/msg/Messages",
      });

      this.packages_topic = new ROSLIB.Topic({
        ros: this.state.ros,
        name: namespace + "packages",
        messageType: "ros_bt_py_interfaces/msg/Packages",
      });

      // Subscribe again
      this.tree_topic.subscribe(this.onTreeUpdate);
      this.debug_topic.subscribe(this.onDebugUpdate);
      this.messages_topic.subscribe(this.onMessagesUpdate);
      this.packages_topic.subscribe(this.onPackagesUpdate);

      // Update GetAvailableNodes Service
      this.get_nodes_service = null;

      this.state.ros.getServices((result: string | string[]) => {
        if (result.includes(namespace + "get_available_nodes")) {
          this.get_nodes_service = new ROSLIB.Service({
            ros: this.state.ros,
            name: namespace + "get_available_nodes",
            serviceType: "ros_bt_py_interfaces/srv/GetAvailableNodes",
          });
          this.setState({ current_time: Date.now() });
        }
      });

      this.add_node_service = new ROSLIB.Service({
        ros: this.state.ros,
        name: namespace + "add_node",
        serviceType: "ros_bt_py_interfaces/srv/AddNode",
      });

      this.remove_node_service = new ROSLIB.Service({
        ros: this.state.ros,
        name: namespace + "remove_node",
        serviceType: "ros_bt_py_interfaces/srv/RemoveNode",
      });

      this.set_execution_mode_service = new ROSLIB.Service({
        ros: this.state.ros,
        name: namespace + "debug/set_execution_mode",
        serviceType: "ros_bt_py_interfaces/srv/SetExecutionMode",
      });

      this.setState({ bt_namespace: namespace });
    }
  }

  findPossibleParents() {
    if (this.state.last_tree_msg) {
      return this.state.last_tree_msg.nodes
        .filter(
          (node: NodeMsg) =>
            node.max_children < 0 || node.child_names.length < node.max_children
        )
        .sort(function (a: NodeMsg, b: NodeMsg) {
          if (a.name < b.name) {
            return -1;
          } else if (a.name > b.name) {
            return 1;
          } else {
            return 0;
          }
        });
    }
    return [];
  }

  getNodes(package_name: string) {
    if (this.get_nodes_service !== null) {
      this.get_nodes_service.callService(
        new GetAvailableNodesRequest([package_name]),
        (response: GetAvailableNodesResponse) => {
          if (response.success) {
            this.setState({ available_nodes: response.available_nodes });
            const options = {
              shouldSort: true,
              threshold: 0.3,
              location: 0,
              distance: 20,
              maxPatternLength: 100,
              minMatchCharLength: 3,
              keys: ["node_class", "node_type", "module", "tags"],
              ignoreLocation: true,
              useExtendedSearch: true,
            };
            const nodes = response.available_nodes.map(
              (node: DocumentedNode) => {
                if (node.max_children < 0) {
                  node.node_type = "Flow control";
                } else if (node.max_children > 0) {
                  node.node_type = "Decorator";
                } else {
                  node.node_type = "Leaf";
                }
                return node;
              }
            );
            this.nodes_fuse = new Fuse(nodes, options);
          } else {
            this.onError(
              "Failed to get list of nodes: " + response.error_message
            );
          }
        }
      );
    }
  }

  componentDidMount() {
    ReactModal.setAppElement("body");

    this.state.ros.on("connection", () => {
      this.setState({ connected: true });
    });

    this.state.ros.on("close", () => {
      this.setState({
        connected: false,
        packages_available: false,
        messages_available: false,
      });

      console.log("Connection to websocket closed, reconnecting in 5s");
      setTimeout(() => {
        this.state.ros.connect(this.state.ros_uri);
      }, 5000);
    });

    this.tree_topic.subscribe(this.onTreeUpdate);
    this.debug_topic.subscribe(this.onDebugUpdate);
    this.messages_topic.subscribe(this.onMessagesUpdate);
    this.packages_topic.subscribe(this.onPackagesUpdate);

    document.body.addEventListener(
      "keydown",
      (e: KeyboardEvent) => {
        if (this.state.show_file_modal && e.keyCode == 27) {
          // 27 = ESC
          this.setState({ show_file_modal: null });
        }
        if (
          this.state.copy_node &&
          e.keyCode == 67 &&
          (e.ctrlKey || e.metaKey)
        ) {
          // 67 = KeyC
          if (this.state.selected_node_names.length > 1) {
            console.log(
              "COPY/PASTE FOR MULTIPLE SELECTION NOT IMPLEMENTED YET"
            );
            return;
          }
          this.setState({ copied_node: this.state.selected_node });
        } else if (
          this.state.copy_node &&
          e.keyCode == 86 &&
          (e.ctrlKey || e.metaKey)
        ) {
          // 86 = KeyV
          if (this.state.selected_node_names.length > 1) {
            console.log(
              "COPY/PASTE FOR MULTIPLE SELECTION NOT IMPLEMENTED YET"
            );
            return;
          }
          let parent = "";
          if (
            this.state.last_tree_msg !== null &&
            this.state.copied_node !== null
          ) {
            for (let i = 0; i < this.state.last_tree_msg.nodes.length; i++) {
              for (
                let j = 0;
                j < this.state.last_tree_msg.nodes[i].child_names.length;
                j++
              ) {
                if (
                  this.state.copied_node.name ==
                  this.state.last_tree_msg.nodes[i].child_names[j]
                ) {
                  parent = this.state.last_tree_msg.nodes[i].name;
                  break;
                }
              }
            }
          }
          this.add_node_service.callService(
            {
              parent_name: parent,
              node: this.state.copied_node,
              allow_rename: true,
            } as AddNodeRequest,
            (response: AddNodeResponse) => {
              if (response.success) {
                console.log(
                  "Added node to tree as " + response.actual_node_name
                );
              } else {
                console.log(
                  "Failed to add node " +
                    this.state.copied_node!.name +
                    ": " +
                    response.error_message
                );
              }
            }
          );
        }
        if (
          this.state.copy_node &&
          this.state.selected_node &&
          e.keyCode == 46
        ) {
          // 46 = Delete
          if (this.state.selected_node_names.length > 1) {
            console.log("DELETE FOR MULTIPLE SELECTION NOT IMPLEMENTED YET");
            return;
          }
          let remove_children = false;
          let remove_nodes_text =
            'Do you want to remove the selected node"' +
            this.state.selected_node.name +
            '"';

          if (e.shiftKey) {
            remove_children = true;
            remove_nodes_text += " and its children";
          }
          remove_nodes_text += "?";

          if (window.confirm(remove_nodes_text)) {
            this.remove_node_service.callService(
              {
                node_name: this.state.selected_node.name,
                remove_children: remove_children,
              } as RemoveNodeRequest,
              (response: RemoveNodeResponse) => {
                if (response.success) {
                  console.log("Removed node from tree");
                  this.onEditorSelectionChange(null);
                } else {
                  console.log(
                    "Failed to remove node " + response.error_message
                  );
                }
              }
            );
          }
        }
      },
      false
    );
    if (this.nameInput) this.nameInput.focus();
  }

  componentWillUnmount() {
    this.tree_topic.unsubscribe(this.onTreeUpdate);
    this.debug_topic.unsubscribe(this.onDebugUpdate);
    this.messages_topic.unsubscribe(this.onMessagesUpdate);
    this.packages_topic.unsubscribe(this.onPackagesUpdate);
  }

  onError(error_message: string) {
    this.setState({
      error_history: this.state.error_history.concat({
        id: error_id(),
        time: Date.now(),
        text: error_message,
      }),
    });
    console.log(error_message);
  }

  onClearErrors() {
    this.setState({ error_history: [] });
  }

  onChangeErrorHistorySorting(new_sorting: boolean) {
    this.setState({ error_history_sorting_asc: new_sorting });
  }

  onNodeListSelectionChange(new_selected_node: DocumentedNode) {
    if (this.state.node_changed) {
      if (
        window.confirm(
          "Are you sure you wish to discard all changes to the currently edited node?"
        )
      ) {
        // normal behavior, discard all entered data
        this.setState({ node_changed: false });
      } else {
        // do not execute onNodeListSelectionChange and keep editing
        return;
      }
    }
    this.setState({
      selected_node: new_selected_node,
      selected_node_names: [],
      last_selection_source: "nodelist",
    });
  }

  onNodeListDragging(dragging: DocumentedNode | null) {
    this.setState({ dragging_node_list_item: dragging });
  }

  onChangeFileModal(mode: string | null) {
    this.setState({ show_file_modal: mode });
  }

  check_dragging() {
    if (this.state.dragging_node_list_item) {
      this.setState({ dragging_node_list_item: null });
    }
  }

  onMultipleSelectionChange(new_selected_node_names: string[] | null) {
    if (new_selected_node_names !== null) {
      this.setState({
        selected_node: null,
        selected_node_names: new_selected_node_names,
        last_selection_source: "multiple",
      });
      return;
    }
  }

  onSelectedPackageChange(new_selected_package_name: string) {
    this.setState({ last_selected_package: new_selected_package_name });
    return;
  }

  onSelectedStorageFolderChange(new_selected_storage_folder_name: string) {
    this.setState({
      last_selected_storage_folder: new_selected_storage_folder_name,
    });
    return;
  }

  onEditorSelectionChange(new_selected_node_name: string | null) {
    console.log("Selected: " + this.state.selected_node_name);
    console.log("New Selected: " + new_selected_node_name);
    if (
      this.state.node_changed &&
      (new_selected_node_name === null ||
        new_selected_node_name != this.state.selected_node_name)
    ) {
      if (
        window.confirm(
          "Are you sure you wish to discard all changes to the currently edited node?"
        )
      ) {
        // normal behavior, discard all entered data
        this.setState({ node_changed: false });
      } else {
        // do not execute onEditorSelectionChange and keep editing
        return;
      }
    }

    if (new_selected_node_name === null) {
      this.setState({
        selected_node_name: null,
        selected_node: null,
        selected_node_names: [],
        last_selection_source: "editor",
      });
      return;
    }

    const new_selected_node = this.state.last_tree_msg!.nodes.find(
      (x: NodeMsg) => x.name === new_selected_node_name
    );

    if (!new_selected_node) {
      this.setState({
        selected_node_name: null,
        selected_node: null,
        selected_node_names: [],
        last_selection_source: "editor",
      });
      return;
    }

    const doc_node = new_selected_node as DocumentedNode;

    this.setState((prevState) => ({
      selected_node_name: new_selected_node_name,
      copy_node: true,
      selected_node: doc_node,
      selected_node_names: [new_selected_node_name],
      last_selection_source: "editor",
      selected_node_info: prevState.available_nodes.find(
        (x: DocumentedNode) =>
          x.module === new_selected_node.module &&
          x.node_class === new_selected_node.node_class
      ),
    }));
  }

  onNodeChanged(state: boolean) {
    this.setState({ node_changed: state });
  }

  onSelectedEdgeChange(new_selected_edge: NodeDataWiring | null) {
    this.setState({ selected_edge: new_selected_edge });
  }

  handleNodeSearch(e: { target: { value: string } }) {
    if (this.nodes_fuse) {
      const results = this.nodes_fuse.search(e.target.value).map((x) => x.item);
      this.setState({ filtered_nodes: results });
    }

    this.setState({ node_search: e.target.value });

    if (e.target.value === "") {
      this.setState({ filtered_nodes: null });
    }
  }

  onNewRunningCommand(command: TreeExecutionCommands) {
    this.setState(({ running_commands }) => ({
      running_commands: new Set(running_commands).add(command),
    }));
  }

  onRunningCommandCompleted(command: TreeExecutionCommands) {
    this.setState(({ running_commands }) => {
      const new_running_commands = new Set(running_commands);
      new_running_commands.delete(command);

      return {
        running_commands: new_running_commands,
      };
    });
  }

  handleNodeSearchClear(e: { keyCode: number }) {
    if (e.keyCode == 27) {
      // ESC
      this.setState({ node_search: "", filtered_nodes: null });
    }
  }

  render() {
    let selectedNodeComponent = null;

    if (
      this.state.last_selection_source === "multiple" &&
      this.state.selected_node_names.length > 0
    ) {
      selectedNodeComponent = (
        <MultipleSelection
          ros={this.state.ros}
          bt_namespace={this.state.bt_namespace}
          packages={this.packages}
          last_selected_package={this.state.last_selected_package}
          selectedNodeNames={this.state.selected_node_names}
          tree_message={this.state.last_tree_msg}
          packagesFuse={this.packagesFuse!}
          onError={this.onError}
          onSelectionChange={this.onEditorSelectionChange}
          onMultipleSelectionChange={this.onMultipleSelectionChange}
          onSelectedEdgeChange={this.onSelectedEdgeChange}
        />
      );
    } else if (this.state.selected_node === null) {
      selectedNodeComponent = (
        <div className="d-flex flex-column">No Node Selected</div>
      );
    } else if (this.state.last_selection_source === "nodelist") {
      selectedNodeComponent = (
        <NewNode
          ros={this.state.ros}
          bt_namespace={this.state.bt_namespace}
          key={
            this.state.bt_namespace +
            (this.state.selected_node
              ? this.state.selected_node.module +
                this.state.selected_node.node_class
              : "")
          }
          node={this.state.selected_node}
          availableNodes={this.state.available_nodes}
          parents={this.findPossibleParents()}
          messagesFuse={this.messagesFuse!}
          onError={this.onError}
          onNodeChanged={this.onNodeChanged}
          changeCopyMode={this.changeCopyMode}
        />
      );
    } else if (this.state.last_selection_source === "editor") {
      selectedNodeComponent = (
        <SelectedNode
          ros={this.state.ros}
          bt_namespace={this.state.bt_namespace}
          key={
            this.state.bt_namespace +
            (this.state.selected_node ? this.state.selected_node.name : "")
          }
          node={this.state.selected_node}
          nodeInfo={this.state.selected_node_info}
          availableNodes={this.state.available_nodes}
          messagesFuse={this.messagesFuse!}
          onError={this.onError}
          onNodeChanged={this.onNodeChanged}
          changeCopyMode={this.changeCopyMode}
          onEditorSelectionChange={this.onEditorSelectionChange}
        />
      );
    }

    let dragging_cursor = "";
    if (this.state.dragging_node_list_item) {
      dragging_cursor = "cursor-grabbing";
    }

    let nodelist = null;
    let show_nodelist_button = null;
    let main_col = "col scroll-col";
    if (this.state.nodelist_visible) {
      nodelist = (
        <div className="col scroll-col" id="nodelist_container">
          <button
            className="hide_button btn btn-outline-primary btn-sm"
            title="Hide nodelist"
            onClick={() => {
              this.setState(() => ({
                nodelist_visible: false,
              }));
            }}
          >
            <i className="fas fa-angle-double-left show-button-icon"></i>
          </button>
          <div className="available-nodes m-1">
            <PackageLoader
              key={this.state.bt_namespace + "PackageLoader"}
              getNodes={this.getNodes}
            />
            <div className="border rounded">
              <div className="input-group p-2">
                <label htmlFor="nodelist_search" className="input-group-text">
                  Search:
                </label>
                <input
                  id="nodelist_search"
                  type="text"
                  ref={(input) => {
                    this.nameInput = input;
                  }}
                  className="form-control"
                  value={this.state.node_search}
                  onChange={this.handleNodeSearch}
                  onKeyDown={this.handleNodeSearchClear}
                />
              </div>
            </div>
          </div>
          <NodeList
            key={this.state.bt_namespace + this.state.current_time}
            availableNodes={this.state.available_nodes}
            filtered_nodes={this.state.filtered_nodes}
            getNodes={this.getNodes}
            dragging_node_list_item={this.state.dragging_node_list_item}
            onSelectionChange={this.onNodeListSelectionChange}
            onNodeListDragging={this.onNodeListDragging}
          />
        </div>
      );
      main_col = "col-9 scroll-col";
    } else {
      show_nodelist_button = (
        <button
          className="hide_button btn btn-outline-primary btn-sm"
          title="Show nodelist"
          onClick={() => {
            this.setState(() => ({
              nodelist_visible: true,
            }));
          }}
        >
          <i className="fas fa-angle-double-right show-button-icon"></i>
        </button>
      );
    }

    let toggle_ui_visibility_text = "Hide User Interface";
    let execution_bar = null;
    if (this.state.executionbar_visible) {
      execution_bar = (
        <ExecutionBar
          key={this.state.bt_namespace + "ExecutionBar"}
          ros={this.state.ros}
          ros_url={this.state.ros_uri}
          connected={this.state.connected}
          packages_available={this.state.packages_available}
          messages_available={this.state.messages_available}
          subtreeNames={this.state.subtree_names}
          currentNamespace={this.state.bt_namespace}
          tree_message={this.state.last_tree_msg}
          onSelectedTreeChange={this.onSelectedTreeChange}
          onNamespaceChange={this.onNamespaceChange}
          onError={this.onError}
          runningCommands={this.state.running_commands}
          onNewRunningCommand={this.onNewRunningCommand}
          onRunningCommandCompleted={this.onRunningCommandCompleted}
          onPublishingSubtreesChange={this.onPublishingSubtreesChange}
          onChangeFileModal={this.onChangeFileModal}
        />
      );
    } else {
      toggle_ui_visibility_text = "Show User Interface";
    }

    let tree_name = "";
    let tree_state = "UNKNOWN";
    if (this.state.last_tree_msg) {
      tree_name = this.state.last_tree_msg.name;
      tree_state = this.state.last_tree_msg.state;
    }

    const modal_style: ReactModal.Styles = {
      overlay: {
        zIndex: 1050,
      },
    };

    let modal_content = null;
    console.log(this.state.show_file_modal);
    if (this.state.show_file_modal === "save") {
      modal_content = (
        <SaveFileBrowser
          ros={this.state.ros}
          bt_namespace={this.state.bt_namespace}
          onError={this.onError}
          tree_message={this.state.last_tree_msg}
          last_selected_folder={this.state.last_selected_storage_folder}
          onChangeFileModal={this.onChangeFileModal}
          onSelectedStorageFolderChange={this.onSelectedStorageFolderChange}
        />
      );
    } else if (this.state.show_file_modal === "load") {
      modal_content = (
        <LoadPackageFileBrowser
          ros={this.state.ros}
          bt_namespace={this.state.bt_namespace}
          packagesFuse={this.packagesFuse!}
          packages_available={this.state.packages_available}
          onError={this.onError}
          tree_message={this.state.last_tree_msg}
          last_selected_package={this.state.last_selected_package}
          onChangeFileModal={this.onChangeFileModal}
          onSelectedPackageChange={this.onSelectedPackageChange}
        />
      );
    } else if (this.state.show_file_modal === "load_file") {
      modal_content = (
        <LoadFileBrowser
          ros={this.state.ros}
          bt_namespace={this.state.bt_namespace}
          onError={this.onError}
          tree_message={this.state.last_tree_msg}
          last_selected_folder={this.state.last_selected_storage_folder}
          onChangeFileModal={this.onChangeFileModal}
          onSelectedStorageFolderChange={this.onSelectedStorageFolderChange}
        />
      );
    }

    return (
      <div onMouseUp={this.check_dragging} className={dragging_cursor}>
        <ReactModal
          key={this.state.bt_namespace + "ReactModal"}
          isOpen={this.state.show_file_modal !== null}
          style={modal_style}
        >
          {modal_content}
        </ReactModal>
        {execution_bar}
        <div className="container-fluid">
          <div className="row row-height">
            {nodelist}
            <div className={main_col} id="main_pane">
              {show_nodelist_button}
              <div className="container-fluid d-flex h-100 flex-column">
                <div className="row">
                  <div className="col d-flex align-items-center">
                    <SelectTree
                      key={this.state.bt_namespace + "SelectTree"}
                      ros={this.state.ros}
                      bt_namespace={this.state.bt_namespace}
                      subtreeNames={this.state.subtree_names}
                      selected_tree={this.state.selected_tree}
                      onSelectedTreeChange={this.onSelectedTreeChange}
                      onError={this.onError}
                    />
                    <button
                      className="btn btn-primary m-1"
                      onClick={() => {
                        this.setState((prevstate: AppState) => ({
                          showDataGraph: !prevstate.showDataGraph,
                        }));
                      }}
                    >
                      Toggle Data Graph
                    </button>
                    <button
                      className="btn btn-primary m-1"
                      onClick={() => {
                        this.setState((prevstate: AppState) => ({
                          executionbar_visible: !prevstate.executionbar_visible,
                          nodelist_visible: !prevstate.executionbar_visible,
                        }));
                      }}
                    >
                      {toggle_ui_visibility_text}
                    </button>
                    <div className="d-flex flex-row align-items-center">
                      <label
                        className="form-label m-1 ml-2"
                        htmlFor="treeNameForm"
                      >
                        Name:
                      </label>
                      <input
                        id="treeNameForm"
                        className="form-control ml-1"
                        type="text"
                        disabled={true}
                        value={tree_name}
                      />
                    </div>
                    <div className="d-flex flex-row align-items-center">
                      <label
                        className="form-label m-1 ml-2"
                        htmlFor="treeStateForm"
                      >
                        State:
                      </label>
                      <input
                        id="treeStateForm"
                        className="form-control ml-1"
                        type="text"
                        disabled={true}
                        value={tree_state}
                      />
                    </div>
                    <Spacer />
                    <SelectEditorSkin changeSkin={this.changeSkin} />
                  </div>
                </div>
                <div className="row edit_canvas h-100 pb-2">
                  <div className="col p-0">
                    <D3BehaviorTreeEditor
                      key={this.state.bt_namespace + "BTEditor"}
                      ros={this.state.ros}
                      bt_namespace={this.state.bt_namespace}
                      tree_message={this.state.last_tree_msg}
                      subtree_names={this.state.subtree_names}
                      publishing_subtrees={this.state.publishing_subtrees}
                      dragging_node_list_item={
                        this.state.dragging_node_list_item
                      }
                      onSelectionChange={this.onEditorSelectionChange}
                      onMultipleSelectionChange={this.onMultipleSelectionChange}
                      selectedNodeNames={this.state.selected_node_names}
                      onSelectedEdgeChange={this.onSelectedEdgeChange}
                      showDataGraph={this.state.showDataGraph}
                      onSelectedTreeChange={this.onSelectedTreeChange}
                      onNodeListDragging={this.onNodeListDragging}
                      onError={this.onError}
                      skin={this.state.skin}
                    />
                  </div>
                </div>
                <div className="row maxh50">
                  <div className="col pl-0">{selectedNodeComponent}</div>
                  <div className="col">
                    <div className="row pt-0 pl-0 pr-0">
                      {this.state.selected_edge ? (
                        <BehaviorTreeEdge
                          edge={this.state.selected_edge}
                          key={this.state.bt_namespace + "BTEdge"}
                          ros={this.state.ros}
                          bt_namespace={this.state.bt_namespace}
                          onSelectionChange={this.onEditorSelectionChange}
                          unsetSelectedEdge={() =>
                            this.setState({ selected_edge: null })
                          }
                          onError={this.onError}
                        />
                      ) : (
                        <div className="d-flex flex-column">
                          No Edge Selected
                        </div>
                      )}
                    </div>
                    <div className="row output_log pl-0">
                      <ErrorHistory
                        history={this.state.error_history}
                        sorting_asc={this.state.error_history_sorting_asc}
                        clearErrors={this.onClearErrors}
                        changeSorting={this.onChangeErrorHistorySorting}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default RosBtPyApp;
