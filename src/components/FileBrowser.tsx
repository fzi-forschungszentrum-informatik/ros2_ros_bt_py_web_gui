import React, { ChangeEvent, Component } from "react";
import ROSLIB from "roslib";
import { Package, PackageStructure, TreeMsg } from "../types/types";
import Fuse from "fuse.js";
import {
  ChangeTreeNameRequest,
  ChangeTreeNameResponse,
} from "../types/services/ChangeTreeName";
import { LoadTreeRequest, LoadTreeResponse } from "../types/services/LoadTree";
import { SaveTreeRequest, SaveTreeResponse } from "../types/services/SaveTree";
import {
  MigrateTreeRequest,
  MigrateTreeResponse,
} from "../types/services/MigrateTree";
import {
  GetPackageStructureRequest,
  GetPackageStructureResponse,
} from "../types/services/GetPackageStructure";

/**
 *Available modes of the FileBrowser.
 */
export enum FileBrowserMode {
  /** Load a tree using the FileBrowser. */
  LOAD = 0,
  /** Save a tree using the FileBrowser. */
  SAVE = 1,
  /** Disable the file browser. */
  DISABLED = 2,
}

/**
 * Propertis of the FileBrowser that are set on creation as static attributes.
 */
interface FileBrowserProps {
  /** Refernce to the ROS lib for service calls. */
  ros: ROSLIB.Ros;
  /** ROS namespace of the BT library node */
  bt_namespace: string;
  /** Fuzzy search instance for packages. */
  packagesFuse: Fuse<Package>;
  /** If a package list has been received from the BT library. */
  packages_available: boolean;
  /** Callback function to report an error in the web GUI. */
  onError: (error_message: string) => void;
  /** The mode of the file modal, either save or load. */
  mode: FileBrowserMode;
  /** The last ROS message containing the behavior tree. */
  tree_message: TreeMsg | null;
  /** Last package that was selected in the FileBrowser. */
  last_selected_package: string;
  /** Callback to report if the file modal should be opened over the regular GUI. */
  onChangeFileModal: (mode: FileBrowserMode) => void;
  /** Callback to report a change in the selected package. */
  onSelectedPackageChange: (new_selected_package_name: string) => void;
}

/**
 * The state of the FileBrowser component.
 * State changes cause re-renders.
 */
interface FileBrowserState {
  package: string;
  selected_package: string | null;
  package_results: Package[];
  show_hidden: false;
  package_structure: PackageStructure | null;
  selected_directory?: number;
  selected_file: string;
  file_path: string | null;
  file_type_filter: string;
  highlighted: number | null;
  highlighted_package: number | null;
  write_mode: string;
  error_message: string | null;
}

/**
 * File browser that allows to load and save trees to packages and absolute file paths.
 */
export class FileBrowser extends Component<FileBrowserProps, FileBrowserState> {
  /** ROS service call to get the structure of available ROS packages */
  get_package_structure_service?: ROSLIB.Service<
    GetPackageStructureRequest,
    GetPackageStructureResponse
  >;

  /** ROS service to check if the loaded version of a node is the most current */
  check_node_versions_service?: ROSLIB.Service<
    MigrateTreeRequest,
    MigrateTreeResponse
  >;

  /** ROS service to migrate a tree to the newest node versions. */
  migrate_tree_service?: ROSLIB.Service<
    MigrateTreeRequest,
    MigrateTreeResponse
  >;

  /** ROS service to load a tree from a URI */
  load_service?: ROSLIB.Service<LoadTreeRequest, LoadTreeResponse>;

  /** ROS service to save a tree to a URI */
  save_service?: ROSLIB.Service<SaveTreeRequest, SaveTreeResponse>;

  /** ROS service to change the name of a loaded tree */
  change_tree_name_service?: ROSLIB.Service<
    ChangeTreeNameRequest,
    ChangeTreeNameResponse
  >;

  /** Currently selected node from the search results. */
  node?: HTMLDivElement | null;

  constructor(props: FileBrowserProps) {
    super(props);

    this.state = {
      package: "",
      selected_package: null,
      package_results: [],
      show_hidden: false,
      package_structure: null,
      selected_directory: undefined,
      selected_file: "",
      file_path: null,
      file_type_filter: ".yaml",
      highlighted: null,
      highlighted_package: null,
      write_mode: "ask",
      error_message: null,
    };

    this.searchPackageName = this.searchPackageName.bind(this);
    this.keyPressHandler = this.keyPressHandler.bind(this);
    this.selectPackageSearchResult = this.selectPackageSearchResult.bind(this);
    this.open = this.open.bind(this);
  }

  componentDidMount() {
    this.get_package_structure_service = new ROSLIB.Service({
      ros: this.props.ros,
      name: this.props.bt_namespace + "get_package_structure",
      serviceType: "ros_bt_py_interfaces/srv/GetPackageStructure",
    });

    this.check_node_versions_service = new ROSLIB.Service({
      ros: this.props.ros,
      name: this.props.bt_namespace + "check_node_versions",
      serviceType: "ros_bt_py_interfaces/srv/MigrateTree",
    });

    this.migrate_tree_service = new ROSLIB.Service({
      ros: this.props.ros,
      name: this.props.bt_namespace + "migrate_tree",
      serviceType: "ros_bt_py_interfaces/srv/MigrateTree",
    });

    this.load_service = new ROSLIB.Service({
      ros: this.props.ros,
      name: this.props.bt_namespace + "load_tree",
      serviceType: "ros_bt_py_interfaces/srv/LoadTree",
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

    if (this.props.last_selected_package !== "") {
      this.selectPackageSearchResult(this.props.last_selected_package);
    }
  }

  /**
   * Search for the package after the input values in the search bar changed.
   *
   * @param event Change event containing the newly selected value from the input.
   */
  searchPackageName(event: ChangeEvent<HTMLInputElement>) {
    if (this.props.packagesFuse) {
      const results = this.props.packagesFuse
        .search(event.target.value)
        .map((x) => x.item);
      this.setState({ package_results: results.slice(0, 5) });
    }
    this.setState({
      package: event.target.value,
      selected_package: null,
      highlighted_package: null,
    });
  }

  /**
   * Highlight a new package after arrow input or select the current package.
   *
   * @param event Keyboard event within the packages list.
   */
  keyPressHandler(event: React.KeyboardEvent<HTMLInputElement>) {
    if (["ArrowUp", "ArrowDown"].includes(event.key)) {
      if (
        this.state.package_results &&
        this.state.package_results.length !== 0
      ) {
        let package_to_highlight = 0;
        if (this.state.highlighted_package !== null) {
          let direction = 1;
          if (event.keyCode == 38) {
            direction = -1;
          }
          package_to_highlight = this.state.highlighted_package + direction;
          if (package_to_highlight < 0) {
            package_to_highlight = this.state.package_results.length - 1;
          }

          package_to_highlight %= this.state.package_results.length;
        }
        this.setState({ highlighted_package: package_to_highlight });
      }
    } else if (event.key === "Enter") {
      if (
        this.state.package_results &&
        this.state.package_results.length !== 0
      ) {
        if (this.state.highlighted_package !== null) {
          this.selectPackageSearchResult(
            this.state.package_results[this.state.highlighted_package].package
          );
        }
      }
    }
  }

  /**
   * Handle the selection of a package during the search.
   *
   * @param result The identifier of the package that was selected in the search.
   */
  selectPackageSearchResult(result: string) {
    this.setState({
      package: result,
      package_results: [],
      selected_package: result,
      highlighted_package: null,
    });

    // get package structure
    this.get_package_structure_service!.callService(
      {
        package: result,
        show_hidden: this.state.show_hidden,
      } as GetPackageStructureRequest,
      (response: GetPackageStructureResponse) => {
        if (response.success) {
          this.setState({
            package_structure: JSON.parse(response.package_structure),
            selected_directory: 0,
          });
          this.props.onSelectedPackageChange(result);
        } else {
          console.error(
            "Faled to get package structure: ",
            response.error_message
          );
        }
      }
    );
  }

  /**
   * Render a list of package search results to be represented in the available package list.
   *
   * @param results List of packages received as search results.
   * @returns HTML representing the list of packages to be displayed in the list.
   */
  renderPackageSearchResults(results: Package[]) {
    if (results.length > 0) {
      const result_rows = results.map((x, i) => {
        return (
          <li
            className="list-group-item search-result align-items-start"
            onClick={() => this.selectPackageSearchResult(x.package)}
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
                {x.package}
              </span>
              <i className="fas fa-file-code" title={x.path}></i>
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

  /**
   * Load a tree from the package and file_path specified in the Component state.
   */
  open() {
    const msg = {
      path: "package://" + this.state.package + "/" + this.state.file_path,
    };

    // do a version check before loading
    this.check_node_versions_service!.callService(
      {
        tree: msg,
      } as MigrateTreeRequest,
      (response: MigrateTreeResponse) => {
        if (response.success) {
          if (response.migrated) {
            if (
              window.confirm(
                "The tree you want to load needs to be migrated, should this be tried?"
              )
            ) {
              this.migrate_tree_service!.callService(
                {
                  tree: msg,
                } as MigrateTreeRequest,
                (response: MigrateTreeResponse) => {
                  if (response.success) {
                    this.load_service!.callService(
                      {
                        tree: response.tree,
                        permissive: false,
                      } as LoadTreeRequest,
                      (response: LoadTreeResponse) => {
                        if (response.success) {
                          this.props.onChangeFileModal(
                            FileBrowserMode.DISABLED
                          );
                        } else {
                          if (
                            response.error_message.startsWith(
                              "Expected data to be of type type, got dict instead. Looks like failed jsonpickle decode,"
                            ) ||
                            response.error_message.startsWith(
                              "AttributeError, maybe a ROS Message definition changed."
                            )
                          ) {
                            this.props.onError(response.error_message);
                            if (
                              window.confirm(
                                "The tree you want to load seems to have nodes with invalid options, do you want to load it in permissive mode? WARNING: this will probably change some option values!"
                              )
                            ) {
                              this.load_service!.callService(
                                {
                                  tree: msg,
                                  permissive: true,
                                } as LoadTreeRequest,
                                (response: LoadTreeResponse) => {
                                  if (response.success) {
                                    this.props.onChangeFileModal(
                                      FileBrowserMode.DISABLED
                                    );
                                  } else {
                                    this.setState({
                                      error_message: response.error_message,
                                    });
                                  }
                                },
                                (failed) => {
                                  this.setState({
                                    error_message:
                                      "Error loading tree, is your yaml file correct? ",
                                  });
                                }
                              );
                            }
                          }
                          this.setState({
                            error_message: response.error_message,
                          });
                        }
                      },
                      (failed) => {
                        this.setState({
                          error_message:
                            "Error loading tree, is your yaml file correct? ",
                        });
                      }
                    );
                  } else {
                    this.setState({ error_message: response.error_message });
                  }
                },
                (failed) => {
                  this.setState({
                    error_message:
                      "Error loading tree, is your yaml file correct? ",
                  });
                }
              );
            } else {
              this.setState({ error_message: response.error_message });
            }
          } else {
            this.load_service!.callService(
              {
                tree: msg,
                permissive: false,
              } as LoadTreeRequest,
              (response: LoadTreeResponse) => {
                if (response.success) {
                  this.props.onChangeFileModal(FileBrowserMode.DISABLED);
                } else {
                  console.error("Failed to load tree:", response.error_message);

                  if (
                    response.error_message.startsWith(
                      "Expected data to be of type type, got dict instead. Looks like failed jsonpickle decode,"
                    ) ||
                    response.error_message.startsWith(
                      "AttributeError, maybe a ROS Message definition changed."
                    )
                  ) {
                    this.props.onError(response.error_message);
                    if (
                      window.confirm(
                        "The tree you want to load seems to have nodes with invalid options, do you want to load it in permissive mode? WARNING: this will probably change some option values!"
                      )
                    ) {
                      this.load_service!.callService(
                        {
                          tree: msg,
                          permissive: true,
                        } as LoadTreeRequest,
                        (response: LoadTreeResponse) => {
                          if (response.success) {
                            this.props.onChangeFileModal(
                              FileBrowserMode.DISABLED
                            );
                          } else {
                            this.setState({
                              error_message: response.error_message,
                            });
                          }
                        },
                        (failed) => {
                          this.setState({
                            error_message:
                              "Error loading tree, is your yaml file correct? ",
                          });
                        }
                      );
                    }
                  }
                  this.setState({ error_message: response.error_message });
                }
              },
              (failed) => {
                this.setState({
                  error_message:
                    "Error loading tree, is your yaml file correct? ",
                });
              }
            );
          }
        } else {
          this.setState({ error_message: response.error_message });
        }
      },
      (failed) => {
        this.setState({
          error_message: "Error loading tree, is your yaml file correct? ",
        });
      }
    );
  }

  /**
   * Find a item as a child of the given parent in the folder structure.
   *
   * @param item_id The name of the file in a folder structure to find.
   * @param parent The parent directory from which to start the search.
   * @returns The child package element with the specified id or null if not found.
   */
  search(item_id: number, parent: PackageStructure): PackageStructure | null {
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

  /**
   * Render the current state of the component as JSX elements.
   *
   * @returns JSX description of the FileBrowser.
   */
  render() {
    const comparePackageNames = function (a: Package, b: Package) {
      if (a.package === b.package) {
        return 0;
      }
      if (a.package < b.package) {
        return -1;
      }
      return 1;
    };

    const comparePackageContent = function (
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

    let package_results: Package[] = [];
    if (this.props.packagesFuse) {
      if (this.state.package_results.length === 0) {
        if (this.state.package === "") {
          package_results = this.props.packagesFuse
            .search("")
            .map((x) => x.item)
            .sort(comparePackageNames);
        }
      } else {
        package_results = this.state.package_results;
      }
    }

    let package_structure: JSX.Element | null = null;
    if (this.state.package_structure) {
      // this.state.selected_directory contains the level, is set to 0 (aka no element) by default
      let selected_directory = 0;
      // TODO: this is a bit of a hack
      if (this.state.selected_directory === 0) {
        // none selected, discard whole package structure
        this.setState({
          selected_directory: this.state.package_structure.item_id,
        });
        selected_directory = this.state.package_structure.item_id;
      } else {
        selected_directory = this.state.selected_directory!;
      }

      const tree = this.search(
        selected_directory,
        this.state.package_structure
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
        const node = this.search(par, this.state.package_structure);
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

      let open_save_button = null;
      let write_mode_select = null;
      if (this.props.mode === FileBrowserMode.LOAD) {
        open_save_button = (
          <button
            className="btn btn-primary w-30 ms-1"
            disabled={!this.state.file_path}
            onClick={this.open}
            type="button"
          >
            <i className="fas fa-folder-open"></i> Open
          </button>
        );
      } else if (this.props.mode === FileBrowserMode.SAVE) {
        write_mode_select = (
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
        open_save_button = (
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
              const debug_file_path =
                "package://" + this.state.package + "/" + save_file_path;
              console.log("saving... ", debug_file_path);

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
                filename: save_file_path,
                package: this.state.package,
                tree: this.props.tree_message,
                allow_overwrite: overwrite,
                allow_rename: rename,
              } as SaveTreeRequest;

              this.save_service!.callService(
                request,
                (response: SaveTreeResponse) => {
                  if (response.success) {
                    console.log("called SaveTree service successfully");
                    this.props.onChangeFileModal(FileBrowserMode.DISABLED);
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
                              console.log(
                                "called SaveTree service successfully"
                              );
                              this.props.onChangeFileModal(
                                FileBrowserMode.DISABLED
                              );
                              const change_tree_name_request = {
                                name: this.state.selected_file,
                              } as ChangeTreeNameRequest;
                              this.change_tree_name_service!.callService(
                                change_tree_name_request,
                                (
                                  change_tree_name_response: ChangeTreeNameResponse
                                ) => {
                                  if (change_tree_name_response.success) {
                                    console.log(
                                      "Successfully changed tree name"
                                    );
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
                          (failed) => {
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
                (failed) => {
                  this.setState({ error_message: "Error saving tree" });
                }
              );
            }}
          >
            <i className="fas fa-save"></i> Save
          </button>
        );
      }

      package_structure = (
        <div>
          <div className="d-flex flex-row align-items-center m-2">
            <button
              type="button"
              className="btn btn-primary w-60 m-1"
              onClick={() => {
                if (tree!.parent === 0) {
                  this.setState({
                    package_structure: null,
                    package: "",
                    selected_package: null,
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
                disabled={this.props.mode !== FileBrowserMode.SAVE}
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
              {this.state.package_structure.name}
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
            {tree!.children!.sort(comparePackageContent).map((child) => {
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

    let title = null;
    if (this.props.mode === FileBrowserMode.SAVE) {
      title = "Save tree to package";
    } else if (this.props.mode === FileBrowserMode.LOAD) {
      title = "Load tree from package";
    }

    if (!this.props.packages_available) {
      title += ". Please wait, package list is loading...";
    }

    let package_name_element = null;
    if (this.state.package_structure) {
      package_name_element = (
        <input
          className="form-control"
          type="text"
          value={this.state.package}
          disabled={true}
        />
      );
    } else {
      package_name_element = (
        <input
          className="form-control"
          type="text"
          ref={(input) => input && input.focus()}
          value={this.state.package}
          disabled={false}
          onChange={this.searchPackageName}
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
              this.props.onChangeFileModal(FileBrowserMode.DISABLED);
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
          {this.renderPackageSearchResults(package_results)}
        </div>
        {package_structure}
      </div>
    );
  }
}
