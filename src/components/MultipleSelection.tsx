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
import { ChangeEvent, Component, KeyboardEvent } from "react";
import { NodeDataWiring, Package, TreeMsg } from "../types/types";
import Fuse from "fuse.js";
import ROSLIB from "roslib";
import {
  WireNodeDataRequest,
  WireNodeDataResponse,
} from "../types/services/WireNodeData";
import {
  RemoveNodeRequest,
  RemoveNodeResponse,
} from "../types/services/RemoveNode";
import { AddNodeRequest, AddNodeResponse } from "../types/services/AddNode";
import {
  GenerateSubtreeRequest,
  GenerateSubtreeResponse,
} from "../types/services/GenerateSubtree";
import {
  AddNodeAtIndexRequest,
  AddNodeAtIndexResponse,
} from "../types/services/AddNodeAtIndex";
import { MoveNodeRequest, MoveNodeResponse } from "../types/services/MoveNode";

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
}

interface MultipleSelectionState {
  name: string;
  isValid: boolean;
  target: string;
  description: string;
  filename: string;
  package: string;
  package_results: Package[];
}

export class MultipleSelection extends Component<
  MultipleSelectionProps,
  MultipleSelectionState
> {
  generate_subtree_service: ROSLIB.Service<
    GenerateSubtreeRequest,
    GenerateSubtreeResponse
  >;
  add_node_service: ROSLIB.Service<AddNodeRequest, AddNodeResponse>;
  add_node_at_index_service: ROSLIB.Service<
    AddNodeAtIndexRequest,
    AddNodeAtIndexResponse
  >;
  move_node_service: ROSLIB.Service<MoveNodeRequest, MoveNodeResponse>;
  remove_node_service: ROSLIB.Service<RemoveNodeRequest, RemoveNodeResponse>;
  wire_data_service: ROSLIB.Service<WireNodeDataRequest, WireNodeDataResponse>;
  unwire_data_service: ROSLIB.Service<
    WireNodeDataRequest,
    WireNodeDataResponse
  >;
  node: HTMLDivElement | null;
  constructor(props: MultipleSelectionProps) {
    super(props);

    this.setFilename = this.setFilename.bind(this);
    this.setDescription = this.setDescription.bind(this);
    this.setTarget = this.setTarget.bind(this);
    this.searchPackageName = this.searchPackageName.bind(this);
    this.selectPackageSearchResult = this.selectPackageSearchResult.bind(this);
    this.onClickCreateSubtree = this.onClickCreateSubtree.bind(this);
    this.updateValidity = this.updateValidity.bind(this);
    this.handlePackageSearchClear = this.handlePackageSearchClear.bind(this);

    let name = this.props.selectedNodeNames.join("_");
    if (name.length === 0) {
      name = "Subtree";
    }

    this.node = null;

    this.state = {
      name: name,
      isValid: false,
      target: "",
      description: "",
      filename: "subtree.yaml",
      package: this.props.last_selected_package,
      package_results: [],
    };

    this.generate_subtree_service = new ROSLIB.Service({
      ros: props.ros,
      name: props.bt_namespace + "generate_subtree",
      serviceType: "ros_bt_py_interfaces/srv/GenerateSubtree",
    });

    this.add_node_service = new ROSLIB.Service({
      ros: props.ros,
      name: props.bt_namespace + "add_node",
      serviceType: "ros_bt_py_interfaces/srv/AddNode",
    });

    this.add_node_at_index_service = new ROSLIB.Service({
      ros: props.ros,
      name: props.bt_namespace + "add_node_at_index",
      serviceType: "ros_bt_py_interfaces/srv/AddNodeAtIndex",
    });

    this.move_node_service = new ROSLIB.Service({
      ros: props.ros,
      name: props.bt_namespace + "move_node",
      serviceType: "ros_bt_py_interfaces/srv/MoveNode",
    });

    this.remove_node_service = new ROSLIB.Service({
      ros: props.ros,
      name: props.bt_namespace + "remove_node",
      serviceType: "ros_bt_py_interfaces/srv/RemoveNode",
    });

    this.wire_data_service = new ROSLIB.Service({
      ros: props.ros,
      name: props.bt_namespace + "wire_data",
      serviceType: "ros_bt_py_interfaces/srv/WireNodeData",
    });

    this.unwire_data_service = new ROSLIB.Service({
      ros: props.ros,
      name: props.bt_namespace + "unwire_data",
      serviceType: "ros_bt_py_interfaces/srv/WireNodeData",
    });
  }

  componentDidMount() {
    document.addEventListener("click", this.handleClick);
  }

  componentDidUpdate(
    _prevProps: MultipleSelectionProps,
    prevState: MultipleSelectionState
  ) {
    if (prevState.package != this.state.package) {
      if (this.state.package !== "") {
        this.setState({ isValid: true });
      } else {
        this.setState({ isValid: false });
      }
    }
  }

  handleClick = (event: MouseEvent) => {
    if (this.node && !this.node.contains(event.target as Element)) {
      this.setState({ package_results: [] });
    }
  };

  onClickCreateSubtree() {
    this.generate_subtree_service.callService(
      {
        nodes: this.props.selectedNodeNames,
      } as GenerateSubtreeRequest,
      (response: GenerateSubtreeResponse) => {
        if (response.success) {
          console.log("Generated subtree");
        } else {
          this.props.onError(
            "Failed to create subtree " + response.error_message
          );
        }
      }
    );
  }

  searchPackageName(event: ChangeEvent<HTMLInputElement>) {
    if (this.props.packagesFuse) {
      const results = this.props.packagesFuse
        .search(event.target.value)
        .map((x) => x.item);
      this.setState({ package_results: results.slice(0, 5) });
    }
    this.setState({ package: event.target.value });
  }

  handlePackageSearchClear(e: KeyboardEvent<HTMLInputElement>) {
    if (e.keyCode == 27) {
      // ESC
      this.setState({ package_results: [] });
    }
  }

  selectPackageSearchResult(result: string) {
    this.setState({ package: result });
    this.setState({ package_results: [] });
  }

  renderPackageSearchResults(results: Package[]) {
    if (results.length > 0) {
      const result_rows = results.map((x) => {
        return (
          <div
            className="list-group-item search-result align-items-start"
            onClick={() => this.selectPackageSearchResult(x.package)}
          >
            <div className="d-flex w-100 justify-content-between">
              <span>{x.package}</span>
              <i className="far fa-file-code" title={x.path}></i>
            </div>
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

  updateValidity() {
    // do nothing.
  }

  // FIXME this is temporary...!!!
  setFilename(event: ChangeEvent<HTMLInputElement>) {
    this.setState({ filename: event.target.value });
  }

  setDescription(event: ChangeEvent<HTMLInputElement>) {
    this.setState({ description: event.target.value });
  }

  setTarget(event: ChangeEvent<HTMLInputElement>) {
    this.setState({ target: event.target.value });
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
            disabled={true}
          >
            {create_subtree_text}
          </button>
        </div>
        <div className="d-flex flex-column">
          <h5>
            Filename{" "}
            <i
              title="Filename/Path of the subtree TODO"
              className="fas fa-question-circle"
            ></i>
          </h5>
          <input
            className="form-control-lg mb-2"
            type="text"
            value={this.state.filename}
            onChange={this.setFilename}
            disabled={true}
          />
          <h5>
            Package{" "}
            <i
              title="The ROS package in which the newly created subtree will be saved in"
              className="fas fa-question-circle"
            ></i>
          </h5>
          <input
            className="form-control-lg mb-2"
            type="text"
            value={this.state.package}
            onChange={this.searchPackageName}
            disabled={true}
          />
          {this.renderPackageSearchResults(this.state.package_results)}
        </div>
      </div>
    );
  }
}
