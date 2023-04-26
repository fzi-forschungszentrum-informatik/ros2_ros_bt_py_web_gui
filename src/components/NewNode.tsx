import { ChangeEvent, Component } from "react";
import { EditableNode } from "./EditableNode";
import { DocumentedNode, Message, NodeData, NodeMsg } from "../types/types";
import Fuse from "fuse.js";
import {
  getDefaultValue,
  prettyprint_type,
  python_builtin_types,
} from "../utils";
import React from "react";
import ROSLIB from "roslib";
import { AddNodeRequest, AddNodeResponse } from "../types/services/AddNode";

export interface NewNodeProps {
  ros: ROSLIB.Ros;
  bt_namespace: string;
  node: DocumentedNode;
  availableNodes: DocumentedNode[];
  parents: NodeMsg[];
  messagesFuse: Fuse<Message> | undefined;
  onError: (error_message: string) => void;
  onNodeChanged: (state: boolean) => void;
  changeCopyMode: (state: boolean) => void;
}

interface ParamData {
  key: string;
  value: { type: string; value: any };
}

export interface NewNodeState {
  name: string;
  isValid: boolean;
  options: ParamData[];
  inputs: ParamData[];
  outputs: ParamData[];
}

export class NewNode extends Component<NewNodeProps, NewNodeState> {
  add_node_service: ROSLIB.Service<AddNodeRequest, AddNodeResponse>;
  selectRef: React.RefObject<HTMLSelectElement>;
  constructor(props: NewNodeProps) {
    super(props);

    if (props.node) {
      const options_list = this.getDefaultValues(props.node.options);

      // reparse unset_optionrefs
      this.state = {
        name: props.node.name,
        isValid: true,
        options: options_list.map((x) => {
          if (x.value.type === "unset_optionref") {
            const optionTypeName = x.value.value.substring(
              'Ref to "'.length,
              x.value.value.length - 1
            );
            const optionType = this.state.options.find((x) => {
              return x.key === optionTypeName;
            });
            if (optionType && optionType.value) {
              return {
                key: x.key,
                value: getDefaultValue(optionType.value.value),
              };
            }
          }
          return {
            key: x.key,
            value: x.value,
          } as ParamData;
        }),
        inputs: this.getDefaultValues(props.node.inputs, props.node.options),
        outputs: this.getDefaultValues(props.node.outputs, props.node.outputs),
      };
    } else {
      this.state = {
        name: "",
        isValid: false,
        options: [],
        inputs: [],
        outputs: [],
      };
    }
    this.add_node_service = new ROSLIB.Service({
      ros: props.ros,
      name: props.bt_namespace + "add_node",
      serviceType: "ros_bt_py_msgs/AddNode",
    });

    this.selectRef = React.createRef();

    this.nameChangeHandler = this.nameChangeHandler.bind(this);
    this.updateValidity = this.updateValidity.bind(this);
    this.updateValue = this.updateValue.bind(this);
    this.onClickAdd = this.onClickAdd.bind(this);
  }

  render() {
    return (
      <div className="d-flex flex-column">
        <button
          className="btn btn-block btn-primary"
          disabled={!this.state.isValid}
          onClick={this.onClickAdd}
        >
          Add to Tree
        </button>
        <label className="pt-2 pb-2">
          Parent
          <select
            className="custom-select d-block"
            disabled={this.props.parents.length == 0}
            ref={this.selectRef}
            defaultValue={
              this.props.parents.length > 0
                ? this.props.parents[0].name
                : undefined
            }
          >
            {this.props.parents.map((x) => (
              <option key={x.name} value={x.name}>
                {x.name}
              </option>
            ))}
          </select>
        </label>
        <EditableNode
          ros={this.props.ros}
          bt_namespace={this.props.bt_namespace}
          key={
            this.props.node.module +
            this.props.node.node_class +
            this.props.node.name
          }
          name={this.state.name}
          nodeClass={this.props.node.node_class}
          module={this.props.node.module}
          availableNodes={this.props.availableNodes}
          doc={this.props.node.doc}
          changeCopyMode={this.props.changeCopyMode}
          messagesFuse={this.props.messagesFuse}
          updateValidity={this.updateValidity}
          updateValue={this.updateValue}
          nameChangeHandler={this.nameChangeHandler}
          options={this.state.options}
          inputs={this.state.inputs}
          outputs={this.state.outputs}
          nodeClassChangeHandler={(event) => {}}
        />
      </div>
    );
  }

  updateValidity(newValidity: boolean) {
    this.setState({ isValid: newValidity || false });
  }

  onClickAdd() {
    this.props.onNodeChanged(false);
    const msg = this.buildNodeMessage();
    console.log("trying to add node to tree:");
    console.log(msg);
    this.add_node_service.callService(
      {
        parent_name: this.selectRef.current!.value || "",
        node: msg,
        allow_rename: true,
      } as AddNodeRequest,
      (response: AddNodeResponse) => {
        if (response.success) {
          console.log("Added node to tree as " + response.actual_node_name);
        } else {
          this.props.onError(
            "Failed to add node " +
              this.state.name +
              ": " +
              response.error_message
          );
        }
      }
    );
  }

  buildNodeMessage(): NodeMsg {
    return {
      module: this.props.node.module,
      node_class: this.props.node.node_class,
      name: this.state.name,
      options: this.state.options.map((x) => {
        const option: NodeData = {
          key: x.key,
          serialized_value: "",
          serialized_type: "",
        };
        if (x.value.type === "type") {
          if (python_builtin_types.indexOf(x.value.value) >= 0) {
            x.value.value = "__builtin__." + x.value.value;
          }
          option.serialized_value = JSON.stringify({
            "py/type": x.value.value,
          });
        } else if (x.value.type.startsWith("__")) {
          x.value.value["py/object"] = x.value.type.substring("__".length);
          option.serialized_value = JSON.stringify(x.value.value);
        } else {
          option.serialized_value = JSON.stringify(x.value.value);
        }
        return option;
      }),
      child_names: [],
      inputs: [],
      outputs: [],
      version: "",
      max_children: 0,
      state: "",
    };
  }

  nameChangeHandler(event: ChangeEvent<HTMLInputElement>) {
    this.props.onNodeChanged(true);
    this.setState({ name: event.target.value });
  }

  updateValue(paramType: string, key: string, new_value: any) {
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
      const ref_keys = this.props.node.options
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
      this.setState((prevState, props) => {
        const new_options = prevState.options.map(map_fun);
        // update the options in our state that are references to
        // the changed key - this will discard any values entered
        // already, but they'd be incompatible anyway

        const resolved_options = new_options.map((x) => {
          const refData = ref_keys.find((ref) => ref[0] === x.key);
          if (refData !== undefined && refData.length > 1) {
            const optionType = new_options.find(
              (opt) => opt.key === refData![1]
            );
            if (optionType) {
              return {
                key: x.key,
                value: getDefaultValue(
                  optionType.value.value
                    .replace("__builtin__.", "")
                    .replace("builtins.", "")
                ),
              };
            }
          }
          return x;
        });
        return { options: resolved_options };
      });
    } else if (paramType.toLowerCase() === "inputs") {
      this.setState((prevState, props) => {
        return { inputs: prevState.inputs.map(map_fun) };
      });
    } else if (paramType.toLowerCase() === "outputs") {
      this.setState((prevState, props) => {
        return { outputs: prevState.outputs.map(map_fun) };
      });
    }
  }

  getDefaultValues(paramList: NodeData[], options?: NodeData[] | null) {
    options = options || [];

    return paramList.map((x) => {
      return {
        key: x.key,
        value: getDefaultValue(prettyprint_type(x.serialized_value), options),
      };
    });
  }
}
