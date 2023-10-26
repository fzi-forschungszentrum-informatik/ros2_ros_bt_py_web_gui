import React, { ChangeEvent, Component } from "react";
import ROSLIB from "roslib";
import { Package, PackageStructure, TreeMsg } from "../types/types";
import Fuse from "fuse.js";
import {
  ChangeTreeNameRequest,
  ChangeTreeNameResponse,
} from "../types/services/ChangeTreeName";
import { LoadTreeRequest, LoadTreeResponse } from "../types/services/LoadTree";
import {
  MigrateTreeRequest,
  MigrateTreeResponse,
} from "../types/services/MigrateTree";
import {
  GetPackageStructureRequest,
  GetPackageStructureResponse,
} from "../types/services/GetPackageStructure";

interface LoadPackageFileBrowserProps {
  ros: ROSLIB.Ros;
  bt_namespace: string;
  packagesFuse: Fuse<Package>;
  packages_available: boolean;
  onError: (error_message: string) => void;
  tree_message: TreeMsg | null;
  last_selected_package: string;
  onChangeFileModal: (mode: string | null) => void;
  onSelectedPackageChange: (new_selected_package_name: string) => void;
}

interface LoadPackageFileBrowserState {
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

export class LoadPackageFileBrowser extends Component<
  LoadPackageFileBrowserProps,
  LoadPackageFileBrowserState
> {
  get_package_structure_service?: ROSLIB.Service<
    GetPackageStructureRequest,
    GetPackageStructureResponse
  >;

  load_service?: ROSLIB.Service<LoadTreeRequest, LoadTreeResponse>;
  change_tree_name_service?: ROSLIB.Service<
    ChangeTreeNameRequest,
    ChangeTreeNameResponse
  >;
  node?: HTMLDivElement | null;

  constructor(props: LoadPackageFileBrowserProps) {
    super(props);

    this.state = {
      package: "",
      selected_package: null,
      package_results: this.props.packagesFuse
        .search("")
        .flatMap<Package>((x) => {
          return x.item;
        }),
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

    this.load_service = new ROSLIB.Service({
      ros: this.props.ros,
      name: this.props.bt_namespace + "load_tree",
      serviceType: "ros_bt_py_interfaces/srv/LoadTree",
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

  keyPressHandler(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.keyCode == 38 || event.keyCode == 40) {
      // up or down arrow
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
          console.log(
            "error getting package structure: ",
            response.error_message
          );
        }
      }
    );
  }

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

  open() {
    const msg = {
      path: "package://" + this.state.package + "/" + this.state.file_path,
    };

    console.log("loading... ", msg.path);

    // do a version check before loading
    this.load_service!.callService(
      {
        tree: msg,
        permissive: false,
      } as LoadTreeRequest,
      (response: LoadTreeResponse) => {
        if (response.success) {
          console.log("called LoadTree service successfully");
          this.props.onChangeFileModal(null);
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
                    console.log("called LoadTree service successfully");
                    this.props.onChangeFileModal(null);
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
          error_message: "Error loading tree, is your yaml file correct? ",
        });
      }
    );
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

      const open_save_button = (
        <button
          className="btn btn-primary w-30 ms-1"
          disabled={!this.state.file_path}
          onClick={this.open}
          type="button"
        >
          <i className="fas fa-folder-open"></i> Open
        </button>
      );

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

    let title = "Load tree from package";

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
          placeholder="Seach Package Name"
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
          {this.renderPackageSearchResults(package_results)}
        </div>
        {package_structure}
      </div>
    );
  }
}
