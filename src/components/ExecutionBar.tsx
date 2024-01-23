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
import { Component, ReactNode } from "react";
import { TreeExecutionCommands } from "../types/services/ControlTreeExecution";
import { TreeMsg } from "../types/types";
import { DebugControls } from "./DebugControls";
import { LoadSaveControls } from "./LoadSaveControls";
import { NamespaceSelect } from "./NamespaceSelect";
import { Spacer } from "./Spacer";
import { TickControls } from "./TickControls";

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
  onChangeFileModal: (mode: string | null) => void;
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
