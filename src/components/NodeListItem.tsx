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
import React, { Component } from "react";
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

  onClick() {
    this.props.onSelectionChange(this.props.node);
  }

  onMouseDown(event: React.MouseEvent<HTMLDivElement>) {
    this.props.onDragging(this.props.node);
    event.preventDefault();
    event.stopPropagation();
  }

  onMouseUp() {
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
        tabIndex={0}
        onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
          return event.keyCode != 13 || this.onClick();
        }}
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
            <i onClick={this.toggleCollapsed.bind(this)} key={collapsible_icon}>
              <span className={collapsible_icon} />
            </i>
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
