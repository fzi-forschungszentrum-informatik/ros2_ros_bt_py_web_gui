import React, { Component } from "react";
import { NodeListItem } from "./NodeListItem";
import { DocumentedNode } from "../types/types";

interface NodeListProps {
  availableNodes: DocumentedNode[];
  filtered_nodes: DocumentedNode[] | null;
  getNodes: (package_name: string) => void;
  dragging_node_list_item: DocumentedNode | null;
  onSelectionChange: (node: DocumentedNode) => void;
  onNodeListDragging: (dragging: DocumentedNode | null) => void;
}

interface NodeListState {
  node_list_collapsed: boolean;
}

export class NodeList extends Component<NodeListProps, NodeListState> {
  constructor(props: NodeListProps) {
    super(props);

    this.state = {
      node_list_collapsed: false,
    };
  }

  componentDidMount() {
    this.props.getNodes("");
  }

  toggleNodeListCollapsed(event: React.MouseEvent<HTMLDivElement>) {
    const previous_state = this.state.node_list_collapsed;
    this.setState({ node_list_collapsed: !previous_state });
    event.stopPropagation();
  }

  render() {
    const byName = function (a: DocumentedNode, b: DocumentedNode) {
      if (a.node_class < b.node_class) {
        return -1;
      } else if (a.node_class > b.node_class) {
        return 1;
      }

      return 0;
    };

    const moduleThenName = function (a: DocumentedNode, b: DocumentedNode) {
      if (a.module < b.module) {
        return -1;
      } else if (a.module > b.module) {
        return 1;
      }

      return byName(a, b);
    };

    let nodes = this.props.availableNodes.sort(byName);
    nodes = nodes.sort(moduleThenName);

    if (this.props.filtered_nodes && this.props.filtered_nodes.length > 0) {
      nodes = this.props.filtered_nodes;
    }

    let items: JSX.Element[] | null = nodes.map((node) => {
      let highlighted = false;
      if (
        this.props.dragging_node_list_item &&
        this.props.dragging_node_list_item.module === node.module &&
        this.props.dragging_node_list_item.node_class === node.node_class
      ) {
        highlighted = true;
      }
      return (
        <NodeListItem
          node={node}
          key={node.module + node.node_class}
          collapsed={true}
          highlighted={highlighted}
          onSelectionChange={this.props.onSelectionChange}
          onDragging={this.props.onNodeListDragging}
        />
      );
    });

    let node_list_collapsible_icon = "fas fa-angle-up";

    if (this.state.node_list_collapsed) {
      node_list_collapsible_icon = "fas fa-angle-down";
      items = null;
    }

    return (
      <div className="available-nodes m-1">
        <div className="vertical_list">
          <div className="border rounded mb-2">
            <div
              onClick={this.toggleNodeListCollapsed.bind(this)}
              className="text-center cursor-pointer font-weight-bold m-2"
            >
              Node List{" "}
              <i key={node_list_collapsible_icon}>
                <span className={node_list_collapsible_icon} />
              </i>
            </div>
            {items}
          </div>
        </div>
      </div>
    );
  }
}
