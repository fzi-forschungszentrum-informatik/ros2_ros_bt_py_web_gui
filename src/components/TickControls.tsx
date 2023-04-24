import { Component, Fragment } from "react";
import ROSLIB from "roslib";
import {
  ControlTreeExecutionRequest,
  ControlTreeExecutionResponse,
  TreeExecutionCommands,
} from "../types/services/ControlTreeExecution";

interface TickControlsProps {
  ros: ROSLIB.Ros;
  bt_namespace: string;
  runningCommands: Set<TreeExecutionCommands>;
  onNewRunningCommand: (command: TreeExecutionCommands) => void;
  onRunningCommandCompleted: (command: TreeExecutionCommands) => void;
  onError: (error_msg: string) => void;
}

interface TickControlsState {
  running_commands: Set<TreeExecutionCommands>;
}

export class TickControls extends Component<
  TickControlsProps,
  TickControlsState
> {
  tick_service?: ROSLIB.Service<
    ControlTreeExecutionRequest,
    ControlTreeExecutionResponse
  >;
  constructor(props: TickControlsProps) {
    super(props);

    this.state = {
      running_commands: props.runningCommands,
    };

    this.controlExec = this.controlExec.bind(this);
  }

  componentDidMount() {
    this.tick_service = new ROSLIB.Service({
      ros: this.props.ros,
      name: this.props.bt_namespace + "control_tree_execution",
      serviceType: "ros_bt_py_msgs/ControlTreeExecution",
    });
  }

  componentDidUpdate(prevProps: TickControlsProps) {
    if (this.props.runningCommands !== prevProps.runningCommands) {
      this.setState({ running_commands: this.props.runningCommands });
    }
  }

  controlExec(command: TreeExecutionCommands) {
    this.props.onNewRunningCommand(command);
    if (this.tick_service === undefined) {
      console.error("ControlTreeExecution service is undefined!");
      return;
    }

    this.tick_service.callService(
      {
        command: command,
      } as ControlTreeExecutionRequest,
      (response: ControlTreeExecutionResponse) => {
        if (response.success) {
          console.log("called ControlTreeExecution service successfully");
        } else {
          this.props.onError(response.error_message);
        }
        this.props.onRunningCommandCompleted(command);
      }
    );
  }

  render() {
    let tick_once_classes = "fas fa-check show-button-icon";
    if (
      this.state.running_commands != undefined &&
      this.state.running_commands.has(1)
    ) {
      tick_once_classes = "fas fa-check fa-spin show-button-icon";
    }
    let tick_periodically_classes = "fas fa-sync show-button-icon";
    if (
      this.state.running_commands != undefined &&
      this.state.running_commands.has(2)
    ) {
      tick_periodically_classes = "fas fa-sync fa-spin show-button-icon";
    }
    let tick_until_result_classes = "fas fa-play show-button-icon";
    if (
      this.state.running_commands != undefined &&
      this.state.running_commands.has(3)
    ) {
      tick_until_result_classes = "fas fa-play fa-spin show-button-icon";
    }
    let stop_classes = "fas fa-stop show-button-icon";
    if (
      this.state.running_commands != undefined &&
      this.state.running_commands.has(4)
    ) {
      stop_classes = "fas fa-stop fa-spin show-button-icon";
    }
    let reset_classes = "fas fa-undo show-button-icon";
    if (
      this.state.running_commands != undefined &&
      this.state.running_commands.has(5)
    ) {
      reset_classes = "fas fa-undo fa-spin show-button-icon";
    }
    let shutdown_classes = "fas fa-power-off show-button-icon";
    if (
      this.state.running_commands != undefined &&
      this.state.running_commands.has(6)
    ) {
      shutdown_classes = "fas fa-power-off fa-spin show-button-icon";
    }
    return (
      <Fragment>
        <button
          onClick={this.controlExec.bind(this, 1)}
          className="btn btn-primary ml-1"
          title="Tick Once"
        >
          <i className={tick_once_classes}></i>
          <span className="ml-1 hide-button-text-control">Tick Once</span>
        </button>
        <button
          onClick={this.controlExec.bind(this, 2)}
          className="btn btn-primary ml-1"
          title="Tick Periodically"
        >
          <i className={tick_periodically_classes}></i>
          <span className="ml-1 hide-button-text-control">
            Tick Periodically
          </span>
        </button>
        <button
          onClick={this.controlExec.bind(this, 3)}
          className="btn btn-primary ml-1"
          title="Tick Until Result"
        >
          <i className={tick_until_result_classes}></i>
          <span className="ml-1 hide-button-text-control">
            Tick Until Result
          </span>
        </button>
        <button
          onClick={this.controlExec.bind(this, 4)}
          className="btn btn-primary ml-1"
          title="Stop"
        >
          <i className={stop_classes}></i>
          <span className="ml-1 hide-button-text-control">Stop</span>
        </button>
        <button
          onClick={this.controlExec.bind(this, 5)}
          className="btn btn-primary ml-1"
          title="Reset"
        >
          <i className={reset_classes}></i>
          <span className="ml-1 hide-button-text-control">Reset</span>
        </button>
        <button
          onClick={() => this.controlExec(6)}
          className="btn btn-primary ml-1"
          title="Shutdown"
        >
          <i className={shutdown_classes}></i>
          <span className="ml-1 hide-button-text-control">Shutdown</span>
        </button>
      </Fragment>
    );
  }
}
