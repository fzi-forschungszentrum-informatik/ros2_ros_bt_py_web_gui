import React, { ChangeEvent, Component, Fragment, createRef } from "react";
import ROSLIB from "roslib";
import { LoadTreeRequest, LoadTreeResponse } from "../types/services/LoadTree";
import {
  MigrateTreeRequest,
  MigrateTreeResponse,
} from "../types/services/MigrateTree";
import {
  ControlTreeExecutionRequest,
  ControlTreeExecutionResponse,
  TreeExecutionCommands,
} from "../types/services/ControlTreeExecution";
import { SaveTreeRequest, SaveTreeResponse } from "../types/services/SaveTree";
import { FixYamlRequest, FixYamlResponse } from "../types/services/FixYaml";
import {
  ClearTreeRequest,
  ClearTreeResponse,
} from "../types/services/ClearTree";
import { TreeMsg } from "../types/types";
import jsyaml from "js-yaml";

interface LoadSaveControlsProps {
  ros: ROSLIB.Ros;
  bt_namespace: string;
  tree_message: TreeMsg | null;
  onError: (error_message: string) => void;
  onNewRunningCommand: (command: TreeExecutionCommands) => void;
  onRunningCommandCompleted: (command: TreeExecutionCommands) => void;
  onChangeFileModal: (mode: string | null) => void;
}

export class LoadSaveControls extends Component<LoadSaveControlsProps> {
  fileref: React.RefObject<HTMLInputElement>;
  fileReader: FileReader;
  load_service?: ROSLIB.Service<LoadTreeRequest, LoadTreeResponse>;
  check_node_versions_service?: ROSLIB.Service<
    MigrateTreeRequest,
    MigrateTreeResponse
  >;
  migrate_tree_service?: ROSLIB.Service<
    MigrateTreeRequest,
    MigrateTreeResponse
  >;
  fix_yaml_service?: ROSLIB.Service<FixYamlRequest, FixYamlResponse>;
  clear_service?: ROSLIB.Service<ClearTreeRequest, ClearTreeResponse>;
  save_tree_service?: ROSLIB.Service<SaveTreeRequest, SaveTreeResponse>;
  control_tree_execution_service?: ROSLIB.Service<
    ControlTreeExecutionRequest,
    ControlTreeExecutionResponse
  >;

  constructor(props: LoadSaveControlsProps) {
    super(props);
    this.fileref = createRef();
    this.fileReader = new FileReader();
  }

  componentDidMount() {
    this.load_service = new ROSLIB.Service({
      ros: this.props.ros,
      name: this.props.bt_namespace + "load_tree",
      serviceType: "ros_bt_py_msgs/LoadTree",
    });

    this.check_node_versions_service = new ROSLIB.Service({
      ros: this.props.ros,
      name: this.props.bt_namespace + "check_node_versions",
      serviceType: "ros_bt_py_msgs/MigrateTree",
    });

    this.migrate_tree_service = new ROSLIB.Service({
      ros: this.props.ros,
      name: this.props.bt_namespace + "migrate_tree",
      serviceType: "ros_bt_py_msgs/MigrateTree",
    });

    this.fix_yaml_service = new ROSLIB.Service({
      ros: this.props.ros,
      name: this.props.bt_namespace + "fix_yaml",
      serviceType: "ros_bt_py_msgs/FixYaml",
    });

    this.clear_service = new ROSLIB.Service({
      ros: this.props.ros,
      name: this.props.bt_namespace + "clear",
      serviceType: "ros_bt_py_msgs/ClearTree",
    });

    this.save_tree_service = new ROSLIB.Service({
      ros: this.props.ros,
      name: this.props.bt_namespace + "save_tree",
      serviceType: "ros_bt_py_msgs/SaveTree",
    });

    this.control_tree_execution_service = new ROSLIB.Service({
      ros: this.props.ros,
      name: this.props.bt_namespace + "control_tree_execution",
      serviceType: "ros_bt_py_msgs/ControlTreeExecution",
    });
  }

  openFileDialog() {
    if (this.fileref.current === null) {
      console.error("Fileref is null!");
      return;
    }
    this.fileref.current.click();
  }

  loadTreeMsg(msg: TreeMsg) {
    // do a version check before loading
    this.check_node_versions_service!.callService(
      {
        tree: msg,
      } as MigrateTreeRequest,
      (response: MigrateTreeResponse) => {
        if (response.success) {
          console.log("called check version service successfully");
          if (response.migrated) {
            console.log("migration needed");
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
                    console.log("called MigrateTree service successfully");
                    this.load_service!.callService(
                      {
                        tree: response.tree,
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
                                    console.log(
                                      "called LoadTree service successfully"
                                    );
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
                  console.log("called LoadTree service successfully");
                  this.props.onChangeFileModal(null);
                } else {
                  console.log("err:", response.error_message);

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

  handleFileRead(event: ProgressEvent<FileReader>) {
    let msgs: TreeMsg[] = [];
    try {
      if (this.fileReader.result === null) {
        console.error("File result is null!");
        return;
      }
      const file_text: string = this.fileReader.result as string;
      msgs = jsyaml.loadAll(file_text) as TreeMsg[];
      let msg: TreeMsg | null = null;
      for (let i = 0; i < msgs.length; i++) {
        if (msgs[i] != null) {
          msg = msgs[i];
        }
      }

      this.loadTreeMsg(msg!);
    } catch (e) {
      // try fixing the YAML error
      this.fix_yaml_service!.callService(
        {
          broken_yaml: this.fileReader.result,
        } as FixYamlRequest,
        (response: FixYamlResponse) => {
          if (response.success) {
            msgs = jsyaml.loadAll(response.fixed_yaml) as TreeMsg[];
            let msg = null;
            for (let i = 0; i < msgs.length; i++) {
              if (msgs[i] != null) {
                msg = msgs[i];
              }
            }
            this.loadTreeMsg(msg!);
          }
        },
        (failed) => {
          this.props.onError(
            "Error loading tree, is your yaml file correct? " + failed
          );
        }
      );
    }
  }

  downloadURI(uri: string, name: string) {
    const link = document.createElement("a");
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  newTree() {
    if (
      window.confirm(
        "Do you want to create a new tree? Warning: This will discard the tree that is loaded at the moment."
      )
    ) {
      this.clear_service!.callService(
        {} as ClearTreeRequest,
        (response: ClearTreeResponse) => {
          if (response.success) {
            console.log("called ClearTree service successfully");
          } else {
            this.props.onError(response.error_message);
          }
        },
        (failed) => {
          this.props.onError("Error clearing tree " + failed);
        }
      );
    }
  }

  loadTree(event: ChangeEvent<HTMLInputElement>) {
    this.fileReader.onloadend = this.handleFileRead.bind(this);
    this.fileReader.readAsText(event.target.files![0]);
  }

  saveTree(_event: React.MouseEvent<HTMLButtonElement>) {
    this.props.onNewRunningCommand(6);
    this.control_tree_execution_service!.callService(
      {
        // TICK_ONCE = 1
        // TICK_PERIODICALLY = 2
        // TICK_UNTIL_RESULT = 3
        // STOP = 4
        // RESET = 5
        // SHUTDOWN = 6
        // SETUP_AND_SHUTDOWN = 7
        command: 6,
      } as ControlTreeExecutionRequest,
      (response: ControlTreeExecutionResponse) => {
        this.props.onRunningCommandCompleted(6);
        if (
          response.success ||
          window.confirm(
            "Could not shutdown tree before saving. Do you want to try saving anyway? Error message: \n" +
              response.error_message
          )
        ) {
          console.log("called ControlTreeExecution service successfully");

          const tree = this.props.tree_message;
          if (tree === null) {
            console.error("Tree is null!");
            return;
          }
          // remove inputs / outputs
          for (const node in tree.nodes) {
            for (const node_input in tree.nodes[node].inputs) {
              tree.nodes[node].inputs[node_input].serialized_value = "null";
            }
            for (const node_output in tree.nodes[node].outputs) {
              tree.nodes[node].outputs[node_output].serialized_value = "null";
            }
          }
          const msg = jsyaml.dump(tree);

          this.downloadURI(
            "data:text/plain," + encodeURIComponent(msg),
            "tree.yaml"
          );
        }
      }
    );
  }

  loadFromPackage(event: React.MouseEvent<HTMLButtonElement>) {
    this.props.onChangeFileModal("load");
  }

  saveToPackage(event: React.MouseEvent<HTMLButtonElement>) {
    this.props.onNewRunningCommand(6);
    this.control_tree_execution_service!.callService(
      {
        // TICK_ONCE = 1
        // TICK_PERIODICALLY = 2
        // TICK_UNTIL_RESULT = 3
        // STOP = 4
        // RESET = 5
        // SHUTDOWN = 6
        // SETUP_AND_SHUTDOWN = 7
        command: 6,
      } as ControlTreeExecutionRequest,
      (response: ControlTreeExecutionResponse) => {
        this.props.onRunningCommandCompleted(6);
        if (response.success) {
          this.props.onChangeFileModal("save");
        } else {
          this.props.onError(
            "Could not shutdown tree before saving:" + response.error_message
          );

          if (
            window.confirm(
              "Could not shutdown tree before saving. Do you want to try saving anyway? Error message: \n" +
                response.error_message
            )
          ) {
            this.props.onChangeFileModal("save");
          }
        }
      }
    );
  }

  render() {
    return (
      <Fragment>
        <button
          onClick={this.newTree.bind(this)}
          className="btn btn-primary ms-1"
          title="New tree"
        >
          <i className="fas fa-file show-button-icon"></i>
          <span className="ms-1 hide-button-text">New</span>
        </button>
        <button
          onClick={this.loadFromPackage.bind(this)}
          className="btn btn-primary ms-1"
          title="Load from package"
        >
          <i className="fas fa-folder show-button-icon"></i>
          <span className="ms-1 hide-button-text">Load</span>
        </button>
        <button
          onClick={this.saveToPackage.bind(this)}
          className="btn btn-primary ms-1"
          title="Save to package"
        >
          <i className="fas fa-save show-button-icon"></i>
          <span className="ms-1 hide-button-text">Save</span>
        </button>
        <div>
          <input
            ref={this.fileref}
            type="file"
            style={{ display: "none" }}
            onChange={this.loadTree.bind(this)}
          />
          <button
            onClick={this.openFileDialog.bind(this)}
            className="btn btn-primary ms-1"
            title="Upload"
          >
            <i className="fas fa-file-upload show-button-icon"></i>
            <span className="ms-1 hide-button-text">Upload</span>
          </button>
        </div>
        <button
          onClick={this.saveTree.bind(this)}
          className="btn btn-primary m-1"
          title="Download"
        >
          <i className="fas fa-file-download show-button-icon"></i>
          <span className="ms-1 hide-button-text">Download</span>
        </button>
      </Fragment>
    );
  }
}
