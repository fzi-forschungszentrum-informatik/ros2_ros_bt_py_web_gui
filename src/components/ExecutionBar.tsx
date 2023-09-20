import React, { Component, ReactNode } from "react";
import { TreeExecutionCommands } from "../types/services/ControlTreeExecution";
import { TreeMsg } from "../types/types";
import { DebugControls } from "./DebugControls";
import { LoadSaveControls } from "./LoadSaveControls";
import { NamespaceSelect } from "./NamespaceSelect";
import { Spacer } from "./Spacer";
import { TickControls } from "./TickControls";
import { FileBrowserMode } from "./FileBrowser";

interface ExecutionBarProps {
  ros: ROSLIB.Ros;
  ros_url: string;
  connected: boolean;
  packages_available: boolean;
  messages_available: boolean;
  currentNamespace: string;
  onNamespaceChange: (namespace: string) => void;
  onError: (error_msg: string) => void;
  subtreeNames: string[];
  tree_message: TreeMsg | null;
  onSelectedTreeChange: (is_subtree: boolean, name: string) => void;
  runningCommands: Set<TreeExecutionCommands>;
  onNewRunningCommand: (command: TreeExecutionCommands) => void;
  onRunningCommandCompleted: (command: TreeExecutionCommands) => void;
  onPublishingSubtreesChange: (enable: boolean) => void;
  onChangeFileModal: (mode: FileBrowserMode) => void;
}

interface ExecutionBarState {}

export class ExecutionBar extends Component<
  ExecutionBarProps,
  ExecutionBarState
> {
  constructor(props: ExecutionBarProps) {
    super(props);
  }
  render(): ReactNode {
    return (
      <header
        id="header"
        className="d-flex flex-column flex-md-row align-items-center control-bar"
      >
        <NamespaceSelect
          ros={this.props.ros}
          ros_url={this.props.ros_url}
          connected={this.props.connected}
          packages_available={this.props.packages_available}
          messages_available={this.props.messages_available}
          currentNamespace={this.props.currentNamespace}
          onNamespaceChange={this.props.onNamespaceChange}
          onError={this.props.onError}
        />
        <DebugControls
          ros={this.props.ros}
          bt_namespace={this.props.currentNamespace}
          onError={this.props.onError}
          onPublishingSubtreesChange={this.props.onPublishingSubtreesChange}
        />
        <TickControls
          ros={this.props.ros}
          bt_namespace={this.props.currentNamespace}
          runningCommands={this.props.runningCommands}
          onNewRunningCommand={this.props.onNewRunningCommand}
          onRunningCommandCompleted={this.props.onRunningCommandCompleted}
          onError={this.props.onError}
        />
        <Spacer />
        <LoadSaveControls
          ros={this.props.ros}
          bt_namespace={this.props.currentNamespace}
          tree_message={this.props.tree_message}
          onError={this.props.onError}
          onNewRunningCommand={this.props.onNewRunningCommand}
          onRunningCommandCompleted={this.props.onRunningCommandCompleted}
          onChangeFileModal={this.props.onChangeFileModal}
        />
      </header>
    );
  }
}
