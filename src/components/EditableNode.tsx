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
import React, { ChangeEvent, Fragment } from "react";
import { Component } from "react";
import ROSLIB from "roslib";
import { DropDown } from "./DropDown";
import { EnumDropDown } from "./EnumDropDown";
import { JSONInput } from "./JSONInput";
import { MathBinaryOperatorDropDown } from "./MathBinaryOperatorDropDown";
import { MathOperandTypeDropDown } from "./MathOperandTypeDropDown";
import { MathUnaryOperandTypeDropDown } from "./MathUnaryOperandTypeDropDown";
import { MathUnaryOperatorDropDown } from "./MathUnaryOperatorDropDown";
import {
  GetMessageFieldsRequest,
  GetMessageFieldsResponse,
} from "../types/services/GetMessageFields";
import {
  DocumentedNode,
  Message,
  NodeData,
  ParamData,
  PyEnum,
  ValueTypes,
} from "../types/types";

import Fuse from "fuse.js";
import {
  getDefaultValue,
  getMessageType,
  getShortDoc,
  prettyprint_type,
  python_builtin_types,
  uuid,
} from "../utils";

interface EditableNodeProps {
  ros: ROSLIB.Ros;
  bt_namespace: string;
  name: string;
  nodeClass: string;
  module: string;
  availableNodes: DocumentedNode[];
  changeCopyMode: (mode: boolean) => void;
  messagesFuse: Fuse<Message> | undefined;
  updateValidity: (newValidity: boolean) => void;
  updateValue: (paramType: string, key: string, new_value: ValueTypes) => void;
  nameChangeHandler: (event: ChangeEvent<HTMLInputElement>) => void;
  nodeClassChangeHandler: (event: ChangeEvent<HTMLSelectElement>) => void;
  options: ParamData[];
  inputs: ParamData[];
  outputs: ParamData[];
  doc?: string;
}
interface EditableNodeState {
  selected_message: Message | null;
  messages_results: Message[];
  results_at_key: string | null;
}

export class EditableNode extends Component<
  EditableNodeProps,
  EditableNodeState
> {
  jsonRef: React.RefObject<unknown>;
  get_message_fields_service: ROSLIB.Service<
    GetMessageFieldsRequest,
    GetMessageFieldsResponse
  >;
  get_message_constant_fields_service: ROSLIB.Service<
    GetMessageFieldsRequest,
    GetMessageFieldsResponse
  >;
  node?: HTMLDivElement | null;

  constructor(props: EditableNodeProps) {
    super(props);
    this.state = {
      messages_results: [],
      results_at_key: null,
      selected_message: null,
    };

    this.onFocus = this.onFocus.bind(this);

    this.jsonRef = React.createRef();

    this.handleOptionWirings = this.handleOptionWirings.bind(this);
    this.selectMessageResult = this.selectMessageResult.bind(this);

    this.get_message_fields_service = new ROSLIB.Service({
      ros: props.ros,
      name: props.bt_namespace + "get_message_fields",
      serviceType: "ros_bt_py_interfaces/srv/GetMessageFields",
    });

    this.get_message_constant_fields_service = new ROSLIB.Service({
      ros: props.ros,
      name: props.bt_namespace + "get_message_constant_fields",
      serviceType: "ros_bt_py_interfaces/srv/GetMessageFields",
    });
  }

  selectMessageResult(result: Message) {
    this.setState({ messages_results: [], selected_message: result });
  }

  renderSearchResults(
    results: Message[],
    key: string,
    onNewValue: (new_value: ValueTypes) => void
  ) {
    if (results.length > 0 && this.state.results_at_key === key) {
      const result_rows = results.map((x) => {
        const onClickHandler = () => {
          const type_names = x.msg.split(".");

          if (type_names.length >= 3) {
            const full_type_name = type_names.slice(0, 3).join(".");

            if (
              (this.props.nodeClass === "Action" ||
                this.props.nodeClass === "ActionWithDebug") &&
              this.props.module === "ros_bt_py.ros_nodes.action"
            ) {
              const action_types: {
                action_type: string;
                feedback_type: string;
                goal_type: string;
                result_type: string;
              } = {
                action_type: "",
                feedback_type: ".Feedback",
                goal_type: ".Goal",
                result_type: ".Result",
              };

              for (const action_type in action_types) {
                const updated_value =
                  full_type_name +
                  action_types[action_type as keyof typeof action_types];

                if (key !== action_type) {
                  this.updateValue("options", action_type, updated_value);
                }
              }
            } else if (
              (this.props.nodeClass === "Service" ||
                this.props.nodeClass === "ServiceInput") &&
              this.props.module === "ros_bt_py.ros_nodes.service"
            ) {
              const service_types = {
                service_type: "",
                request_type: ".Request",
                response_type: ".Response",
              };

              for (const service_type in service_types) {
                const updated_value =
                  full_type_name +
                  service_types[service_type as keyof typeof service_types];
                if (key !== service_type) {
                  this.updateValue("options", service_type, updated_value);
                }
              }
            }
          }

          this.selectMessageResult(x);
          onNewValue(x.msg);
        };

        return (
          <div
            className="list-group-item search-result"
            onClick={() => {
              let replace_regex;
              let type_name;
              if (
                this.props.nodeClass === "Action" &&
                this.props.module === "ros_bt_py.nodes.action"
              ) {
                const action_types: {
                  action_type: string;
                  feedback_type: string;
                  goal_type: string;
                  result_type: string;
                } = {
                  action_type: "Action",
                  feedback_type: "Feedback",
                  goal_type: "Goal",
                  result_type: "Result",
                };

                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                type_name = x.msg.split(".").pop()!;
                const action_name = type_name.replace(
                  action_types[key as keyof typeof action_types],
                  ""
                );
                replace_regex = new RegExp(type_name, "g");
                for (const action_type in action_types) {
                  if (key !== action_type) {
                    this.updateValue(
                      "options",
                      action_type,
                      x.msg.replace(
                        replace_regex,
                        action_name +
                          action_types[action_type as keyof typeof action_types]
                      )
                    );
                  }
                }
              } else if (
                (this.props.nodeClass === "Service" ||
                  this.props.nodeClass === "ServiceInput") &&
                this.props.module === "ros_bt_py.nodes.service"
              ) {
                const service_types = {
                  service_type: "",
                  request_type: "Request",
                  response_type: "Response",
                };
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                type_name = x.msg.split(".").pop()!;
                const service_name = type_name.replace(
                  service_types[key as keyof typeof service_types],
                  ""
                );
                replace_regex = new RegExp(type_name + "$");
                for (const service_type in service_types) {
                  if (key !== service_type) {
                    this.updateValue(
                      "options",
                      service_type,
                      x.msg.replace(
                        replace_regex,
                        service_name +
                          service_types[
                            service_type as keyof typeof service_types
                          ]
                      )
                    );
                  }
                }
              }
              this.selectMessageResult(x);
              onNewValue(x.msg);
            }}
          >
            {x.msg}
          </div>
        );
      });

      return (
        <div className="mb-2 search-results" ref={(node) => (this.node = node)}>
          <div className="list-group">{result_rows}</div>
        </div>
      );
    } else {
      return null;
    }
  }

  componentDidMount() {
    document.addEventListener("click", this.handleClick);
  }

  handleClick = (event: MouseEvent) => {
    const target = event.target as
      | HTMLDivElement
      | HTMLInputElement
      | HTMLParagraphElement
      | HTMLButtonElement
      | HTMLHeadingElement;
    if (this.node && !this.node.contains(target)) {
      this.setState({ messages_results: [] });
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onFocus(_event: React.FocusEvent) {
    this.props.changeCopyMode(false);
  }

  render() {
    const compareKeys = function (a: ParamData, b: ParamData) {
      if (a.key === b.key) {
        return 0;
      }
      if (a.key < b.key) {
        return -1;
      }
      return 1;
    };

    let node_class_name: string | JSX.Element = this.props.nodeClass;
    if (this.props.availableNodes != null) {
      // get the flow control nodes
      const flowControlNodes = this.props.availableNodes.filter(function (
        item
      ) {
        return item.max_children == -1;
      });

      const module = this.props.module;
      const node_class = this.props.nodeClass;

      const currentFlowControlType = flowControlNodes.filter(function (item) {
        return item.module == module && item.node_class == node_class;
      });

      if (currentFlowControlType.length > 0) {
        node_class_name = (
          <select
            className="custom-select"
            value={this.props.module + this.props.nodeClass}
            onChange={this.props.nodeClassChangeHandler}
          >
            {flowControlNodes.map((x) => (
              <option
                key={x.module + x.node_class}
                value={x.module + x.node_class}
              >
                {x.node_class} ({x.module})
              </option>
            ))}
          </select>
        );
      }
    }

    let doc_icon = null;
    if (this.props.doc) {
      doc_icon = (
        <i
          title={getShortDoc(this.props.doc)}
          className="fas fa-question-circle pl-2 pr-2"
        ></i>
      );
    }

    return (
      <div className="d-flex flex-column">
        <input
          className="form-control-lg mb-2"
          type="text"
          value={this.props.name}
          onFocus={this.onFocus}
          onChange={this.props.nameChangeHandler}
        />
        <div className="d-flex minw0">
          <h4 className="text-muted">{node_class_name}</h4>
          {doc_icon}
        </div>
        {this.renderParamInputs(
          this.props.options.sort(compareKeys),
          "options"
        )}
        {this.renderParamDisplays(
          this.props.inputs.sort(compareKeys),
          "inputs"
        )}
        {this.renderParamDisplays(
          this.props.outputs.sort(compareKeys),
          "outputs"
        )}
      </div>
    );
  }

  handleOptionWirings(_paramType: string, key: string, new_value: unknown) {
    if (
      this.props.module === "ros_bt_py.ros_nodes.enum" &&
      this.props.nodeClass === "Enum"
    ) {
      if (key == "ros_message_type") {
        const message = getMessageType(new_value as string);
        this.get_message_constant_fields_service.callService(
          {
            message_type: message.message_type,
            service: message.service,
            action: message.action,
          } as GetMessageFieldsRequest,
          (response: GetMessageFieldsResponse) => {
            const obj = getDefaultValue(
              "ros_bt_py.ros_helpers.EnumValue",
              null
            );

            if (response.success) {
              const val: PyEnum = obj.value as PyEnum;
              val.field_names = response.field_names;
              val.enum_value = response.field_names[0];
            }
            this.props.updateValue(
              "options",
              "constant_name",
              obj.value as string
            );
          }
        );
      }
    } else {
      const referenced_node = this.props.availableNodes.filter((item) => {
        return (
          item.node_class == this.props.nodeClass &&
          item.module == this.props.module
        );
      })[0];

      referenced_node.options.forEach((option) => {
        const typeName = prettyprint_type(option.serialized_value);

        if (typeName.startsWith("OptionRef(")) {
          const optionTypeName = typeName.substring(
            "OptionRef(".length,
            typeName.length - 1
          );
          const optionType = this.props.options.find((x) => {
            return x.key === optionTypeName;
          });
          if (optionType) {
            if (optionType.key == key) {
              const message = getMessageType(new_value as string);
              const message_name = message.message_type.replaceAll(".", "/");
              this.get_message_fields_service.callService(
                {
                  message_type: message_name,
                  service: message.service,
                  action: message.action,
                } as GetMessageFieldsRequest,
                (response: GetMessageFieldsResponse) => {
                  if (response.success) {
                    const obj = JSON.parse(response.fields);
                    this.props.updateValue("options", option.key, obj);
                  }
                }
              );
            }
          }
        }
      });
    }
  }

  updateValue(paramType: string, key: string, new_value: ValueTypes) {
    if (paramType.toLowerCase() === "options") {
      this.handleOptionWirings(paramType, key, new_value);
    }

    this.props.updateValue(paramType, key, new_value);
  }

  inputForValue(
    paramItem: ParamData,
    onValidityChange: (new_validity: boolean) => void,
    onNewValue: (new_value: ValueTypes) => void
  ) {
    const valueType = paramItem.value.type;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let changeHandler = (_event: React.ChangeEvent<HTMLInputElement>) => {
      // do nothing.
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let keyPressHandler = (_event: React.KeyboardEvent<HTMLInputElement>) => {
      // do nothing.
    };

    if (valueType === "int") {
      // Number input with integer increments
      changeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
        let newValue = Math.round(parseInt(event.target.value));
        if (isNaN(newValue)) {
          newValue = 0;
        }
        onNewValue(newValue);
      };

      return (
        <div className="form-group">
          <label className="d-block">
            {paramItem.key}
            <input
              type="number"
              name="integer"
              className="form-control"
              onChange={changeHandler}
              placeholder="integer"
              step="1.0"
              value={paramItem.value.value as number}
            ></input>
          </label>
        </div>
      );
    }
    if (valueType === "float") {
      // Number input with free increments
      changeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
        let newValue = parseFloat(event.target.value);
        if (isNaN(newValue)) {
          newValue = 0;
        }
        onNewValue(newValue);
      };

      return (
        <div className="form-group">
          <label className="d-block">
            {paramItem.key}
            <input
              type="number"
              name="float"
              step="any"
              className="form-control"
              onChange={changeHandler}
              onFocus={this.onFocus}
              placeholder="float"
              value={paramItem.value.value as number}
            ></input>
          </label>
        </div>
      );
    } else if (valueType === "string") {
      // Regular input
      changeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
        onNewValue(event.target.value || "");
      };

      return (
        <div className="form-group">
          <label className="d-block">
            {paramItem.key}
            <input
              type="text"
              className="form-control mt-2"
              value={paramItem.value.value as string}
              onFocus={this.onFocus}
              onChange={changeHandler}
            />
          </label>
        </div>
      );
    } else if (valueType === "type") {
      // Regular input
      changeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newTypeName = event.target.value || "";
        if (this.props.messagesFuse !== undefined) {
          const results = this.props.messagesFuse.search(newTypeName);
          const message_results = results.slice(0, 5).map((x) => x.item);
          this.setState({
            messages_results: message_results,
            results_at_key: paramItem.key,
          });
        }
        if (python_builtin_types.indexOf(newTypeName) >= 0) {
          onNewValue("__builtin__." + newTypeName);
        } else {
          onNewValue(newTypeName);
        }
      };

      keyPressHandler = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
          this.setState({ messages_results: [] });
          this.setState({ results_at_key: null });
        }
      };

      return (
        <div className="form-group">
          <label className="d-block">
            {paramItem.key}
            <input
              type="text"
              className="form-control mt-2"
              value={paramItem.value.value as string}
              onChange={changeHandler}
              onFocus={this.onFocus}
              onKeyPress={keyPressHandler}
            />
          </label>
          {this.renderSearchResults(
            this.state.messages_results,
            paramItem.key,
            onNewValue
          )}
        </div>
      );
    } else if (valueType === "bool") {
      // Checkbox
      changeHandler = (event) => {
        onNewValue(event.target.checked || false);
      };

      const checkID = "input_checkbox_" + uuid();
      return (
        <div className="custom-control custom-checkbox m-1">
          <input
            type="checkbox"
            id={checkID}
            className="custom-control-input"
            checked={paramItem.value.value as boolean}
            onFocus={this.onFocus}
            onChange={changeHandler}
          />
          <label className="custom-control-label d-block" htmlFor={checkID}>
            {paramItem.key}
          </label>
        </div>
      );
    } else if (valueType === "unset_optionref") {
      return (
        <div className="form-group m-1">
          <label className="d-block">
            {paramItem.key}
            <input
              type="text"
              className="form-control mt-2"
              value={paramItem.value.value as string}
              disabled={true}
            />
          </label>
        </div>
      );
    } else if (valueType === "list") {
      return (
        <div className="form-group">
          <label className="d-block">
            {paramItem.key}
            <JSONInput
              json={paramItem.value.value as string}
              message_type={paramItem.value.type}
              ros={this.props.ros}
              bt_namespace={this.props.bt_namespace}
              output="list"
              onValidityChange={onValidityChange}
              onFocus={this.onFocus}
              onNewValue={onNewValue}
            />
          </label>
        </div>
      );
    } else if (valueType === "dict") {
      return (
        <div className="form-group">
          <label className="d-block">
            {paramItem.key}
            <JSONInput
              json={paramItem.value.value as string}
              message_type={paramItem.value.type}
              ros={this.props.ros}
              bt_namespace={this.props.bt_namespace}
              output="dict"
              onValidityChange={onValidityChange}
              onFocus={this.onFocus}
              onNewValue={onNewValue}
            />
          </label>
        </div>
      );
    } else if (valueType === "collections.OrderedDict") {
      return (
        <div className="form-group">
          <label className="d-block">
            {paramItem.key}
            <JSONInput
              json={paramItem.value.value as string}
              message_type={paramItem.value.type}
              ros={this.props.ros}
              bt_namespace={this.props.bt_namespace}
              output="dict"
              onValidityChange={onValidityChange}
              onFocus={this.onFocus}
              onNewValue={onNewValue}
            />
          </label>
        </div>
      );
    } else if (valueType === "ros_bt_py.ros_helpers.LoggerLevel") {
      return (
        <div className="form-group">
          <label className="d-block">
            {paramItem.key}
            <DropDown
              json={paramItem.value.value}
              message_type={paramItem.value.type}
              onFocus={this.onFocus}
              onNewValue={onNewValue}
            />
          </label>
        </div>
      );
    } else if (valueType === "ros_bt_py.helpers.MathUnaryOperator") {
      return (
        <div className="form-group">
          <label className="d-block">
            {paramItem.key}
            <MathUnaryOperatorDropDown
              json={paramItem.value.value}
              message_type={paramItem.value.type}
              onFocus={this.onFocus}
              onNewValue={onNewValue}
            />
          </label>
        </div>
      );
    } else if (valueType === "ros_bt_py.helpers.MathBinaryOperator") {
      return (
        <div className="form-group">
          <label className="d-block">
            {paramItem.key}
            <MathBinaryOperatorDropDown
              json={paramItem.value.value}
              message_type={paramItem.value.type}
              onFocus={this.onFocus}
              onNewValue={onNewValue}
            />
          </label>
        </div>
      );
    } else if (valueType === "ros_bt_py.helpers.MathOperandType") {
      return (
        <div className="form-group">
          <label className="d-block">
            {paramItem.key}
            <MathOperandTypeDropDown
              json={paramItem.value.value}
              message_type={paramItem.value.type}
              onFocus={this.onFocus}
              onNewValue={onNewValue}
            />
          </label>
        </div>
      );
    } else if (valueType === "ros_bt_py.helpers.MathUnaryOperandType") {
      return (
        <div className="form-group">
          <label className="d-block">
            {paramItem.key}
            <MathUnaryOperandTypeDropDown
              json={paramItem.value.value}
              message_type={paramItem.value.type}
              onFocus={this.onFocus}
              onNewValue={onNewValue}
            />
          </label>
        </div>
      );
    } else if (valueType === "ros_bt_py.ros_helpers.EnumValue") {
      return (
        <div className="form-group">
          <label className="d-block">
            {paramItem.key}
            <EnumDropDown
              json={paramItem.value.value}
              message_type={paramItem.value.type}
              onValidityChange={onValidityChange}
              onFocus={this.onFocus}
              onNewValue={onNewValue}
            />
          </label>
        </div>
      );
    } // if (valueType === 'object')
    else {
      return (
        <div className="form-group">
          <label className="d-block">
            {paramItem.key}
            <JSONInput
              json={paramItem.value.value as string}
              message_type={paramItem.value.type}
              ros={this.props.ros}
              bt_namespace={this.props.bt_namespace}
              output="pickled"
              onValidityChange={onValidityChange}
              onFocus={this.onFocus}
              onNewValue={onNewValue}
            />
          </label>
        </div>
      );
    }
  }

  displayForValue(paramItem: ParamData) {
    const valueType = paramItem.value.type;

    if (
      valueType === "int" ||
      valueType === "float" ||
      valueType === "string"
    ) {
      // Number input with integer increments
      return (
        <Fragment>
          <h5>
            {paramItem.key}{" "}
            <span className="text-muted">(type: {valueType})</span>
          </h5>
          <span>{paramItem.value.value as string}</span>
        </Fragment>
      );
    } else if (valueType === "type") {
      return (
        <Fragment>
          <h5>
            {paramItem.key}{" "}
            <span className="text-muted">(type: {valueType})</span>
          </h5>
          <pre>{paramItem.value.value as string}</pre>
        </Fragment>
      );
    } else if (valueType === "boolean" || valueType === "bool") {
      return (
        <Fragment>
          <h5>
            {paramItem.key}{" "}
            <span className="text-muted">(type: {valueType})</span>
          </h5>
          <pre>{paramItem.value.value ? "True" : "False"}</pre>
        </Fragment>
      );
    } else if (valueType === "unset_optionref") {
      return (
        <Fragment>
          <h5>
            {paramItem.key}{" "}
            <span className="text-muted">(type: {valueType})</span>
          </h5>
          <pre className="text-muted">{paramItem.value.value as string}</pre>
        </Fragment>
      );
    } else {
      return (
        <Fragment>
          <h5>
            {paramItem.key}{" "}
            <span className="text-muted">(type: {valueType})</span>
          </h5>
          <pre>{JSON.stringify(paramItem.value.value, null, 2)}</pre>
        </Fragment>
      );
    }
  }

  renderParamInputs(params: ParamData[], name: string) {
    const param_rows = params.map((x) => {
      return (
        <div className="list-group-item" key={name + x.key}>
          {this.inputForValue(
            x,
            this.props.updateValidity,
            (newVal: ValueTypes) => this.updateValue(name, x.key, newVal)
          )}
        </div>
      );
    });

    return (
      <div className="mb-2">
        <h5>{name}</h5>
        <div className="list-group">{param_rows}</div>
      </div>
    );
  }

  renderParamDisplays(params: ParamData[], name: string) {
    const param_rows = params.map((x) => {
      return (
        <div className="list-group-item" key={name + x.key}>
          {this.displayForValue(x)}
        </div>
      );
    });

    return (
      <div className="mb-2">
        <h5>{name}</h5>
        <div className="list-group">{param_rows}</div>
      </div>
    );
  }

  getDefaultValues(paramList: NodeData[], options: NodeData[]) {
    options = options || [];

    return paramList.map((x) => {
      return {
        key: x.key,
        value: getDefaultValue(prettyprint_type(x.serialized_value), options),
      };
    });
  }
}
