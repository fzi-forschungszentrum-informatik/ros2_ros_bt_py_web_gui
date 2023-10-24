// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// TODO: Remove this whenever this can be typed!

import React, { Component } from "react";
import ROSLIB from "roslib";
import {
  GetMessageFieldsRequest,
  GetMessageFieldsResponse,
  GetMessageFieldsType,
} from "../types/services/GetMessageFields";
import JSONEditor from "jsoneditor";

import "jsoneditor/dist/jsoneditor.min.css";

import { getMessageType } from "../utils";

interface JSONInputProps {
  json: string;
  message_type: string;
  ros: ROSLIB.Ros;
  bt_namespace: string;
  output: string;
  onValidityChange: (new_validity: boolean) => void;
  onFocus: (event: React.FocusEvent<HTMLDivElement>) => void;
  onNewValue: (new_value: any) => void;
}

interface JSONInputState {
  is_valid: boolean;
  json: string | object;
  message_type: string;
  field_names: string[];
  pyobjectstring: string | null;
}

export class JSONInput extends Component<JSONInputProps, JSONInputState> {
  editor: JSONEditor | null;
  editorRef: HTMLDivElement | null;
  get_message_fields_service: ROSLIB.Service<
    GetMessageFieldsRequest,
    GetMessageFieldsResponse
  >;
  constructor(props: JSONInputProps) {
    super(props);

    let is_valid = false;

    try {
      JSON.parse(JSON.stringify(props.json));
      is_valid = true;
    } catch (e) {
      is_valid = false;
    }

    this.state = {
      is_valid: is_valid,
      json: props.json,
      message_type: props.message_type,
      field_names: [],
      pyobjectstring: null,
    };

    this.editor = null;
    this.editorRef = null;

    this.get_message_fields_service = new ROSLIB.Service({
      ros: props.ros,
      name: props.bt_namespace + "get_message_fields",
      serviceType: "ros_bt_py_interfaces/srv/GetMessageFields",
    });

    this.updateMessageType = this.updateMessageType.bind(this);
  }

  componentDidMount() {
    this.editor = new JSONEditor(this.editorRef!, {
      mode: "code",
      onChange: this.handleChange,
    });
    this.editor.set(this.state.json);
    this.editor.aceEditor.setOptions({ maxLines: 100 });
    this.editor.aceEditor.resize();

    if (this.state.message_type != null) {
      this.updateMessageType(this.state.message_type, this.state.json, true);
    }
  }

  getJSONfromPyObject(
    pyobject: object,
    field_names: string[] | null
  ): { json: object; counter: number } {
    const json = {};
    let counter = 0;
    if (field_names === null) {
      field_names = Object.getOwnPropertyNames(pyobject);
      field_names = field_names.map((x) => {
        x.trimStart().replace(/^,/, "");
      });
    }
    // eslint-disable-next-line no-prototype-builtins
    if (pyobject.hasOwnProperty("py/object")) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: Unsafe accessor
      for (const field_name of field_names) {
        if (field_name === "py/object") {
          continue;
        }
        // eslint-disable-next-line no-prototype-builtins
        if (pyobject.hasOwnProperty("_" + field_name)) {
          const value = pyobject["_" + field_name];
          // eslint-disable-next-line no-prototype-builtins
          if (value.hasOwnProperty("py/object")) {
            json[field_name] = this.getJSONfromPyObject(value, null).json;
          } else {
            json[field_name] = value;
          }

          counter += 1;
        }
        // eslint-disable-next-line no-prototype-builtins
        if (pyobject.hasOwnProperty(field_name)) {
          const value = pyobject[field_name];
          // eslint-disable-next-line no-prototype-builtins
          if (value.hasOwnProperty("py/object")) {
            json[field_name] = this.getJSONfromPyObject(value, null).json;
          } else {
            json[field_name] = value;
          }

          counter += 1;
        }
      }
    }
    return { json: json, counter: counter };
  }

  getPyObjectFromJSON(pyobject: object, json: object) {
    const keys = Object.keys(json);
    // eslint-disable-next-line no-prototype-builtins
    if (pyobject.hasOwnProperty("py/object")) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: Unsafe accessor
      for (const key of keys) {
        // eslint-disable-next-line no-prototype-builtins
        if (pyobject.hasOwnProperty("_" + key)) {
          pyobject["_" + key] = json[key];
        }
      }
    }
    return pyobject;
  }

  updateMessageType(message_type: string, json: object, just_mounted: boolean) {
    let type_changed = true;
    if (this.state.message_type === message_type) {
      type_changed = false;
    } else {
      this.setState({ message_type: message_type });
      type_changed = true;
    }
    if (this.props.ros) {
      const message = getMessageType(message_type);
      if (message === null) {
        return;
      }
      if (message.message_type == "/dict") {
        console.log("message is a dict, no request possible");
      } else {
        this.get_message_fields_service.callService(
          message,
          (response: GetMessageFieldsResponse) => {
            if (response.success) {
              this.setState({ pyobjectstring: response.fields });

              let new_value;
              if (type_changed) {
                new_value = this.getJSONfromPyObject(
                  JSON.parse(response.fields),
                  response.field_names
                ).json;
                //new_value = JSON.parse(response.fields);
              } else {
                new_value = this.getJSONfromPyObject(
                  json,
                  response.field_names
                ).json;
                //new_value = json;
              }

              this.setState({
                json: new_value,
                field_names: response.field_names,
              });
              this.editor!.update(new_value);
              console.log("updated message type and representation");
              if (!just_mounted) {
                this.handleChange();
              }
            }
          }
        );
      }
    }
  }

  componentWillUnmount() {
    this.editor!.destroy();
  }

  componentDidUpdate(prevProps: JSONInputProps, prevState: JSONInputState) {
    if (JSON.stringify(this.props.json) != JSON.stringify(prevProps.json)) {
      // eslint-disable-next-line no-prototype-builtins
      if (this.props.json && this.props.json.hasOwnProperty("py/state")) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: Unsafe accessor
        if (
          // eslint-disable-next-line no-prototype-builtins
          this.props.json.hasOwnProperty("py/object") &&
          this.props.json["py/object"] != this.state.message_type
        ) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore: Unsafe accessor
          this.updateMessageType(
            this.props.json["py/object"],
            this.props.json,
            false
          );
        }
      }
    }
  }

  handleChange = () => {
    try {
      const json = this.editor!.get();
      this.setState({
        json: JSON.stringify(json),
        is_valid: true,
      });
      //if (this.props.output == "pickled") {
      //  const reconstructed = this.getPyObjectFromJSON(
      //    JSON.parse(this.state.pyobjectstring!),
      //    json
      //  );
      // this.props.onNewValue(reconstructed);
      //} else {
      this.props.onNewValue(json);
      //}

      this.props.onValidityChange(true);
    } catch (e) {
      this.setState({ is_valid: false });
      this.props.onValidityChange(false);
    }
  };

  render() {
    return (
      <div
        id="editor"
        ref={(ref) => {
          this.editorRef = ref;
        }}
        onFocus={this.props.onFocus}
      />
    );
  }
}
