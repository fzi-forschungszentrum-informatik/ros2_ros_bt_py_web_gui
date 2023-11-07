import { Component } from "react";
import ROSLIB from "roslib";
import { NodeDataWiring } from "../types/types";
import {
  WireNodeDataRequest,
  WireNodeDataResponse,
} from "../types/services/WireNodeData";

interface BehaviorTreeEdgeProperties {
  edge: NodeDataWiring;
  key: string;
  ros: ROSLIB.Ros;
  bt_namespace: string;
  onSelectionChange: (new_selected_node_name: string | null) => void;
  unsetSelectedEdge: () => void;
  onError: (error_msg: string) => void;
}

export class BehaviorTreeEdge extends Component<BehaviorTreeEdgeProperties> {
  unwireClient?: ROSLIB.Service<WireNodeDataRequest, WireNodeDataResponse>;

  constructor(props: BehaviorTreeEdgeProperties) {
    super(props);

    this.onClickDelete = this.onClickDelete.bind(this);
  }

  componentDidMount() {
    this.unwireClient = new ROSLIB.Service({
      ros: this.props.ros,
      name: this.props.bt_namespace + "unwire_data",
      serviceType: "ros_bt_py_interfaces/srv/WireNodeData",
    });
  }

  onClickDelete() {
    this.props.unsetSelectedEdge();
    if (this.unwireClient !== undefined) {
      this.unwireClient.callService(
        {
          wirings: [
            {
              source: this.props.edge.source,
              target: this.props.edge.target,
            },
          ],
        } as WireNodeDataRequest,
        (response: WireNodeDataResponse) => {
          if (!response.success) {
            this.props.onError(response.error_message);
          }
        }
      );
    }
  }

  render() {
    return (
      <div className="d-flex flex-column">
        <div className="btn-group d-flex mb-2" role="group">
          <button className="btn btn-danger w-100" onClick={this.onClickDelete}>
            Delete Edge
          </button>
        </div>
        <div className="row">
          <div className="col">
            <a
              href="#"
              className="text-primary"
              onClick={() =>
                this.props.onSelectionChange(this.props.edge.source.node_name)
              }
            >
              {this.props.edge.source.node_name}.
            </a>
            <span>{this.props.edge.source.data_kind}.</span>
            <span>{this.props.edge.source.data_key}</span>
          </div>
          <div className="col">
            <span
              aria-hidden="true"
              className="fas fa-lg fa-long-arrow-alt-right"
            />
            <span className="sr-only">is connected to</span>
          </div>
          <div className="col">
            <a
              href="#"
              className="text-primary"
              onClick={() =>
                this.props.onSelectionChange(this.props.edge.target.node_name)
              }
            >
              {this.props.edge.target.node_name}.
            </a>
            <span>{this.props.edge.target.data_kind}.</span>
            <span>{this.props.edge.target.data_key}</span>
          </div>
        </div>
      </div>
    );
  }
}
