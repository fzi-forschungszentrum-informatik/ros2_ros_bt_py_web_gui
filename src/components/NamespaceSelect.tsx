import { ChangeEvent, Component } from "react";
import ROSLIB from "roslib";
import {
  ServicesForTypeRequest,
  ServicesForTypeResponse,
} from "../types/services/ServicesForType";
interface NamespaceSelectProps {
  ros: ROSLIB.Ros;
  ros_url: string;
  connected: boolean;
  packages_available: boolean;
  messages_available: boolean;
  currentNamespace: string;
  onNamespaceChange: (namespace: string) => void;
  onError: (error_msg: string) => void;
}

interface NamespaceSelectState {
  available_namespaces: string[];
  edit: boolean;
  ros_uri: string;
}

export class NamespaceSelect extends Component<
  NamespaceSelectProps,
  NamespaceSelectState
> {
  servicesForTypeClient?: ROSLIB.Service<
    ServicesForTypeRequest,
    ServicesForTypeResponse
  >;
  constructor(props: NamespaceSelectProps) {
    super(props);

    this.state = {
      available_namespaces: [],
      edit: false,
      ros_uri: props.ros_url,
    };

    this.updateAvailableNamespaces = this.updateAvailableNamespaces.bind(this);
    this.changeRosbridgeServer = this.changeRosbridgeServer.bind(this);
    this.editRosbridgeServer = this.editRosbridgeServer.bind(this);
    this.saveRosbridgeServer = this.saveRosbridgeServer.bind(this);
    this.handleNamespaceChange = this.handleNamespaceChange.bind(this);
  }

  componentDidMount() {
    this.servicesForTypeClient = new ROSLIB.Service({
      ros: this.props.ros,
      name: "/rosapi/services_for_type",
      serviceType: "rosapi/ServicesForType",
    });

    this.updateAvailableNamespaces();
  }

  updateAvailableNamespaces() {
    this.servicesForTypeClient!.callService(
      // Search for all Tree topics - we expect each BT node to
      // publish one of these, and also offer the corresponding
      // editing and runtime control services.
      {
        type: "ros_bt_py_interfaces/srv/AddNode",
      } as ServicesForTypeRequest,
      (response: ServicesForTypeResponse) => {
        const namespaces = response.services.map(
          // Chop off the topic name (but not the last slash), which leaves us with the BT
          // namespace
          (x) => x.substr(0, x.lastIndexOf("/")) + "/"
        );
        this.setState({
          available_namespaces: namespaces,
        });
        if (this.props.currentNamespace === "" && namespaces.length > 0) {
          this.props.onNamespaceChange(namespaces[0]);
        }
      }
    );
  }

  changeRosbridgeServer(event: ChangeEvent<HTMLInputElement>) {
    this.setState({ ros_uri: event.target.value });
  }

  editRosbridgeServer() {
    if (this.state.edit) {
      this.setState({ edit: false });
    } else {
      console.log("edit rosbridge server");
      this.setState({ edit: true });
    }
  }

  saveRosbridgeServer() {
    console.log("save rosbridge server ");

    this.setState({ edit: false });

    const old_uri = window.location.toString();
    let new_uri = old_uri;
    if (window.location.search.length > 0) {
      new_uri = old_uri.replace(
        window.location.search,
        "?ros_uri=" + this.state.ros_uri
      );
    } else {
      new_uri = old_uri + "?ros_uri=" + this.state.ros_uri;
    }
    if (old_uri != new_uri) {
      window.location.assign(new_uri);
    }
  }

  handleNamespaceChange(event: ChangeEvent<HTMLSelectElement>) {
    this.props.onNamespaceChange(event.target.value);
  }

  render() {
    let edit = null;
    if (this.state.edit) {
      edit = (
        <div className="d-flex flex-row align-items-center">
          <div className="input-group m-1">
            <label className="input-group-text">Rosbridge Server:</label>
            <input
              className="form-control"
              type="text"
              placeholder="Websocket URL"
              aria-describedby="websocketURL"
              aria-label="Websocket URL"
              value={this.state.ros_uri}
              onChange={this.changeRosbridgeServer}
            />
            <button
              type="button"
              onClick={this.saveRosbridgeServer.bind(this)}
              className="btn btn-primary"
            >
              Save
            </button>
          </div>
        </div>
      );
    }

    let connection_state;

    if (this.props.connected) {
      if (this.props.messages_available) {
        if (this.props.packages_available) {
          connection_state = (
            <div key="connection_status_connected">
              <span
                aria-hidden="true"
                title="Connected"
                className="fas fa-wifi connected"
              />
            </div>
          );
        } else {
          connection_state = (
            <div key="connection_status_package">
              <span
                aria-hidden="true"
                title="Connected, package list not (yet) available. File browser will not work."
                className="fas fa-wifi packages-missing"
              />
            </div>
          );
        }
      } else {
        connection_state = (
          <div key="connection_status_message">
            <span
              aria-hidden="true"
              title="Connected, message info not (yet) available. ROS-type autocompletion will not work."
              className="fas fa-wifi messages-missing"
            />
          </div>
        );
      }
    } else {
      connection_state = (
        <div key="connection_status_disconnected">
          <span
            aria-hidden="true"
            title="Disconnected"
            className="fas fa-wifi disconnected"
          />
        </div>
      );
    }

    return (
      <>
        {connection_state}
        <div className="d-flex flex-row align-items-center">
          <label className="ms-1">Namespace:</label>
          <select
            className="form-select ms-1"
            value={this.props.currentNamespace}
            onChange={this.handleNamespaceChange}
          >
            {this.state.available_namespaces.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="btn btn-sm m-1"
          onClick={this.updateAvailableNamespaces}
        >
          <span aria-hidden="true" className="fas fa-sync" />
          <span className="sr-only">Refresh Namespaces</span>
        </button>
        <button
          type="button"
          className="btn btn-sm m-1"
          onClick={this.editRosbridgeServer}
        >
          <span aria-hidden="true" className="fas fa-cog" />
          <span className="sr-only">Edit rosbridge server</span>
        </button>
        {edit}
      </>
    );
  }
}
