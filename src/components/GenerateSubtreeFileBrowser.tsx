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
import { ChangeEvent, Component } from "react";
import { PackageStructure, TreeMsg } from "../types/types";
import {
  GetStorageFoldersRequest,
  GetStorageFoldersResponse,
} from "../types/services/GetStorageFolders";
import {
  GetFolderStructureRequest,
  GetFolderStructureResponse,
} from "../types/services/GetFolderStructure";
import { SaveTreeRequest, SaveTreeResponse } from "../types/services/SaveTree";
import ROSLIB from "roslib";
import Fuse from "fuse.js";
import {
  ChangeTreeNameRequest,
  ChangeTreeNameResponse,
} from "../types/services/ChangeTreeName";

interface GenerateSubtreeBrowserProps {
  ros: ROSLIB.Ros;
  bt_namespace: string;
  onError: (error_message: string) => void;
  tree_message: TreeMsg | null;
  last_selected_folder: string;
  onChangeFileModal: (mode: string | null) => void;
  onSelectedStorageFolderChange: (new_selected_folder_name: string) => void;
}

interface GenerateSubtreeBrowserState {
  storage_folder: string;
  storage_folder_results: string[];
  selected_storage_folder: string | null;
  show_hidden: false;
  storage_folder_structure: PackageStructure | null;
  selected_directory?: number;
  selected_file: string;
  file_path: string | null;
  file_type_filter: string;
  highlighted: number | null;
  highlighted_package: number | null;
  write_mode: string;
  error_message: string | null;
  last_selected_folder: string;
  storage_folders_fuse: Fuse<string>;
  storage_folders_loaded: boolean;
}

export class GenerateSubtreeBrowser extends Component<
  GenerateSubtreeBrowserProps,
  GenerateSubtreeBrowserState
> {
  get_storage_folders_service?: ROSLIB.Service<
    GetStorageFoldersRequest,
    GetStorageFoldersResponse
  >;
  get_folder_structure_service?: ROSLIB.Service<
    GetFolderStructureRequest,
    GetFolderStructureResponse
  >;

  change_tree_name_service?: ROSLIB.Service<
    ChangeTreeNameRequest,
    ChangeTreeNameResponse
  >;

  save_service?: ROSLIB.Service<SaveTreeRequest, SaveTreeResponse>;

  node?: HTMLDivElement | null;

  constructor(props: GenerateSubtreeBrowserProps) {
    super(props);

    this.state = {
      storage_folder: "",
      storage_folder_results: [],
      selected_storage_folder: null,
      show_hidden: false,
      storage_folder_structure: null,
      selected_directory: undefined,
      selected_file: "",
      file_path: null,
      file_type_filter: ".yaml",
      highlighted: null,
      highlighted_package: null,
      write_mode: "ask",
      error_message: null,
      last_selected_folder: "",
      storage_folders_loaded: false,
      storage_folders_fuse: new Fuse([]),
    };
    this.selectFolderSearchResult = this.selectFolderSearchResult.bind(this);
  }

  componentDidMount() {
    this.get_folder_structure_service = new ROSLIB.Service({
      ros: this.props.ros,
      name: this.props.bt_namespace + "get_folder_structure",
      serviceType: "ros_bt_py_interfaces/srv/GetFolderStructure",
    });

    this.get_storage_folders_service = new ROSLIB.Service({
      ros: this.props.ros,
      name: this.props.bt_namespace + "get_storage_folders",
      serviceType: "ros_bt_py_interfaces/srv/GetStorageFolders",
    });

    this.save_service = new ROSLIB.Service({
      ros: this.props.ros,
      name: this.props.bt_namespace + "save_tree",
      serviceType: "ros_bt_py_interfaces/srv/SaveTree",
    });

    this.change_tree_name_service = new ROSLIB.Service({
      ros: this.props.ros,
      name: this.props.bt_namespace + "change_tree_name",
      serviceType: "ros_bt_py_interfaces/srv/ChangeTreeName",
    });

    this.get_storage_folders_service.callService(
      {} as GetStorageFoldersRequest,
      (response: GetStorageFoldersResponse) => {
        this.setState({
          storage_folders_fuse: new Fuse(response.storage_folders),
          storage_folder_results: response.storage_folders,
          storage_folders_loaded: true,
        });
      },
      (error: string) => {
        this.props.onError("Failed to retrive storage folders: " + error);
        this.setState({
          storage_folders_loaded: false,
        });
      }
    );

    if (this.props.last_selected_folder !== "") {
      this.selectFolderSearchResult(this.props.last_selected_folder);
    }
  }

  selectFolderSearchResult(result: string) {
    this.setState({
      storage_folder: result,
      storage_folder_results: [],
      selected_storage_folder: result,
      highlighted_package: null,
    });

    // get package structure
    this.get_folder_structure_service!.callService(
      {
        storage_folder: result,
        show_hidden: this.state.show_hidden,
      } as GetFolderStructureRequest,
      (response: GetFolderStructureResponse) => {
        if (response.success) {
          this.setState({
            storage_folder_structure: JSON.parse(
              response.storage_folder_structure
            ),
            selected_directory: 0,
          });
          this.props.onSelectedStorageFolderChange(result);
        } else {
          console.error(
            "error getting storage_folder structure: ",
            response.error_message
          );
        }
      }
    );
  }

  searchStorageFolderName(event: ChangeEvent<HTMLInputElement>) {
    if (this.state.storage_folders_fuse) {
      const results = this.state.storage_folders_fuse
        .search(event.target.value)
        .map((x) => x.item);
      this.setState({ storage_folder_results: results.slice(0, 5) });
    }
    this.setState({
      storage_folder: event.target.value,
      selected_storage_folder: null,
      highlighted_package: null,
    });
  }

  keyPressHandler(event: React.KeyboardEvent<HTMLInputElement>) {
    if (
      this.state.storage_folder_results &&
      this.state.storage_folder_results.length !== 0
    ) {
      if (event.key == "ArrowDown" || event.key == "ArrowUp") {
        // up or down arrow
        let package_to_highlight = 0;
        if (this.state.highlighted_package !== null) {
          let direction = 1;
          if (event.keyCode == 38) {
            direction = -1;
          }
          package_to_highlight = this.state.highlighted_package + direction;
          if (package_to_highlight < 0) {
            package_to_highlight = this.state.storage_folder_results.length - 1;
          }

          package_to_highlight %= this.state.storage_folder_results.length;
        }
        this.setState({ highlighted_package: package_to_highlight });
      } else if (event.key === "Enter") {
        if (this.state.highlighted_package !== null) {
          this.selectFolderSearchResult(
            this.state.storage_folder_results[this.state.highlighted_package]
          );
        }
      }
    }
  }

  renderFolderSearchResults(results: string[]) {
    if (results.length > 0) {
      const result_rows = results.map((x, i) => {
        return (
          <li
            key={x}
            className="list-group-item search-result align-items-start"
            onClick={() => this.selectFolderSearchResult(x)}
          >
            <div className="d-flex w-100 justify-content-between">
              <span
                className={
                  this.state.highlighted_package! === i
                    ? "search-result-highlighted"
                    : ""
                }
              >
                <i className="fas fa-cubes mx-1"></i>
                {x}
              </span>
              <i className="fas fa-file-code" title={x}></i>
            </div>
          </li>
        );
      });

      return (
        <div className="mb-2 search-results" ref={(node) => (this.node = node)}>
          <ul className="list-group">{result_rows}</ul>
        </div>
      );
    } else {
      return null;
    }
  }

  search(item_id: number, parent: PackageStructure) {
    const stack = [parent];
    while (stack.length > 0) {
      const node = stack.pop()!;
      if (node.item_id === item_id) {
        return node;
      }
      if (node.type === "directory") {
        stack.push(...node.children!);
      }
    }
    return stack.pop() || null;
  }

  render() {
    const compareStorageFolderContent = function (
      a: PackageStructure,
      b: PackageStructure
    ) {
      const t1 = a.type.toLowerCase();
      const t2 = b.type.toLowerCase();

      const n1 = a.name.toLowerCase();
      const n2 = b.name.toLowerCase();

      if (t1 < t2) {
        return -1;
      }
      if (t1 > t2) {
        return 1;
      }
      if (n1 < n2) {
        return -1;
      }
      if (n1 > n2) {
        return 1;
      }
      return 0;
    };

    let storage_folders_results: string[] = [];
    if (this.state.storage_folders_fuse) {
      if (this.state.storage_folder_results.length === 0) {
        if (this.state.storage_folder === "") {
          storage_folders_results = this.state.storage_folders_fuse
            .search("")
            .map((x) => x.item);
        }
      } else {
        storage_folders_results = this.state.storage_folder_results;
      }
    }

    let storage_folder_structure: JSX.Element | null = null;
    if (this.state.storage_folder_structure) {
      // this.state.selected_directory contains the level, is set to 0 (aka no element) by default
      let selected_directory = 0;
      // TODO: this is a bit of a hack
      if (this.state.selected_directory === 0) {
        // none selected, discard whole package structure
        this.setState({
          selected_directory: this.state.storage_folder_structure.item_id,
        });
        selected_directory = this.state.storage_folder_structure.item_id;
      } else {
        selected_directory = this.state.selected_directory!;
      }

      const tree = this.search(
        selected_directory,
        this.state.storage_folder_structure
      );
      if (tree === null) {
        console.error("Package structure tree is null!");
        return;
      }

      let par = tree.parent;
      const path: string[] = [];
      const extended_path = [];
      if (par !== 0) {
        path.push(tree.name);
        extended_path.push({
          name: tree.name,
          item_id: tree.item_id,
        });
      }
      while (par && par !== 0) {
        const node = this.search(par, this.state.storage_folder_structure);
        if (node === null) {
          console.error("Node is null!");
          continue;
        }

        par = node.parent;
        if (par !== 0) {
          path.unshift(node.name);
          extended_path.unshift({
            name: node.name,
            item_id: node.item_id,
          });
        }
      }

      const write_mode_select = (
        <select
          className="form-select"
          value={this.state.write_mode}
          onChange={(event) => {
            this.setState({ write_mode: event.target.value });
          }}
        >
          <option value="ask">ask before overwrite</option>
          <option value="overwrite">overwrite file</option>
          <option value="rename">rename file</option>
        </select>
      );

      const open_save_button = (
        <button
          className="btn btn-primary w-30 m-1"
          disabled={!this.state.file_path}
          type="button"
          onClick={() => {
            let save_file_path = this.state.file_path;
            if (save_file_path === null) {
              return;
            }

            if (this.state.file_type_filter !== "all") {
              // check if the file_path ends with the extension in file_type_filter
              if (!save_file_path.endsWith(this.state.file_type_filter)) {
                save_file_path += this.state.file_type_filter;
              }
            }

            let overwrite = false;
            let rename = false;
            if (this.state.write_mode === "overwrite") {
              overwrite = true;
              rename = false;
            } else if (this.state.write_mode === "rename") {
              overwrite = false;
              rename = true;
            } else if (this.state.write_mode === "ask") {
              overwrite = false;
              rename = false;
            }

            const request = {
              filepath: save_file_path,
              storage_path: this.state.storage_folder,
              tree: this.props.tree_message,
              allow_overwrite: overwrite,
              allow_rename: rename,
            } as SaveTreeRequest;

            this.save_service!.callService(
              request,
              (response: SaveTreeResponse) => {
                if (response.success) {
                  console.log("called SaveTree service successfully");
                  this.props.onChangeFileModal(null);
                } else {
                  if (
                    this.state.write_mode === "ask" &&
                    response.error_message === "Overwrite not allowed"
                  ) {
                    if (
                      window.confirm(
                        "Do you want to overwrite " + save_file_path + "?"
                      )
                    ) {
                      request.allow_overwrite = true;
                      this.save_service!.callService(
                        request,
                        (response: SaveTreeResponse) => {
                          if (response.success) {
                            console.log("called SaveTree service successfully");
                            this.props.onChangeFileModal(null);
                            const change_tree_name_request = {
                              name: this.state.selected_file,
                            } as ChangeTreeNameRequest;
                            this.change_tree_name_service!.callService(
                              change_tree_name_request,
                              (
                                change_tree_name_response: ChangeTreeNameResponse
                              ) => {
                                if (change_tree_name_response.success) {
                                  console.log("Successfully changed tree name");
                                } else {
                                  console.log("Could not change tree name");
                                }
                              }
                            );
                          } else {
                            this.setState({
                              error_message: response.error_message,
                            });
                          }
                        },
                        () => {
                          this.setState({
                            error_message: "Error saving tree",
                          });
                        }
                      );
                    } else {
                      this.setState({
                        error_message: response.error_message,
                      });
                    }
                  } else {
                    this.setState({ error_message: response.error_message });
                  }
                }
              },
              () => {
                this.setState({ error_message: "Error saving tree" });
              }
            );
          }}
        >
          <i className="fas fa-save"></i> Generate Subtree
        </button>
      );

      storage_folder_structure = (
        <div>
          <div className="d-flex flex-row align-items-center m-2">
            <button
              type="button"
              className="btn btn-primary w-60 m-1"
              onClick={() => {
                if (tree!.parent === 0) {
                  this.setState({
                    storage_folder_structure: null,
                    storage_folder: "",
                    selected_storage_folder: null,
                    file_path: null,
                    selected_file: "",
                    highlighted: null,
                  });
                } else {
                  this.setState({
                    selected_directory: tree!.parent,
                    file_path: null,
                    selected_file: "",
                    highlighted: null,
                  });
                }
              }}
            >
              <i className="fas fa-arrow-left"></i> Back
            </button>
            {open_save_button}
            <select
              className="m-1 form-select"
              value={this.state.file_type_filter}
              onChange={(event) => {
                this.setState({ file_type_filter: event.target.value });
              }}
            >
              <option value="all">all files</option>
              <option value=".yaml">.yaml files</option>
            </select>
            {write_mode_select}
          </div>
          <div className="d-flex flex-row align-items-center m-2">
            <div className="input-group m-1">
              <label className="input-group-text">Name:</label>
              <input
                className="form-control"
                type="text"
                placeholder="Tree File Name"
                ref={(input) => input && input.focus()}
                onChange={(event) => {
                  const file_path = path.concat(event.target.value);
                  const relative_path = file_path.join("/");
                  this.setState({
                    file_path: relative_path,
                    selected_file: event.target.value,
                  });
                }}
                value={this.state.selected_file}
              />
            </div>
          </div>
          <p>
            <span
              className="filebrowser-bar border border-primary rounded p-1 m-1"
              onClick={() => {
                this.setState({
                  selected_directory: 1, // directory 1 is top level
                  file_path: null,
                  selected_file: "",
                  highlighted: null,
                });
              }}
            >
              {this.state.storage_folder_structure.name}
            </span>
            {extended_path.map((element) => {
              return (
                <span
                  className="filebrowser-bar border border-secondary rounded p-1 m-1"
                  onClick={() => {
                    this.setState({
                      selected_directory: element.item_id,
                      file_path: null,
                      selected_file: "",
                      highlighted: null,
                    });
                  }}
                >
                  {element.name}
                </span>
              );
            })}
          </p>
          <ul className="list-group overflow-auto" style={{ height: "60vh" }}>
            {tree!.children!.sort(compareStorageFolderContent).map((child) => {
              let icon = <i className="fas fa-file-code mx-1"></i>;
              if (child.type === "directory") {
                icon = <i className="fas fa-folder mx-1"></i>;
              }
              if (
                child.type === "file" &&
                this.state.file_type_filter !== "all"
              ) {
                if (!child.name.endsWith(this.state.file_type_filter)) {
                  return null;
                }
              }
              return (
                <li
                  className="cursor-pointer list-group-item"
                  onClick={() => {
                    if (child.type === "file") {
                      const file_path = path.concat(child.name);
                      const relative_path = file_path.join("/");
                      this.setState({
                        file_path: relative_path,
                        selected_file: child.name,
                        highlighted: child.item_id,
                      });
                    } else {
                      if (child.type === "directory") {
                        this.setState({
                          selected_directory: child.item_id,
                          file_path: null,
                          selected_file: "",
                        });
                      }
                    }
                  }}
                >
                  {icon} {child.name}
                </li>
              );
            })}
          </ul>
        </div>
      );
    }

    let title = "Generate Subtree";
    if (!this.state.storage_folders_loaded) {
      title += ". Please wait, storage folder list is loading...";
    }

    let package_name_element = null;
    if (this.state.storage_folder_structure) {
      package_name_element = (
        <input
          className="form-control"
          type="text"
          value={this.state.storage_folder}
          disabled={true}
        />
      );
    } else {
      package_name_element = (
        <input
          className="form-control"
          type="text"
          ref={(input) => input && input.focus()}
          value={this.state.storage_folder}
          disabled={false}
          onChange={this.searchStorageFolderName}
          onKeyDown={this.keyPressHandler}
        />
      );
    }

    return (
      <div>
        <div className="d-flex justify-content-between">
          <button
            className="btn btn-primary w-30 m-1"
            onClick={() => {
              this.props.onChangeFileModal(null);
            }}
          >
            <i className="fas fa-times-circle"></i> Cancel
          </button>
          <span className="disconnected">{this.state.error_message}</span>
        </div>
        <h2>{title}</h2>
        <div className="d-flex flex-column">
          <div className="input-group m-1">
            <label className="input-group-text">Package:</label>
            {package_name_element}
          </div>
          {this.renderFolderSearchResults(storage_folders_results)}
        </div>
        {storage_folder_structure}
      </div>
    );
  }
}
