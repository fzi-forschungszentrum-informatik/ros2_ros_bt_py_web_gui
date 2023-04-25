import { Component } from "react";
import { getShortDoc, prettyprint_type } from "../utils";
import { DocumentedNode, NodeData } from "../types/types";

interface NodeListItemProps {
  node: DocumentedNode;
  collapsed: boolean;
  highlighted: boolean;
  onSelectionChange: (node: DocumentedNode) => void;
  onDragging: (dragging: DocumentedNode | null) => void;
}

interface NodeListItemState {
  collapsed: boolean;
}

export class NodeListItem extends Component<
  NodeListItemProps,
  NodeListItemState
> {
  constructor(props: NodeListItemProps) {
    super(props);
    this.state = {
      collapsed: this.props.collapsed,
    };
  }

  renderIOTable(nodedata_list: NodeData[], title: string) {
    // If there are no items in the list, don't generate any DOM
    // elements.
    if (nodedata_list.length == 0) {
      return null;
    }
    const rows = nodedata_list.map((data) => {
      return (
        <tr key={title + data.key}>
          <td title={data.key} className="io_key text-truncate maxw0">
            {data.key}
          </td>
          <td
            title={prettyprint_type(data.serialized_value)}
            className="io_type text-truncate maxw0 text-muted pl-2"
          >
            {prettyprint_type(data.serialized_value)}
          </td>
        </tr>
      );
    });

    return (
      <div className="io_values list-group-item">
        <h5>{title}</h5>
        <table className="table">
          <tbody>{rows}</tbody>
        </table>
      </div>
    );
  }

  renderTags(tags: string[]) {
    if (tags.length === 0) {
      return null;
    }

    const bubbles = tags.map((data) => {
      return <span className="border rounded p-2 m-1 tag">{data}</span>;
    });

    return <div className="list-group-item mt-1">Tags: {bubbles}</div>;
  }

  onClick(event: React.MouseEvent<HTMLDivElement>) {
    this.props.onSelectionChange(this.props.node);
  }

  onMouseDown(event: React.MouseEvent<HTMLDivElement>) {
    this.props.onDragging(this.props.node);
    event.preventDefault();
    event.stopPropagation();
  }

  onMouseUp(event: React.MouseEvent<HTMLDivElement>) {
    this.props.onDragging(null);
  }

  toggleCollapsed(event: React.MouseEvent<HTMLIFrameElement>) {
    this.setState({ collapsed: !this.state.collapsed });
    event.stopPropagation();
  }

  render() {
    let collapsible_icon = "cursor-pointer fas fa-angle-up";
    if (this.state.collapsed) {
      collapsible_icon = "cursor-pointer fas fa-angle-down";
    }
    let io_table = null;
    if (!this.state.collapsed) {
      io_table = (
        <div className="list-group">
          {this.renderIOTable(this.props.node.options, "Options")}
          {this.renderIOTable(this.props.node.inputs, "Inputs")}
          {this.renderIOTable(this.props.node.outputs, "Outputs")}
        </div>
      );
    }
    let tags = null;
    if (!this.state.collapsed) {
      // cute bubbles in different colors?
      tags = this.renderTags(this.props.node.tags);
    }
    let node_type = null;
    if (this.props.node.max_children < 0) {
      node_type = "Flow control";
    } else if (this.props.node.max_children > 0) {
      node_type = "Decorator";
    } else {
      node_type = "Leaf";
    }

    let border = "border rounded p-2 grab m-2";
    if (this.props.highlighted) {
      border = "border rounded border-primary p-2 m-2";
    }
    return (
      <div
        className={border}
        onClick={this.onClick.bind(this)}
        onMouseDown={this.onMouseDown.bind(this)}
        onMouseUp={this.onMouseUp.bind(this)}
      >
        <div className="d-flex justify-content-between">
          <div className="d-flex minw0">
            <h4
              title={this.props.node.node_class}
              className="node_class text-truncate"
            >
              {this.props.node.node_class}
            </h4>
            <i
              title={getShortDoc(this.props.node.doc)}
              className="fas fa-question-circle pl-2 pr-2"
            ></i>
          </div>
          <div className="d-flex minw0">
            <i
              onClick={this.toggleCollapsed.bind(this)}
              className={collapsible_icon}
            ></i>
          </div>
        </div>
        <h5
          title={this.props.node.module}
          className="node_module text-truncate text-muted"
        >
          {this.props.node.module}
        </h5>
        <div>
          {node_type +
            " (max_children: " +
            (this.props.node.max_children >= 0
              ? this.props.node.max_children
              : "∞") +
            ")"}
        </div>
        {io_table}
        {tags}
      </div>
    );
  }
}
