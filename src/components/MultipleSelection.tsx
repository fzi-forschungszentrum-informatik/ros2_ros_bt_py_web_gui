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
import { Component } from "react";
import { NodeDataWiring, Package, TreeMsg } from "../types/types";
import Fuse from "fuse.js";
import ROSLIB from "roslib";
import {
  GenerateSubtreeRequest,
  GenerateSubtreeResponse,
} from "../types/services/GenerateSubtree";
interface MultipleSelectionProps {
  ros: ROSLIB.Ros;
  bt_namespace: string;
  packages: Package[];
  last_selected_package: string;
  selectedNodeNames: string[];
  tree_message: TreeMsg | null;
  packagesFuse: Fuse<Package>;
  onError: (error_message: string) => void;
  onSelectionChange: (new_selected_node_name: string | null) => void;
  onMultipleSelectionChange: (new_selected_node_names: string[] | null) => void;
  onSelectedEdgeChange: (new_selected_edge: NodeDataWiring | null) => void;
  onChangeFileModal: (mode: string | null) => void;
  onGenSubtreeChange: (tree_msg: TreeMsg | null) => void;
}

interface MultipleSelectionState {}

export class MultipleSelection extends Component<
  MultipleSelectionProps,
  MultipleSelectionState
> {
  generate_subtree_service: ROSLIB.Service<
    GenerateSubtreeRequest,
    GenerateSubtreeResponse
  >;
  node: HTMLDivElement | null;
  constructor(props: MultipleSelectionProps) {
    super(props);

    this.onClickCreateSubtree = this.onClickCreateSubtree.bind(this);

    let name = this.props.selectedNodeNames.join("_");
    if (name.length === 0) {
      name = "Subtree";
    }

    this.node = null;

    this.state = {};

    this.generate_subtree_service = new ROSLIB.Service({
      ros: props.ros,
      name: props.bt_namespace + "generate_subtree",
      serviceType: "ros_bt_py_interfaces/srv/GenerateSubtree",
    });
  }

  onClickCreateSubtree() {
    this.generate_subtree_service.callService(
      {
        nodes: this.props.selectedNodeNames,
      } as GenerateSubtreeRequest,
      (response: GenerateSubtreeResponse) => {
        if (response.success) {
          console.log("Generated subtree");
          console.log(response.tree);
          this.props.onGenSubtreeChange(response.tree);
          this.props.onChangeFileModal("generate_subtree");
        } else {
          this.props.onError(
            "Failed to create subtree " + response.error_message
          );
        }
      }
    );
  }

  render() {
    let create_subtree_text = "Create subtree from selected ";
    if (this.props.selectedNodeNames.length > 1) {
      create_subtree_text += "nodes";
    } else {
      create_subtree_text += "node";
    }

    return (
      <div className="d-flex flex-column">
        <div className="btn-group d-flex mb-2" role="group">
          <button
            className="btn btn-primary w-30"
            onClick={this.onClickCreateSubtree}
            disabled={false}
          >
            {create_subtree_text}
          </button>
        </div>
      </div>
    );
  }
}
