import React, { ChangeEvent, Component, Fragment } from "react";
import ROSLIB from "roslib";
import { DebugSettings } from "../types/types";
import {
  SetExecutionModeRequest,
  SetExecutionModeResponse,
} from "../types/services/SetExecutionMode";
import { ContinueRequest, ContinueResponse } from "../types/services/Continue";
import { uuid } from "../utils";

interface DebugControlsProps {
  ros: ROSLIB.Ros;
  bt_namespace: string;
  onError: (error_msg: string) => void;
  onPublishingSubtreesChange: (editable: boolean) => void;
}

interface DebugControlsState {
  debugging: boolean;
  publishing_subtrees: boolean;
}

export class DebugControls extends Component<
  DebugControlsProps,
  DebugControlsState
> {
  debug_settings_sub: ROSLIB.Topic<DebugSettings>;
  set_execution_mode_service: ROSLIB.Service<
    SetExecutionModeRequest,
    SetExecutionModeResponse
  >;
  step_service: ROSLIB.Service<ContinueRequest, ContinueResponse>;
  debugCheckID: string;
  publishSubtreesID: string;

  constructor(props: DebugControlsProps) {
    super(props);

    this.state = {
      debugging: false,
      publishing_subtrees: false,
    };

    this.debug_settings_sub = new ROSLIB.Topic({
      ros: props.ros,
      name: props.bt_namespace + "debug/debug_settings",
      messageType: "ros_bt_py_msgs/DebugSettings",
    });

    this.set_execution_mode_service = new ROSLIB.Service({
      ros: props.ros,
      name: props.bt_namespace + "debug/set_execution_mode",
      serviceType: "ros_bt_py_msgs/SetExecutionMode",
    });

    this.step_service = new ROSLIB.Service({
      ros: props.ros,
      name: props.bt_namespace + "debug/continue",
      serviceType: "ros_bt_py_msgs/Continue",
    });

    this.debugCheckID = "debug_" + uuid();
    this.publishSubtreesID = "publish_subtrees_" + uuid();

    this.onNewDebugSettings = this.onNewDebugSettings.bind(this);
    this.onClickStep = this.onClickStep.bind(this);
    this.handleDebugChange = this.handleDebugChange.bind(this);
    this.handlePubSubtreesChange = this.handlePubSubtreesChange.bind(this);
  }

  componentDidMount() {
    this.debug_settings_sub.subscribe(this.onNewDebugSettings);
  }

  componentWillUnmount() {
    this.debug_settings_sub.unsubscribe(this.onNewDebugSettings);
  }

  onNewDebugSettings(msg: any) {
    this.setState({
      debugging: msg.single_step,
      publishing_subtrees: msg.publish_subtrees,
    });
  }

  onClickStep() {
    this.step_service.callService(
      {} as ContinueRequest,
      (response: ContinueResponse) => {
        if (response.success) {
          console.log("stepped successfully");
        } else {
          this.props.onError(response.error_message);
        }
      }
    );
  }

  handleDebugChange(event: ChangeEvent<HTMLInputElement>) {
    const enable = event.target.checked;
    this.set_execution_mode_service.callService(
      {
        single_step: enable,
        publish_subtrees: this.state.publishing_subtrees,
        collect_performance_data: true,
      } as SetExecutionModeRequest,
      function () {
        if (enable) {
          console.log("enabled stepping");
        } else {
          console.log("disabled stepping");
        }
      }.bind(this)
    );
    this.setState({ debugging: enable });
  }

  handlePubSubtreesChange(event: ChangeEvent<HTMLInputElement>) {
    const enable = event.target.checked;
    this.props.onPublishingSubtreesChange(enable);
    this.set_execution_mode_service.callService(
      {
        single_step: this.state.debugging,
        publish_subtrees: enable,
        collect_performance_data: true,
      } as SetExecutionModeRequest,
      function () {
        if (enable) {
          console.log("enabled stepping");
        } else {
          console.log("disabled stepping");
        }
      }.bind(this)
    );
    this.setState({ publishing_subtrees: enable });
  }

  render() {
    let debug_controls = null;
    if (this.state.debugging) {
      debug_controls = (
        <button onClick={this.onClickStep} className="btn btn-primary ms-1">
          <i className="fas fa-step-forward show-button-icon"></i>
          <span className="ms-1 hide-button-text-control">Step</span>
        </button>
      );
    }
    return (
      <Fragment>
        <div className="form-check m-1">
          <input
            type="checkbox"
            id={this.debugCheckID}
            className="form-check-input"
            checked={this.state.debugging}
            onChange={this.handleDebugChange}
          />
          <label className="form-check-label" htmlFor={this.debugCheckID}>
            Debug
          </label>
        </div>
        <div className="form-check m-1">
          <input
            type="checkbox"
            id={this.publishSubtreesID}
            className="form-check-input"
            checked={this.state.publishing_subtrees}
            onChange={this.handlePubSubtreesChange}
          />
          <label className="form-check-label" htmlFor={this.publishSubtreesID}>
            Publish Subtrees
          </label>
        </div>
        {debug_controls}
      </Fragment>
    );
  }
}
