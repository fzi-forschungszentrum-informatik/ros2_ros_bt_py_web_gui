import React, { ChangeEvent, Component } from "react";
import { EditableNode } from "./EditableNode";
import {
  DocumentedNode,
  Message,
  NodeData,
  NodeMsg,
  ParamData,
  PyEnum,
  PyLogger,
  PyOperand,
  PyOperator,
  ValueTypes,
} from "../types/types";
import ROSLIB from "roslib";
import Fuse from "fuse.js";
import {
  SetOptionsRequest,
  SetOptionsResponse,
} from "../types/services/SetOptions";
import {
  RemoveNodeRequest,
  RemoveNodeResponse,
} from "../types/services/RemoveNode";
import {
  MorphNodeRequest,
  MorphNodeResponse,
} from "../types/services/MorphNode";
import {
  getDefaultValue,
  prettyprint_type,
  python_builtin_types,
} from "../utils";

interface SelectedNodeProps {
  ros: ROSLIB.Ros;
  bt_namespace: string;
  node: NodeMsg;
  nodeInfo: DocumentedNode | undefined;
  availableNodes: DocumentedNode[];
  messagesFuse: Fuse<Message>;
  onError: (error_msg: string) => void;
  onNodeChanged: (state: boolean) => void;
  changeCopyMode: (mode: boolean) => void;
  onEditorSelectionChange: (new_selected_node_name: string | null) => void;
}

interface SelectedNodeState {
  name: string;
  node_class: string;
  module: string;
  isValid: boolean;
  options: ParamData[];
  inputs: ParamData[];
  outputs: ParamData[];
  isMorphed: boolean;
}

export class SelectedNode extends Component<
  SelectedNodeProps,
  SelectedNodeState
> {
  set_options_service?: ROSLIB.Service<SetOptionsRequest, SetOptionsResponse>;
  remove_node_service?: ROSLIB.Service<RemoveNodeRequest, RemoveNodeResponse>;
  morph_node_service?: ROSLIB.Service<MorphNodeRequest, MorphNodeResponse>;
  constructor(props: SelectedNodeProps) {
    super(props);

    const getValues = (x: NodeData) => {
      const type = prettyprint_type(x.serialized_type);
      let json_value = JSON.parse(x.serialized_value);
      if (type === "type") {
        json_value = json_value["py/type"]
          .replace("__builtin__.", "")
          .replace("builtins.", "");
      }
      return {
        key: x.key,
        value: {
          type: type
            .replace(/^basestring$/, "string")
            .replace(/^str$/, "string")
            .replace(/^unicode$/, "string"),
          value: json_value,
        },
      } as ParamData;
    };
    if (props.node) {
      this.state = {
        name: props.node.name,
        node_class: props.node.node_class,
        module: props.node.module,
        isValid: true,
        options: props.node.options.map(getValues),
        inputs: props.node.inputs.map(getValues),
        outputs: props.node.outputs.map(getValues),
        isMorphed: false,
      };
    } else {
      this.state = {
        name: "",
        node_class: "",
        module: "",
        isValid: false,
        options: [],
        inputs: [],
        outputs: [],
        isMorphed: false,
      };
    }

    this.nameChangeHandler = this.nameChangeHandler.bind(this);
    this.nodeClassChangeHandler = this.nodeClassChangeHandler.bind(this);
    this.updateValidity = this.updateValidity.bind(this);
    this.updateValue = this.updateValue.bind(this);
    this.onClickDelete = this.onClickDelete.bind(this);
    this.onClickDeleteWithChildren = this.onClickDeleteWithChildren.bind(this);
    this.onClickUpdate = this.onClickUpdate.bind(this);
    this.updateNode = this.updateNode.bind(this);
  }

  componentDidMount() {
    this.set_options_service = new ROSLIB.Service({
      ros: this.props.ros,
      name: this.props.bt_namespace + "set_options",
      serviceType: "ros_bt_py_interfaces/srv/SetOptions",
    });

    this.remove_node_service = new ROSLIB.Service({
      ros: this.props.ros,
      name: this.props.bt_namespace + "remove_node",
      serviceType: "ros_bt_py_interfaces/srv/RemoveNode",
    });

    this.morph_node_service = new ROSLIB.Service({
      ros: this.props.ros,
      name: this.props.bt_namespace + "morph_node",
      serviceType: "ros_bt_py_interfaces/srv/MorphNode",
    });
  }

  nameChangeHandler(event: ChangeEvent<HTMLInputElement>) {
    this.props.onNodeChanged(true);
    this.setState({ name: event.target.value });
  }

  nodeClassChangeHandler(event: ChangeEvent<HTMLSelectElement>) {
    const flowControlNode = this.props.availableNodes.filter(function (item) {
      return (
        item.max_children == -1 &&
        item.module + item.node_class == event.target.value
      );
    });

    if (flowControlNode && flowControlNode.length == 1) {
      const selectedFlowControlNode: DocumentedNode = flowControlNode[0];

      this.setState({
        node_class: selectedFlowControlNode.node_class,
        module: selectedFlowControlNode.module,
        options: this.getDefaultValues(selectedFlowControlNode.options),
        inputs: this.getDefaultValues(
          selectedFlowControlNode.inputs,
          selectedFlowControlNode.options
        ),
        outputs: this.getDefaultValues(
          selectedFlowControlNode.outputs,
          selectedFlowControlNode.options
        ),
        isMorphed: true,
      });
    }
  }

  buildNodeMessage(): NodeMsg {
    return {
      module: this.state.module,
      node_class: this.state.node_class,
      name: this.props.node.name,
      options: this.state.options.map((x) => {
        const option: NodeData = {
          key: x.key,
          serialized_value: "",
          serialized_type: "",
        };
        if (x.value.type === "type") {
          if (python_builtin_types.indexOf(x.value.value as string) >= 0) {
            x.value.value = "__builtin__." + x.value.value;
            //x.value.value = 'builtins.' + x.value.value;
          }
          option.serialized_value = JSON.stringify({
            "py/type": x.value.value,
          });
        } else if (x.value.type.startsWith("__")) {
          const val = x.value.value as
            | PyLogger
            | PyOperator
            | PyOperand
            | PyEnum;
          val["py/object"] = x.value.type.substring("__".length);
          option.serialized_value = JSON.stringify(x.value.value);
        } else {
          option.serialized_value = JSON.stringify(x.value.value);
        }
        return option;
      }),
      inputs: [],
      outputs: [],
      max_children: 0,
      child_names: [],
      version: "",
      state: "",
    } as NodeMsg;
  }

  getDefaultValues(paramList: NodeData[], options: NodeData[] = []) {
    options = options || [];

    return paramList.map((x) => {
      return {
        key: x.key,
        value: getDefaultValue(prettyprint_type(x.serialized_value), options),
      } as ParamData;
    });
  }

  onClickDelete(_event: React.MouseEvent<HTMLButtonElement>) {
    if (!window.confirm("Really delete node " + this.props.node.name + "?")) {
      // Do nothing if user doesn't confirm
      return;
    }
    if (this.remove_node_service === undefined) {
      console.error("Remove node service is undefined!");
      return;
    }
    this.remove_node_service.callService(
      {
        node_name: this.props.node.name,
        remove_children: false,
      } as RemoveNodeRequest,
      (response: RemoveNodeResponse) => {
        if (response.success) {
          console.log("Removed node!");
          this.props.onEditorSelectionChange(null);
        } else {
          this.props.onError(
            "Failed to remove node " +
              this.props.node.name +
              ": " +
              response.error_message
          );
        }
      }
    );
  }

  onClickDeleteWithChildren(_event: React.MouseEvent<HTMLButtonElement>) {
    if (
      !window.confirm(
        "Really delete node " +
          this.props.node.name +
          " and all of its children?"
      )
    ) {
      // Do nothing if user doesn't confirm
      return;
    }
    if (this.remove_node_service === undefined) {
      console.error("Remove node service is undefined!");
      return;
    }
    this.remove_node_service.callService(
      {
        node_name: this.props.node.name,
        remove_children: true,
      } as RemoveNodeRequest,
      (response: RemoveNodeResponse) => {
        if (response.success) {
          console.log("Removed node!");
          this.props.onEditorSelectionChange(null);
        } else {
          this.props.onError(
            "Failed to remove node " +
              this.props.node.name +
              ": " +
              response.error_message
          );
        }
      }
    );
  }

  onClickUpdate(_event: React.MouseEvent<HTMLButtonElement>) {
    if (this.state.isMorphed) {
      console.log("morphing node");
      const msg = this.buildNodeMessage();
      if (this.morph_node_service === undefined) {
        console.error("Morph node service is undefined!");
        return;
      }
      this.morph_node_service.callService(
        {
          node_name: this.props.node.name,
          new_node: msg,
        } as MorphNodeRequest,
        (response: MorphNodeResponse) => {
          if (response.success) {
            console.log("Morphed node in tree");
            this.setState({ isMorphed: false });
            this.updateNode();
          } else {
            this.props.onError(
              "Failed to morph node " +
                this.state.name +
                ": " +
                response.error_message
            );
          }
        }
      );
    } else {
      this.updateNode();
    }
  }

  updateNode() {
    console.log("updating node");
    if (this.set_options_service === undefined) {
      console.error("SetOptions service is undefined!");
      return;
    }
    this.set_options_service.callService(
      {
        node_name: this.props.node.name,
        rename_node: true,
        new_name: this.state.name,
        options: this.state.options.map((x) => {
          const option = {
            key: x.key,
            serialized_value: "",
          };
          if (x.value.type === "type") {
            if (python_builtin_types.indexOf(x.value.value as string) >= 0) {
              x.value.value = ("__builtin__." + x.value.value) as string;
            }
            option.serialized_value = JSON.stringify({
              "py/type": x.value.value,
            });
          } else if (x.value.type.startsWith("__")) {
            const val = x.value.value as
              | PyOperand
              | PyLogger
              | PyOperator
              | PyOperand
              | PyEnum;
            val["py/object"] = x.value.type.substring("__".length);
            option.serialized_value = JSON.stringify(val);
          } else {
            option.serialized_value = JSON.stringify(x.value.value);
          }
          return option;
        }),
      } as SetOptionsRequest,
      (response: SetOptionsResponse) => {
        if (response.success) {
          console.log("Updated node!");
          this.props.onNodeChanged(false);
          this.props.onEditorSelectionChange(this.state.name); // FIXME: is there a more elegant way for the "update" case?
        } else {
          this.props.onError(
            "Failed to update node " +
              this.props.node.name +
              ": " +
              response.error_message
          );
        }
      }
    );
  }

  render() {
    return (
      <div className="d-flex flex-column">
        <div className="btn-group d-flex mb-2" role="group">
          <button
            className="btn btn-primary w-30"
            disabled={!this.state.isValid}
            onClick={this.onClickUpdate}
          >
            Update Node
          </button>
          <button className="btn btn-danger w-35" onClick={this.onClickDelete}>
            Delete Node
          </button>
          <button
            className="btn btn-danger w-35"
            onClick={this.onClickDeleteWithChildren}
          >
            Delete Node + Children
          </button>
        </div>
        <EditableNode
          ros={this.props.ros}
          bt_namespace={this.props.bt_namespace}
          key={
            this.props.node.module +
            this.props.node.node_class +
            this.props.node.name
          }
          name={this.state.name}
          nodeClass={this.state.node_class}
          module={this.state.module}
          availableNodes={this.props.availableNodes}
          changeCopyMode={this.props.changeCopyMode}
          messagesFuse={this.props.messagesFuse}
          updateValidity={this.updateValidity}
          updateValue={this.updateValue}
          nameChangeHandler={this.nameChangeHandler}
          nodeClassChangeHandler={this.nodeClassChangeHandler}
          options={this.state.options}
          inputs={this.state.inputs}
          outputs={this.state.outputs}
        />
      </div>
    );
  }

  updateValidity(newValidity: boolean) {
    this.props.onNodeChanged(true);
    this.setState({ isValid: newValidity || false });
  }

  updateValue(paramType: string, key: string, new_value: ValueTypes) {
    this.props.onNodeChanged(true);
    const map_fun = function (x: ParamData) {
      if (x.key === key) {
        return {
          key: key,
          value: {
            type: x.value.type,
            value: new_value,
          },
        };
      } else {
        return x;
      }
    };

    if (paramType.toLowerCase() === "options") {
      // All of these are lists containing lists of [key, ref_key]
      //
      // That is, if options = { foo : int, bar : OptionRef(foo) }
      // ref_keys will be [[bar, foo]]
      if (this.props.nodeInfo === undefined) {
        console.error("Node info is null!");
        return;
      }
      const ref_keys = this.props.nodeInfo.options
        .filter((x) =>
          prettyprint_type(x.serialized_value).startsWith("OptionRef(")
        )
        .map((x) => [
          x.key,
          prettyprint_type(x.serialized_value).substring(
            "OptionRef(".length,
            prettyprint_type(x.serialized_value).length - 1
          ),
        ])
        .filter((x) => x[1] === key);
      const input_option_ref_keys = this.props.nodeInfo.inputs
        .filter((x) =>
          prettyprint_type(x.serialized_value).startsWith("OptionRef(")
        )
        .map((x) => [
          x.key,
          prettyprint_type(x.serialized_value).substring(
            "OptionRef(".length,
            prettyprint_type(x.serialized_value).length - 1
          ),
        ])
        .filter((x) => x[1] === key);
      const output_option_ref_keys = this.props.nodeInfo.inputs
        .filter((x) =>
          prettyprint_type(x.serialized_value).startsWith("OptionRef(")
        )
        .map((x) => [
          x.key,
          prettyprint_type(x.serialized_value).substring(
            "OptionRef(".length,
            prettyprint_type(x.serialized_value).length - 1
          ),
        ])
        .filter((x) => x[1] === key);
      this.setState((prevState, _props) => {
        // Replace the option value
        const new_options = prevState.options.map(map_fun);

        // update the options in our state that are references to
        // the changed key - this will discard any values entered
        // already, but they'd be incompatible anyway

        const resolve_refs = (current_item: ParamData) => {
          // See if the current option references the changed key
          const refData = ref_keys.find((ref) => ref[0] === current_item.key)!;
          if (refData) {
            // If it does, find the type of the referred key
            const optionType = new_options.find(
              (opt) => opt.key === refData[1]
            );
            if (optionType) {
              const opt_value = optionType.value.value as string;
              // Get a default value for the type indicated by the
              // referenced option
              return {
                key: current_item.key,
                value: getDefaultValue(
                  opt_value.replace("__builtin__.", "").replace("builtins.", "")
                ),
              };
            }
          }
          return current_item;
        };

        const resolved_options = new_options.map(resolve_refs);
        const newState: {
          options: ParamData[];
          inputs: ParamData[];
          outputs: ParamData[];
        } = { options: resolved_options, inputs: [], outputs: [] };
        // if there's inputs or outputs that reference the changed
        // option key, update them too (this is just for display
        // and won't change anything in the backend)
        if (input_option_ref_keys.length > 0) {
          newState.inputs = prevState.inputs.map(resolve_refs);
        }
        if (output_option_ref_keys.length > 0) {
          newState.outputs = prevState.outputs.map(resolve_refs);
        }
        return newState;
      });
    } else if (paramType.toLowerCase() === "inputs") {
      this.setState((prevState, _props) => {
        return { inputs: prevState.inputs.map(map_fun) };
      });
    } else if (paramType.toLowerCase() === "outputs") {
      this.setState((prevState, _props) => {
        return { outputs: prevState.outputs.map(map_fun) };
      });
    }
  }
}
