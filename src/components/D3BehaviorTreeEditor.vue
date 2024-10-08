<!--
 *  Copyright 2024 FZI Forschungszentrum Informatik
 *
 *  Redistribution and use in source and binary forms, with or without
 *  modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *
 *     * Neither the name of the {copyright_holder} nor the names of its
 *       contributors may be used to endorse or promote products derived from
 *       this software without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 *  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 *  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 *  ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 *  LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 *  CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 *  SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 *  INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 *  CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 -->
<script setup lang="ts">
import { useEditorStore } from '@/stores/editor'
import { useEditNodeStore } from '@/stores/edit_node'
import { useROSStore } from '@/stores/ros'
import type { AddNodeAtIndexRequest, AddNodeAtIndexResponse } from '@/types/services/AddNodeAtIndex'
import type {
  DataEdgePoint,
  DataEdgeTerminal,
  DataEdge,
  DocumentedNode,
  DropTarget,
  NodeData,
  NodeDataLocation,
  NodeMsg,
  ParamData,
  PyEnum,
  PyLogger,
  PyOperand,
  PyOperator,
  TreeMsg,
  TrimmedNode,
  TrimmedNodeData,
  NodeDataWiring,
} from '@/types/types'
import { Position, IOKind } from '@/types/types'
import { getDefaultValue, prettyprint_type, python_builtin_types, typesCompatible } from '@/utils'
import { faArrowDown19 } from '@fortawesome/free-solid-svg-icons'
import { notify } from '@kyvg/vue3-notification'
import * as d3 from 'd3'
import type { ZoomBehavior } from 'd3'
import { onMounted, ref, watch, watchEffect } from 'vue'
import type { HierarchyNode, HierarchyLink } from 'd3-hierarchy'
import { flextree, type FlextreeNode } from 'd3-flextree'
import type { MoveNodeRequest, MoveNodeResponse } from '@/types/services/MoveNode'
import type { RemoveNodeRequest, RemoveNodeResponse } from '@/types/services/RemoveNode'
import type { ReplaceNodeRequest, ReplaceNodeResponse } from '@/types/services/ReplaceNode'
import type { WireNodeDataRequest, WireNodeDataResponse } from '@/types/services/WireNodeData'



const editor_store = useEditorStore()
const edit_node_store = useEditNodeStore()
const ros_store = useROSStore()

const viewport_ref = ref<SVGSVGElement>()
const svg_g_ref = ref<SVGGElement>()
const g_vertices_ref = ref<SVGGElement>()
const g_edges_ref = ref<SVGGElement>()
const g_data_graph_ref = ref<SVGGElement>()
const g_data_edges_ref = ref<SVGGElement>()
const g_data_vertices_ref = ref<SVGGElement>()
const g_drop_targets_ref = ref<SVGGElement>()

let zoomObject: d3.ZoomBehavior<SVGSVGElement, unknown> | undefined = undefined

let selection: boolean = false
let mouse_moved: boolean = false
let start_y: number = 0
let start_x: number = 0

let pan_interval_id: number | undefined = undefined
let pan_direction: number[] = [0.0, 0.0]
const pan_rate: number = 30
const drag_pan_boundary: number = 50
const pan_per_frame: number = 10.0

const io_gripper_size: number = 15
const io_gripper_spacing: number = 10

const io_edge_offset: number = 10
const io_edge_wrap_factor: number = 100
const io_edge_wrap_clamp: number = 5
const io_edge_wrap_invert_thresh: number = 50

const forest_root_name: string = "__forest_root"
const node_spacing: number = 80
const drop_target_root_size: number = 150

// constants for css classes & ids used with d3 
const tree_node_css_class:  string = "node"
const node_body_css_class:  string = "btnode"
const node_name_css_class:  string = "node_name"
const node_class_css_class: string = "class_name"
const tree_edge_css_class:  string = "link"
const drop_target_css_class:  string = "drop_target"
const data_vert_group_css_class: string = "gripper-group"
const data_vert_grip_css_class:  string = "gripper"
const data_vert_label_css_class: string = "label"
const data_vert_label_type_css_class: string = "label-type"
const data_edge_css_class: string = "data-link"
const data_edge_highlight_css_id:  string = "hightlightEdge"
const data_vert1_highlight_css_id: string = "highlightV1"
const data_vert2_highlight_css_id: string = "highlightV2"
const data_edge_draw_css_class: string = "drawing-indicator"
const selection_rect_css_class: string = "selection"

// This is the base transition for tree updates
// Use <selection>.transition(tree_transition)
let tree_transition: d3.Transition<any, any, any, any>

function resetView() {
  if (
    viewport_ref.value === undefined ||
    svg_g_ref.value === undefined ||
    zoomObject === undefined
  ) {
    notify({
      title: 'Element reference undefined!',
      type: 'error'
    })
    return
  }
  const viewport = d3.select(viewport_ref.value)
  const height = viewport.node()!.getBoundingClientRect().height

  const container = d3.select(svg_g_ref.value)

  viewport
    .call(zoomObject.translateTo, 0.0, height * 0.5 - 10.0)
}

function buildNodeMessage(node: DocumentedNode): NodeMsg {
  function getDefaultValues(paramList: NodeData[], options?: NodeData[] | null) {
    options = options || []

    return paramList.map((x) => {
      return {
        key: x.key,
        value: getDefaultValue(prettyprint_type(x.serialized_value), options)
      }
    })
  }
  const default_options = getDefaultValues(node.options)
  const options = default_options.map((x) => {
    if (x.value.type === 'unset_optionref') {
      const optionref: string = x.value.value as string
      const optionTypeName = optionref.substring('Ref to "'.length, optionref.length - 1)
      const optionType = default_options.find((x) => {
        return x.key === optionTypeName
      })
      if (optionType && optionType.value) {
        return {
          key: x.key,
          value: getDefaultValue(optionType.value.value as string)
        }
      }
    }
    return {
      key: x.key,
      value: x.value
    } as ParamData
  })

  return {
    module: node.module,
    node_class: node.node_class,
    name: node.name,
    options: options.map((x) => {
      const option: NodeData = {
        key: x.key,
        serialized_value: '',
        serialized_type: ''
      }
      if (x.value.type === 'type') {
        if (python_builtin_types.indexOf(x.value.value as string) >= 0) {
          x.value.value = '__builtin__.' + x.value.value
        }
        option.serialized_value = JSON.stringify({
          'py/type': x.value.value
        })
      } else if (x.value.type.startsWith('__')) {
        const py_value: PyLogger | PyOperator | PyOperand | PyEnum = x.value.value as
          | PyLogger
          | PyOperator
          | PyOperand
          | PyEnum
        py_value['py/object' as keyof typeof py_value] = x.value.type.substring('__'.length)
        option.serialized_value = JSON.stringify(x.value.value)
      } else {
        option.serialized_value = JSON.stringify(x.value.value)
      }
      return option
    }),
    child_names: [],
    inputs: [],
    outputs: [],
    version: '',
    max_children: 0,
    state: ''
  }
}

function canvasMouseMovePanHandler() {
  // Don't do anything unless we're currently dragging something
  if (viewport_ref.value === undefined) {
    return
  }

  if (!editor_store.is_dragging) {
    if (pan_interval_id !== undefined) {
      window.clearInterval(pan_interval_id)
      pan_direction = []
    }

    return
  }

  const width = viewport_ref.value.getBoundingClientRect().width
  const height = viewport_ref.value.getBoundingClientRect().height

  const mouseCoords = d3.mouse(viewport_ref.value)

  let panNeeded = false
  pan_direction = [0.0, 0.0]

  if (mouseCoords[0] < drag_pan_boundary) {
    // Left edge -> scroll right
    panNeeded = true
    // 1 if mouse is at the left edge, 0 if it is dragPanBoundary pixels away
    const leftEdgeCloseness = (drag_pan_boundary - mouseCoords[0]) / drag_pan_boundary
    pan_direction[0] = pan_per_frame * leftEdgeCloseness
  } else if (mouseCoords[0] > width - drag_pan_boundary) {
    // Right edge -> scroll left
    panNeeded = true
    // 1 if mouse is at the right edge, 0 if it is dragPanBoundary pixels away
    const rightEdgeCloseness = (drag_pan_boundary - (width - mouseCoords[0])) / drag_pan_boundary
    pan_direction[0] = -1.0 * pan_per_frame * rightEdgeCloseness
  }
  if (mouseCoords[1] < drag_pan_boundary) {
    // Up -> scroll down
    panNeeded = true
    // 1 if mouse is at the top edge, 0 if it is dragPanBoundary pixels away
    const topEdgeCloseness = (drag_pan_boundary - mouseCoords[1]) / drag_pan_boundary
    pan_direction[1] = pan_per_frame * topEdgeCloseness
  } else if (mouseCoords[1] > height - drag_pan_boundary) {
    // Down -> scroll up
    panNeeded = true
    // 1 if mouse is at the bottom edge, 0 if it is dragPanBoundary pixels away
    const botEdgeCloseness = (drag_pan_boundary - (height - mouseCoords[1])) / drag_pan_boundary
    pan_direction[1] = -1.0 * pan_per_frame * botEdgeCloseness
  }

  if (!panNeeded && pan_interval_id !== undefined) {
    window.clearInterval(pan_interval_id)
    pan_interval_id = undefined
    return
  }

  if (pan_interval_id === undefined) {
    // Start the interval for the panning animation, at panRate Hz
    pan_interval_id = window.setInterval(dragPanTimerHandler, 1000.0 / pan_rate)
  }
}

function dragPanTimerHandler() {
  if (!editor_store.is_dragging && pan_interval_id) {
    window.clearInterval(pan_interval_id)
    pan_interval_id = undefined
    return
  }

  d3.select(viewport_ref.value!).call(zoomObject!.translateBy, pan_direction[0], pan_direction[1])
}

watchEffect(drawEverything)
function drawEverything() {
  if (editor_store.tree === undefined) {
    console.warn("Tree is undefined")
    return
  }
  
  if (
    g_vertices_ref.value === undefined
  ) {
    // TODO handle DOM is broken, maybe page refresh? (this has many occurences)
    console.warn("DOM is broken")
    return
  }

  // Prepare transition config for synchronization
  tree_transition = d3.transition().duration(100).ease(d3.easeQuad)
  
  const onlyKeyAndType = (nodeData: NodeData) => ({
    key: nodeData.key,
    serialized_type: nodeData.serialized_type,
  } as TrimmedNodeData);

  const current_tree = editor_store.selected_subtree.is_subtree ? 
                        editor_store.selected_subtree.tree :
                        editor_store.tree

  // Trim the serialized data values from the node data - we won't
  // render them, so don't clutter the DOM with the data
  const trimmed_nodes: TrimmedNode[] = current_tree!.nodes.map((node) => {
    return {
      node_class: node.node_class,
      module: node.module,
      name: node.name,
      state: node.state,
      max_children: node.max_children,
      child_names: node.child_names,
      options: node.options.map(onlyKeyAndType),
      inputs: node.inputs.map(onlyKeyAndType),
      outputs: node.outputs.map(onlyKeyAndType),
      size: {width: 1, height: 1},
    };
  });

  const forest_root: TrimmedNode = {
    node_class: "",
    module: "",
    state: "",
    max_children: -1,
    name: forest_root_name,
    child_names: [],
    inputs: [],
    outputs: [],
    options: [],
    size: { width: 0, height: 0},
  };

  if (trimmed_nodes.findIndex((x) => x.name === forest_root_name) < 0) {
    trimmed_nodes.push(forest_root);
  }

  // Update the visual tree
  const parents: Record<string, string> = {};
  //const node_dict: Record<string, TrimmedNode> = {}; Is unused?
  // Find parents for all nodes once
  for (const i in trimmed_nodes) {
    const node = trimmed_nodes[i];
    //node_dict[node.name] = node;
    for (const j in node.child_names) {
      parents[node.child_names[j]] = node.name;
    }
  }

  const root: d3.HierarchyNode<TrimmedNode> = d3
    .stratify<TrimmedNode>()
    .id((node) => {
      return node.name
    })
    .parentId((node) => {
      // undefined if it has no parent - does that break the layout?
      if (node.name in parents) {
        return parents[node.name]
      } else if (node.name === forest_root.name) {
        return undefined
      } else {
        forest_root.child_names.push(node.name);
        return forest_root.name
      }
    })(trimmed_nodes)

  root.sort(function (a, b) {
    if (a.depth !== b.depth) {
      return b.depth - a.depth
    }
    while (a.parent !== b.parent) {
      a = a.parent!
      b = b.parent!
    }
    const child_list = a.parent!.data.child_names;
    return (
      child_list.findIndex((x) => x === a.data.name) -
      child_list.findIndex((x) => x === b.data.name)
    )
  })

  const g_vertex = d3.select<SVGGElement, never>(g_vertices_ref.value)

  const node = g_vertex
    .selectAll<SVGForeignObjectElement, d3.HierarchyNode<TrimmedNode>>(
      "." + tree_node_css_class
    )
    .data(
      root.descendants().filter((node) => node.data.name !== forest_root_name),
      (node) => node.id!
    ) // Join performs enter, update and exit at once
    .join(drawNewNodes)
      .call(updateNodeBody)
      .call(colorNodes)

  // Since we want to return the tree, we can't use the .call() syntax here
  const tree_layout = layoutTree(node, root)

  drawEdges(tree_layout)
  drawDropTargets(tree_layout)
  drawDataGraph(tree_layout, current_tree!.data_wirings)

}

function drawNewNodes(
  selection: d3.Selection<
    d3.EnterElement, d3.HierarchyNode<TrimmedNode>,
    SVGGElement, never
  >
) {

  const fo = selection
    .append("foreignObject")
      .classed(tree_node_css_class, true)
      // The two css-classes below are currently unused
      .classed("node--internal", 
        (d) => d.children !== undefined && d.children.length > 0
      )
      .classed("node--leaf",
        (d) => d.children === undefined || d.children.length == 0
      )
      .on("click.select", (node: d3.HierarchyNode<TrimmedNode>) => {
        edit_node_store.editorSelectionChange(node.data.name)
        d3.event.stopPropagation()
      })
      /*.on("dblclick", this.nodeDoubleClickHandler.bind(this))*/
      // TODO add mouse event handlers

  // No tree modifying if displaying a subtree
  if (!editor_store.selected_subtree.is_subtree) {
    fo.on("mousedown.dragdrop", (node: d3.HierarchyNode<TrimmedNode>) => {
      editor_store.startDraggingExistingNode(node)
    })
  }

  const body = fo
    .append<HTMLBodyElement>("xhtml:body")
      .classed(node_body_css_class + " p-2", true)
      .style("min-height", (d) => {
      // We need to ensure a minimum height, in case the node body
      // would otherwise be shorter than the number of grippers
      // requires.
        const inputs = d.data.inputs || []
        const outputs = d.data.outputs || []
        const max_num_grippers = Math.max(inputs.length, outputs.length)
        return (
          (io_gripper_size + io_gripper_spacing) * max_num_grippers +
          "px"
        )
      })

  // These elements get filled in updateNodeBody
  body.append("h4").classed(node_name_css_class, true)
  body.append("h5").classed(node_class_css_class, true)

  // The join pattern requires a return of the appended elements
  // For consistency the node body is filled using the update method
  return fo
}

function updateNodeBody(
  selection: d3.Selection<
    SVGForeignObjectElement,
    d3.HierarchyNode<TrimmedNode>,
    SVGGElement,
    never
  >
) {

  //selection.style("max-width", "150px")

  const body = selection.select<HTMLBodyElement>("." + node_body_css_class)

  body.style("max-width", "200px")

  body.select<HTMLHeadingElement>("." + node_name_css_class)
      .html((d) => d.data.name)

  body.select<HTMLHeadingElement>("." + node_class_css_class)
      .html((d) => d.data.node_class)

  // The width and height has to be readjusted as if the zoom was at k=1.0
  const k = d3.zoomTransform(viewport_ref.value!).k

  // Set width and height on foreignObject
  body.each(function (d) {
    const rect = this.getBoundingClientRect()
    d.data.size.width = rect.width / k
    d.data.size.height = rect.height / k
  })

  selection
    .transition(tree_transition)
      .attr("width", (d) => d.data.size.width / k)
      .attr("height", (d) => d.data.size.height / k)

  return selection
}

function colorNodes(
selection: d3.Selection<
  SVGForeignObjectElement,
  d3.HierarchyNode<TrimmedNode>,
  SVGGElement,
  never
>
) {
selection
  .select<HTMLBodyElement>("." + node_body_css_class)
  .transition(tree_transition)
    .style("border-color", (d) => {
      switch (d.data.state) {
        case "RUNNING": {
          return "#ffc107";
        }
        case "IDLE": {
          return "#007bff";
        }
        case "SUCCEEDED": {
          return "#28a745";
        }
        case "FAILED": {
          return "#dc3545";
        }
        case "SHUTDOWN": {
          return "#7c1e27";
        }
        case "UNINITIALIZED":
        default: {
          return "#4E5666";
        }
      }
    })
}

function layoutTree(selection: d3.Selection<
    SVGForeignObjectElement,
    d3.HierarchyNode<TrimmedNode>,
    SVGGElement,
    never>,
  root: d3.HierarchyNode<TrimmedNode>
): FlextreeNode<TrimmedNode> {

  // If the tree is in layer_mode, we have to get the max height for each layer
  const max_height_per_layer = Array<number>(root.height + 1).fill(0.0)
  selection.each((node: d3.HierarchyNode<TrimmedNode>) => {
    max_height_per_layer[node.depth] = Math.max(
      node.data.size.height,
      max_height_per_layer[node.depth]
    )
  })

  const tree_layout = flextree<TrimmedNode>({
    nodeSize: (node: HierarchyNode<TrimmedNode>) => {
      let height: number
      if (editor_store.is_layer_mode) {
        height = max_height_per_layer[node.depth]
      } else {
        height = node.data.size.height
      }
      height += node.depth > 0 ? node_spacing : 0
      return [node.data.size.width, height]
    },
    spacing: (node: HierarchyNode<TrimmedNode>, oNode: HierarchyNode<TrimmedNode>) => {
      if (editor_store.is_layer_mode) {
        return node_spacing
      }
      if (node.parent !== oNode.parent) {
        return 2 * node_spacing
      } else {
        return node_spacing
      }
    }, // This only applies to horizontal adjacent nodes
  })(root as HierarchyNode<TrimmedNode>)
    //FIXME This typecast shouldn't be necessary, but apparrently the types
    // d3.HierarchyNode and d3-hierarchy.HierarchyNode differ, as
    // d3.HierarchyNode doesn't expose the find function???
    // Potentially an issue with the typing library

  // Bind the new data to get a selection with all flextree properties
  selection
    .data(
        tree_layout.descendants().filter((node) => node.data.name !== forest_root_name), 
        (node) => node.id!)
    .transition(tree_transition)
      .attr("x", (d: FlextreeNode<TrimmedNode>) => d.x - d.data.size.width / 2.0)
      .attr("y", (d: FlextreeNode<TrimmedNode>) => d.y)
      // Setting x and y seems sufficient, compared to an explicit transform

  return tree_layout
}

function drawEdges(tree_layout: FlextreeNode<TrimmedNode>) {

  if (
    g_edges_ref.value === undefined
  ) {
    console.warn("DOM is broken")
    return
  }

  d3.select(g_edges_ref.value)
    .selectAll<SVGPathElement, d3.HierarchyLink<TrimmedNode>>("." + tree_edge_css_class)
    .data(tree_layout.links().filter(
        (link : d3.HierarchyLink<TrimmedNode>) => link.source.data.name !== forest_root_name
      ), (link) => link.source.id! + "###" + link.target.id!)
    .join("path")
      .classed(tree_edge_css_class, true) // Redundant for update elements, preserves readability
    .transition(tree_transition)
      .attr("d", d3.linkVertical<SVGPathElement, HierarchyLink<TrimmedNode>, [number, number]>()
        .source((link: HierarchyLink<TrimmedNode>) => {
          const source = link.source as FlextreeNode<TrimmedNode>
          return [source.x, source.y + source.data.size.height]
        })
        .target((link: HierarchyLink<TrimmedNode>) => {
          const target = link.target as FlextreeNode<TrimmedNode>
          return [target.x, target.y]
        })
      )
}

function drawDropTargets(tree_layout: FlextreeNode<TrimmedNode>) {

  if (g_drop_targets_ref.value === undefined) {
    console.warn("DOM is broken")
    return
  }

  const drop_targets: DropTarget[] = []

  // Only draw drop targets if not displaying a subtree
  if (!editor_store.selected_subtree.is_subtree) {

    // Construct the list of drop targets that should exist
    tree_layout.each((node: FlextreeNode<TrimmedNode>) => {

      if (node.data.name === forest_root_name) {
        return
      }

      // Draw all left and right targets, even though they sometimes overlap
      // because it looks odd if they're missing once nodes are spaced out further
      drop_targets.push({node: node, position: Position.LEFT})
      drop_targets.push({node: node, position: Position.CENTER})
      drop_targets.push({node: node, position: Position.RIGHT})
      drop_targets.push({node: node, position: Position.TOP}) // Does this make sense?
      if (node.data.max_children === -1 || node.data.max_children > node.data.child_names.length) {
        drop_targets.push({node: node, position: Position.BOTTOM})
      }

    })

  }

  // If there are no drop targets to draw, draw one at root
  // Adjust the size of the drop target here. Don't do this on init, it ruins the tree layout
  if (drop_targets.length === 0) {
    tree_layout.data.size.width = drop_target_root_size
    tree_layout.data.size.height = drop_target_root_size
    drop_targets.push({node: tree_layout, position: Position.CENTER})
  }

  // Join those with the existing drop targets and draw them
  d3.select(g_drop_targets_ref.value)
    .selectAll<SVGRectElement, DropTarget>("." + drop_target_css_class)
    .data(drop_targets, (d) => d.node.id! + "###" + d.position)
    .join("rect")
      .classed(drop_target_css_class, true)
      .attr("width", (d) => {
        // Switch cases without breaks work like a convenient OR
        switch (d.position) {
          case Position.LEFT:
          case Position.RIGHT:
            return node_spacing
          case Position.TOP:
          case Position.BOTTOM:
          case Position.CENTER:
            return d.node.data.size.width
          default:
            return 0
        }
      })
      .attr("height",(d) => {
        switch (d.position) {
          case Position.LEFT:
          case Position.RIGHT:
          case Position.CENTER:
            return d.node.data.size.height
          case Position.TOP:
          case Position.BOTTOM:
            return 0.45 * node_spacing
          default:
            return 0
        }
      })
      .attr("x", (d) => {
        switch (d.position) {
          case Position.LEFT:
            return d.node.x - node_spacing - 
              0.5 * d.node.data.size.width
          case Position.RIGHT:
            return d.node.x + 
              0.5 * d.node.data.size.width
          case Position.TOP:
          case Position.BOTTOM:
          case Position.CENTER:
            return d.node.x - 
              0.5 * d.node.data.size.width
          default:
            return 0
        }
      })
      .attr("y", (d) => {
        switch (d.position) {
          case Position.LEFT:
          case Position.RIGHT:
          case Position.CENTER:
            return d.node.y
          case Position.TOP:
            return d.node.y - 0.5 * node_spacing
          case Position.BOTTOM:
            return d.node.y + 
              d.node.data.size.height
          default:
            return 0
        }
      })
      .attr("opacity", 0.2)
      .on("mouseover.highlight", function () {
        d3.select(this).attr("opacity", 0.8);
      })
      .on("mouseout.highlight", function () {
        d3.select(this).attr("opacity", 0.2);
      })
      .on("mouseup.dragdrop", (d) => {
        if (editor_store.dragging_new_node) {
          addNewNode(d)
        } else if (editor_store.dragging_existing_node) {
          moveExistingNode(d)
        } else {
          console.warn("Unintended drag release")
        }
      })

}

function dropTargetGroupVisibility(): string {
  if (editor_store.dragging_new_node !== undefined ||
    editor_store.dragging_existing_node !== undefined) {
      return 'visible'
    }
  return 'hidden'
}

function moveExistingNode(drop_target: DropTarget) {
  if (editor_store.dragging_existing_node === undefined) {
    console.warn("Tried to move existing node by dragging but none selected")
    return
  }

  const node_name = editor_store.dragging_existing_node.data.name
  let parent_name = ''
  let index = -1
  
  // If this is not the root target, set the parent and position
  if (drop_target.node.parent) {

    // Set parent and index
    if (drop_target.position === Position.BOTTOM) {
      parent_name = drop_target.node.data.name
      index = 0
    } else if (drop_target.node.parent.data.name !== forest_root_name) {
      parent_name = drop_target.node.parent.data.name
      index = drop_target.node.parent.children!.indexOf(drop_target.node)
    }

    if (drop_target.position === Position.RIGHT) {
      index++
    }

    // if the node is moved in it's own row (same parent), we need to offset the index
    if (parent_name === editor_store.dragging_existing_node.parent!.data.name &&
      index > drop_target.node.parent.children!.findIndex(
        (node: FlextreeNode<TrimmedNode>) => node.data.name === node_name
      )
    ) {
      index--
    }
  }

  ros_store.move_node_service.callService({
      node_name: node_name,
      new_parent_name: parent_name,
      new_child_index: index
    } as MoveNodeRequest,
    (response: MoveNodeResponse) => {
      if (response.success) {
        notify({
          title: "Moved node " + node_name,
          type: 'success'
        })
        moveChildNodes(node_name, drop_target)
      } else {
        notify({
          title: "Failed to move node " + drop_target.node.data.name,
          text: response.error_message,
          type: 'warn'
        })
      }
    },
    (error: string) => {
      notify({
        title: "Failed to call moveNode service",
        text: error,
        type: 'error'
      })
    })
}

watchEffect(toggleExistingNodeTargets)
function toggleExistingNodeTargets() {
  if (g_drop_targets_ref.value === undefined) {
    console.warn("DOM is broken")
    return
  }

  //Reset visibility for all targets
  const targets = d3.select(g_drop_targets_ref.value)
    .selectAll<SVGRectElement, DropTarget>("." + drop_target_css_class)
      .attr("visibility", null)

  if (editor_store.dragging_existing_node === undefined) {
    return
  }

  // The first filter hides all nodes in the currently dragged subtree
  // The second filter hides all nodes where dropping would overload a child node count
  //FIXME Maybe we should hide targets that would place the node in the same spot 

  // If the filter returns true (keeps the node) it gets hidden
  targets.filter((drop_target: DropTarget) => {
      return editor_store.dragging_existing_node!.descendants()
        .find((node: d3.HierarchyNode<TrimmedNode>) => {
          return node.data.name === drop_target.node.data.name
        }) !== undefined
      })
      .attr("visibility", "hidden")

  // If the filter returns true (keeps the node) it gets hidden
  targets.filter((drop_target: DropTarget) => {
      switch (drop_target.position) {
      case Position.CENTER:
        return editor_store.dragging_existing_node!.data.max_children !== -1 &&
          drop_target.node.data.child_names.length + 
          editor_store.dragging_existing_node!.data.child_names.length >
          editor_store.dragging_existing_node!.data.max_children
      case Position.TOP:
        return editor_store.dragging_existing_node!.data.child_names.length >=
          editor_store.dragging_existing_node!.data.max_children 
      case Position.BOTTOM:
        return drop_target.node.data.max_children !== -1 &&
          drop_target.node.data.name !== editor_store.dragging_existing_node!.parent!.data.name &&
          drop_target.node.data.child_names.length >= 
          drop_target.node.data.max_children
      case Position.LEFT:
      case Position.RIGHT:
        return drop_target.node.parent!.data.max_children !== -1 &&
          drop_target.node.parent!.data.name !== editor_store.dragging_existing_node!.parent!.data.name &&
          drop_target.node.parent!.data.child_names.length >= 
          drop_target.node.parent!.data.max_children
      default:
        return true
    }
    })
      .attr("visibility", "hidden")
}

function addNewNode(drop_target: DropTarget) {
  let msg: NodeMsg

  if (editor_store.dragging_new_node !== undefined) {
    msg = buildNodeMessage(editor_store.dragging_new_node)
  } else {
    console.warn("Tried to add new node by dragging but none selected")
    return
  }

  let parent_name = ''
  let index = -1
  
  // If this is not the root target, set the parent and position
  if (drop_target.node.parent) {

    // Set parent and index
    if (drop_target.position === Position.BOTTOM) {
      parent_name = drop_target.node.data.name
      index = 0
    } else if (drop_target.node.parent.data.name !== forest_root_name) {
      parent_name = drop_target.node.parent.data.name
      index = drop_target.node.parent.children!.indexOf(drop_target.node)
    }

    if (drop_target.position === Position.RIGHT) {
      index++
    }
  }

  ros_store.add_node_at_index_service.callService({
    parent_name: parent_name,
    node: msg,
    allow_rename: true,
    new_child_index: index
  } as AddNodeAtIndexRequest,
  (response: AddNodeAtIndexResponse) => {
    if (response.success) {
      notify({
        title: "Added node " + response.actual_node_name,
        type: 'success'
      })
      // If this isn't the root target, we might have to move around nodes
      if (drop_target.node.parent) {
        moveChildNodes(response.actual_node_name, drop_target)
      }
    } else {
      notify({
        title: "Failed to add node " + msg.name,
        text: response.error_message,
        type: 'warn'
      })
    }
  },
  (error: string) => {
    notify( {
      title: "Failed to call addNodeAtIndex service",
      text: error,
      type: 'error'
    })
  })
}

watchEffect(toggleNewNodeTargets)
function toggleNewNodeTargets() {
  if (g_drop_targets_ref.value === undefined) {
    console.warn("DOM is broken")
    return
  }

  //Reset visibility for all targets
  const targets = d3.select(g_drop_targets_ref.value)
    .selectAll<SVGRectElement, DropTarget>("." + drop_target_css_class)
      .attr("visibility", null)

  if (editor_store.dragging_new_node === undefined) {
    return
  }

  // If the filter returns true (keeps the node) it gets hidden
  targets.filter((drop_target: DropTarget) => {
    switch (drop_target.position) {
      case Position.CENTER:
        return editor_store.dragging_new_node!.max_children !== -1 &&
          drop_target.node.data.child_names.length >
          editor_store.dragging_new_node!.max_children
      case Position.TOP:
        return editor_store.dragging_new_node!.max_children === 0
      case Position.BOTTOM:
        return drop_target.node.data.max_children !== -1 &&
          drop_target.node.data.child_names.length >= 
          drop_target.node.data.max_children
      case Position.LEFT:
      case Position.RIGHT:
        return drop_target.node.parent!.data.max_children !== -1 &&
          drop_target.node.parent!.data.child_names.length >= 
          drop_target.node.parent!.data.max_children
      default:
        return true
    }
  })
      .attr("visibility", "hidden")
}

function moveChildNodes(new_node_name: string, drop_target: DropTarget) {
  if (new_node_name === '') {
    // This means something went wrong with moving the node, thus we can't move it around
    console.warn("Didn't get a node name back")
    return
  }

  // NOTE Checking if the node allows children would require pulling the 
  // node information out of the store, since this callback is delayed.
  // For now we trust the hiding of inappropriate drop targets.
  
  if (drop_target.position === Position.TOP) {
    ros_store.move_node_service.callService({
      node_name: drop_target.node.data.name,
      new_parent_name: new_node_name,
      new_child_index: 0
    } as MoveNodeRequest,
    (response: MoveNodeResponse) => {
      if (response.success) {
        notify({
          title: "Moved node " + drop_target.node.data.name,
          type: 'success'
        })
      } else {
        notify({
          title: "Failed to move node " + drop_target.node.data.name,
          text: response.error_message,
          type: 'warn'
        })
      }
    },
    (error: string) => {
      notify({
        title: "Failed to call moveNode service",
        text: error,
        type: 'error'
      })
    })
  }

  if (drop_target.position === Position.CENTER) {
    drop_target.node.data.child_names.forEach((child_name) => {
      ros_store.move_node_service.callService({
        node_name: child_name,
        new_parent_name: new_node_name,
        new_child_index: -1
      } as MoveNodeRequest,
      (response: MoveNodeResponse) => {
        if (response.success) {
          notify({
            title: "Moved node " + child_name,
            type: 'success'
          })
        } else {
          notify({
            title: "Failed to move node " + child_name,
            text: response.error_message,
            type: 'warn'
          })
        }
      },
      (error: string) => {
        notify({
          title: "Failed to call moveNode service",
          text: error,
          type: 'error'
        })
      })
    })
    ros_store.remove_node_service.callService({
      node_name: drop_target.node.data.name,
      remove_children: false,
    } as RemoveNodeRequest,
    (response: RemoveNodeResponse) => {
      if (response.success) {
        notify({
          title: "Removed node",
          type: 'success'
        })
      } else {
        notify({
          title: "Failed to remove node",
          text: response.error_message,
          type: 'warn'
        })
      }
    },
    (error: string) => {
      notify({
        title: "Failed to call removeNode service",
        text: error,
        type: 'error'
      })
    })
  }
}


function drawDataGraph(tree_layout: FlextreeNode<TrimmedNode>, data_wirings: NodeDataWiring[]) {
  if (editor_store.tree === undefined) {
    console.warn("No tree received yet")
    return
  }

  if (g_data_graph_ref.value === undefined || 
    g_data_vertices_ref.value === undefined
  ) {
    console.warn("DOM is broken")
    return
  }

  const data_points: DataEdgeTerminal[] = []

  tree_layout.each((node: FlextreeNode<TrimmedNode>) => {

    if (node.data.name === forest_root_name) {
      return
    }

    node.data.inputs.map((input: TrimmedNodeData, index: number) => {
      data_points.push({
        node: node,
        index: index,
        kind: IOKind.INPUT,
        key: input.key,
        type: input.serialized_type,
        x: node.x - node.data.size.width * 0.5 - io_gripper_size,
        y: node.y + io_gripper_spacing + index * (io_gripper_size + io_gripper_spacing)
      })
    })
    node.data.outputs.map((output: TrimmedNodeData, index: number) => {
      data_points.push({
        node: node,
        index: index,
        kind: IOKind.OUTPUT,
        key: output.key,
        type: output.serialized_type,
        x: node.x + node.data.size.width * 0.5,
        y: node.y + io_gripper_spacing + index * (io_gripper_size + io_gripper_spacing)
      })
    })

  })

  const g_data_vertices = d3.select(g_data_vertices_ref.value)
    .selectAll<SVGGElement, DataEdgeTerminal>("." + data_vert_group_css_class)
    .data(data_points, 
      (d) => d.node.id! + "###" + d.kind + "###" + d.index
    )
    .join(drawNewDataVert)

  // Since types of DataVerts can change, type values are added out here
  g_data_vertices.select("." + data_vert_label_css_class)
    .select("." + data_vert_label_type_css_class)
      .text((d) => "(type: " + prettyprint_type(d.type) + ")")

  // No data wiring when displaying a subtree
  if (!editor_store.selected_subtree.is_subtree) {
    g_data_vertices
      .select("." + data_vert_grip_css_class)
        //FIXME These handlers are out here because they see an outdated datum (term)
        // if registered in drawNewDataVert
        // Updating d3 should resolve this issue (as per the documentation)
        .on("mousedown.drawedge", (term: DataEdgeTerminal) => {
          editor_store.startDrawingDataEdge(term)
        })
        .on("mouseup.drawedge", (term: DataEdgeTerminal) => {
          if (editor_store.data_edge_endpoint === undefined) {
            console.warn("Unintended data edge draw")
            return
          }

          //TODO Maybe this is too restrictive?
          if (!typesCompatible(term, editor_store.data_edge_endpoint)) {
            console.warn("Invalid edge")
            return
          }

          if (term.kind === IOKind.INPUT) {
            addNewDataEdge(editor_store.data_edge_endpoint, term)
          } else {
            addNewDataEdge(term, editor_store.data_edge_endpoint)
          }
        })
  }

  g_data_vertices.transition(tree_transition)
      //NOTE group elements can't be positioned with x= and y=
      .attr("transform", (d) => "translate(" + d.x + ", " + d.y + ")")

  drawDataEdges(data_points, g_data_vertices, data_wirings)

}

function drawNewDataVert(
  selection: d3.Selection<
    d3.EnterElement, DataEdgeTerminal,
    SVGGElement, unknown
  >
) {
  const groups = selection.append("g")
      .classed(data_vert_group_css_class, true)
      .on("mouseover.highlight", function () {
        if (editor_store.is_dragging) {
          // Highlight compatible vertices when dragging
          const compat = d3.select(this).classed("compatible")
          d3.select(this)
              .classed("data-hover", compat)
        } else {
          d3.select(this)
              .classed("data-hover", true)
              .attr("id", data_vert1_highlight_css_id)
            .select(".label")
              .attr("visibility", "visible")
        }
      })
      .on("mouseout.highlight", function () {
        if (editor_store.is_dragging) {
          d3.select(this)
              .classed("data-hover", false)
        } else {
          d3.select(this)
              .classed("data-hover", false)
              .attr("id", null)
            .select(".label")
              .attr("visibility", "hidden")
        }
      })

  groups.append("rect")
      .classed(data_vert_grip_css_class, true)
      .attr("width", io_gripper_size)
      .attr("height", io_gripper_size)

  const labels = groups.append("text")
      .classed(data_vert_label_css_class, true)
      .attr("dominant-baseline", "middle")
      .attr("visibility", "hidden")
      .attr("text-anchor", (d) => d.kind === IOKind.INPUT ? "end" : "start" )
      .text((d) => d.key)
      .attr("x", (d) => {
        switch (d.kind) {
          case IOKind.INPUT:
            return -5;
          case IOKind.OUTPUT:
            return io_gripper_size + 5;
          case IOKind.OTHER:
            //TODO figure out placement for other IO
          default:
            return 0;
        }
      })
      .attr("y", 0.5 * io_gripper_size)

  labels.append("tspan")
      .classed(data_vert_label_type_css_class, true)
      .attr("x", function () { //FIXME Re-apply x for unknown reason
        return d3.select(this.parentElement).attr("x")
      }) 
      .attr("dy", "1em") // Space out 2nd line

  // The join pattern requires a return of the appended elements
  return groups
}

function drawDataEdges(data_points: DataEdgeTerminal[],
  g_data_vertices: d3.Selection<
    SVGGElement, DataEdgeTerminal,
    SVGGElement, unknown
  >,
  data_wirings: NodeDataWiring[]
) {
  if (g_data_graph_ref.value === undefined || 
    g_data_vertices_ref.value === undefined || 
    g_data_edges_ref.value === undefined
  ) {
    console.warn("DOM is broken")
    return
  }

  // Construct edge array by matching tree_msg wirings
  const data_edges: DataEdge[] = []

  function matchEndpoint(wire_point: NodeDataLocation, terminal: DataEdgeTerminal): boolean {
    return wire_point.node_name === terminal.node.data.name &&
      wire_point.data_kind === terminal.kind && wire_point.data_key === terminal.key
  }

  data_wirings.forEach((wiring: NodeDataWiring) => {

    // Match Terminals with wiring data
    const source = data_points.find(
      (term: DataEdgeTerminal) => matchEndpoint(wiring.source, term)
    )
    const target = data_points.find(
      (term: DataEdgeTerminal) => matchEndpoint(wiring.target, term)
    )

    if (source === undefined || target === undefined) {
      console.warn("Bad data edge", source, target)
      return
    }

    // Try to assign output as source and input as target
    if (source.kind === IOKind.INPUT) {
      data_edges.push({
        source: target,
        target: source,
        wiring: wiring
      })
    } else {
      data_edges.push({
        source: source,
        target: target,
        wiring: wiring
      })
    }
  })

  d3.select(g_data_edges_ref.value)
    .selectAll<SVGPathElement, DataEdge>("." + data_edge_css_class)
    .data(data_edges,
      (d: DataEdge) => d.source.node.id! + "###" + d.source.kind + "###" + d.source.index
           + "#####" + d.target.node.id! + "###" + d.target.kind + "###" + d.target.index
    )
    .join("path")
      .classed(data_edge_css_class, true)
      .on("click.select", (edge: DataEdge) => {
        editor_store.selectEdge(edge.wiring)
        d3.event.stopPropagation()
      })
      .on("mouseover.highlight", function (edge: DataEdge) {
        if (editor_store.is_dragging) {
          return // No highlights while dragging
        }
        g_data_vertices
          .filter((term: DataEdgeTerminal) =>
            term === edge.source || term === edge.target
          )
            .dispatch("mouseover")
            .attr("id", (term: DataEdgeTerminal) => 
              term.kind === IOKind.INPUT ? 
                data_vert2_highlight_css_id : 
                data_vert1_highlight_css_id
            )
        d3.select(this)
            .classed("data-hover", true)
            .attr("id", data_edge_highlight_css_id)
      })
      .on("mouseout.highlight", function (edge: DataEdge) {
        if (editor_store.is_dragging) {
          return // No highlights while dragging
        }
        g_data_vertices.filter((term: DataEdgeTerminal) =>
          term === edge.source || term === edge.target
        ).dispatch("mouseout")
        d3.select(this)
            .classed("data-hover", false)
      })
    .transition(tree_transition)
      .attr("d", (edge: DataEdge) => drawDataLine(edge.source, edge.target))
      /*.attr("d", 
        d3.linkHorizontal<SVGPathElement, DataEdge, DataEdgeTerminal>()
          .x((p) => p.x + io_gripper_size/2)
          .y((p) => p.y + io_gripper_size/2)
      )*/
  
}

function drawDataLine(source: DataEdgePoint, target: DataEdgePoint) {
  const lineGen = d3.line<DataEdgePoint>()
      .x((p) => p.x + io_gripper_size/2)
      .y((p) => p.y + io_gripper_size/2)
      .curve(d3.curveCatmullRom.alpha(0.9))
    let wraparound = Math.abs(source.x - target.x) / io_edge_wrap_factor
    wraparound = Math.min( Math.max(wraparound, 0), io_edge_wrap_clamp)
    const invert_source = target.y - source.y > io_edge_wrap_invert_thresh
    const invert_target = source.y - target.y > io_edge_wrap_invert_thresh
    const source_offset: DataEdgePoint = {
      x: source.x + io_edge_offset, 
      y: source.y - wraparound * (invert_source ? -1 : 1)
    }
    const target_offset: DataEdgePoint = {
      x: target.x - io_edge_offset,
      y: target.y - wraparound * (invert_target ? -1 : 1)
    }
    return lineGen([source, source_offset, target_offset, target])
}

watchEffect(toggleDataEdgeTargets)
function toggleDataEdgeTargets() {
  if (g_data_vertices_ref.value === undefined) {
    console.warn("DOM is broken")
    return
  }

  // Reset visibility on all grippers
  const data_verts = d3.select(g_data_vertices_ref.value)
    .selectAll<SVGGElement, DataEdgeTerminal>("." + data_vert_group_css_class)
      .classed("compatible", false)
    
  data_verts
    .select(".label")
      .attr("visibility", "hidden")
  
  // Reset drawing indicator
  const draw_path = d3.select("." + data_edge_draw_css_class)
      .attr("d", null)

  if (editor_store.data_edge_endpoint === undefined) {
    return
  }

  data_verts
    .filter((term: DataEdgeTerminal) => 
      typesCompatible(term, editor_store.data_edge_endpoint!)
    )
      .classed("compatible", true)
    .select("." + data_vert_label_css_class)
      .attr("visibility", "visible")

  draw_path
      .attr("d", () => 
        drawDataLine(editor_store.data_edge_endpoint!, 
          editor_store.data_edge_endpoint!)
      )

}

// Caller needs to ensure to pass the input as source
function addNewDataEdge(source: DataEdgeTerminal, target: DataEdgeTerminal) {
  ros_store.wire_data_service.callService({
    wirings: [{
      source: {
        node_name: source.node.data.name,
        data_kind: source.kind,
        data_key: source.key
      },
      target: {
        node_name: target.node.data.name,
        data_kind: target.kind,
        data_key: target.key
      }
    } as NodeDataWiring ],
    ignore_failure: true //TODO what does this do?
  } as WireNodeDataRequest,
  (response: WireNodeDataResponse) => {
    if (response.success) {
      notify({
        title: "Added data edge",
        type: 'success'
      })
    } else {
      notify({
        title: "Failed to add data edge",
        text: response.error_message,
        type: 'warn'
      })
    }
  },
  (error: string) => {
    notify({
      title: "Failed to call dataWiring service",
      text: error,
      type: 'error'
    })
  })
}

function removeHoverDataEdge() {
  if (editor_store.is_dragging) {
    return // No highlights while dragging
  }

  const g_data_vertices = d3
    .selectAll<SVGGElement, DataEdgeTerminal>(
      "#" + data_vert1_highlight_css_id + ", #" + data_vert2_highlight_css_id
    )

  const edge = d3.select<SVGPathElement, DataEdge>("#" + data_edge_highlight_css_id)

  removeHoverVert1()
  removeHoverVert2()

  edge
      .classed("data-hover", false)
      .attr("id", null)
}

function removeHoverVert1() {
  d3.select<SVGGElement, DataEdgeTerminal>("#" + data_vert1_highlight_css_id)
      .classed("data-hover", false)
      .attr("id", null)
    .select(".label")
      .attr("visibility", "hidden")
}

function removeHoverVert2() {
  d3.select<SVGGElement, DataEdgeTerminal>("#" + data_vert2_highlight_css_id)
      .classed("data-hover", false)
      .attr("id", null)
    .select(".label")
      .attr("visibility", "hidden")
}




onMounted(() => {
  if (
    viewport_ref.value === undefined ||
    svg_g_ref.value === undefined 
  ) {
    notify({
      title: 'Element reference undefined!',
      type: 'error'
    })
    return
  }

  const viewport = d3.select(viewport_ref.value)

  const height = viewport.node()!.getBoundingClientRect().height
  const viewport_x = viewport.node()!.getBoundingClientRect().x
  const viewport_y = viewport.node()!.getBoundingClientRect().y

  /*viewport.on('mouseup', () => {
    console.log('mouseup before zoom')
  })*/

  zoomObject = d3.zoom<SVGSVGElement, unknown>()
  zoomObject.scaleExtent([0.3, 1.0])

  const container = d3.select(svg_g_ref.value)

  viewport.call(
      zoomObject.on('zoom', function () {
        container.attr('transform', d3.event.transform)
      })
    )

  zoomObject.filter(function () {
    // Do not trigger panning if we're grabbing a node (initiate dragging).
    return !d3.event.shiftKey && 
      (!editor_store.is_dragging || d3.event.type === 'wheel')
  })


  // Call resetView to center tree container
  resetView()

  viewport.on('mousemove.pan_if_drag', canvasMouseMovePanHandler)

  viewport.on('click.unselect', () => {
    if (!d3.event.shiftKey) {
      edit_node_store.clearSelection()
      editor_store.unselectEdge()
    }
  })

  selection = false
  mouse_moved = false
  start_y = 0

  // selection rectangle
  //TODO maybe put these into the template
  viewport
    .append('rect')
      .classed(selection_rect_css_class, true)
      .attr('width', 0)
      .attr('height', 0)
      .attr('x', 0)
      .attr('y', 0)
  container
    .append('path')
      .classed(data_edge_draw_css_class, true)

  // start the selection
  viewport.on('mousedown.drawselect', () => {
    if (d3.event.shiftKey) {
      selection = true // indicates a shift-mousedown enabled selection rectangle

      const s = viewport.select('rect.' + selection_rect_css_class)

      if (!s.empty()) {
        s.attr('x', d3.event.pageX - viewport_x).attr('y', d3.event.pageY - viewport_y)
        start_x = parseInt(s.attr('x'))
        start_y = parseInt(s.attr('y'))
      }
    }
  })

  // show the selection rectangle on mousemove
  viewport.on('mousemove.drawselect', () => {
    if (d3.event.shiftKey && selection) {
      mouse_moved = true

      const s = viewport.select('rect.' + selection_rect_css_class)

      if (!s.empty()) {
        let new_start_x = start_x!
        let new_start_y = start_y!
        let end_x = d3.event.pageX! - viewport_x
        let end_y = d3.event.pageY! - viewport_y

        // flip the selection rectangle if the user moves in a negative direction from the start point
        if (d3.event.pageX - viewport_x < new_start_x) {
          new_start_x = d3.event.pageX - viewport_x
          end_x = start_x!
          s.attr('x', new_start_x)
        }

        if (d3.event.pageY - viewport_y < new_start_y) {
          new_start_y = d3.event.pageY - viewport_y
          end_y = start_y!
          s.attr('y', new_start_y)
        }

        s.attr('width', end_x - new_start_x).attr('height', Math.abs(end_y - new_start_y))

        viewport
          .selectAll<d3.BaseType, SVGForeignObjectElement>('foreignObject')
          .each(function (data) {
            const bbox = data.getBoundingClientRect()
            const x = bbox.x - viewport_x
            const y = bbox.y - viewport_y

            if (
              x >= new_start_x &&
              x + bbox.width <= end_x &&
              y >= new_start_y &&
              y + bbox.height <= end_y
            ) {
              d3.select(this).select('body').classed('node-selected', true)
            } else {
              d3.select(this).select('body').classed('node-selected', false)
            }
          })
      }
    }
  })

  // detect the selected nodes on mouseup
  viewport.on('mouseup.drawselect', () => {
    if (selection && mouse_moved) {
      selection = false // hide the selection rectangle
      mouse_moved = false
      const s = viewport.select('rect.' + selection_rect_css_class)
      s.attr('width', 0).attr('height', 0)

      const selected_node_names: Set<string> = new Set()

      viewport
        .selectAll<SVGForeignObjectElement, FlextreeNode<TrimmedNode>>('foreignObject')
        .each(function (node) {
          if (d3.select(this).select('body').classed('node-selected')) {
            selected_node_names.add(node.data.name)
          }
        })
      edit_node_store.selectMultipleNodes(Array.from(selected_node_names))
    }
  })


  // draw proto edges on data-drag
  viewport.on('mousemove.drawedge', () => {
    if (svg_g_ref.value === undefined) {
      console.warn("DOM is broken")
      return
    }

    if (editor_store.data_edge_endpoint === undefined) {
      return // Nothing to draw
    }

    const [x, y] = d3.mouse(svg_g_ref.value)
    // Construct a fake DataEdgePoint to reuse drawing code
    const mouse_point: DataEdgePoint = {
      x: x - io_gripper_size/2,
      y: y - io_gripper_size/2
    }

    d3.select("path." + data_edge_draw_css_class)
        .attr("d", () => {
          if (editor_store.data_edge_endpoint!.kind === IOKind.INPUT) {
            return drawDataLine(mouse_point, editor_store.data_edge_endpoint!)
          } else {
            return drawDataLine(editor_store.data_edge_endpoint!, mouse_point)
          }
        })

  })

})
</script>

<template>
  <svg id="editor_viewport" ref="viewport_ref" class="reactive-svg" :class="editor_store.skin">
    <g id="container" ref="svg_g_ref">
      <g class="edges" ref="g_edges_ref"/>
      <g class="vertices" ref="g_vertices_ref"/>
      <g class="data_graph" ref="g_data_graph_ref" :visibility="editor_store.show_data_graph ? 'visible' : 'hidden'">
        <g class="data_edges" ref="g_data_edges_ref"/>
        <g class="data_vertices" ref="g_data_vertices_ref"/>
        <!--Below is supposed to pull elements to the foreground, but messes with events
          e.g. clicking and dragging is impossible
        <use :href="'#' + data_edge_highlight_css_id" @mouseout="removeHoverDataEdge" />
        <use :href="'#' + data_vert1_highlight_css_id" @mouseout="removeHoverVert1"/>
        <use :href="'#' + data_vert2_highlight_css_id" @mouseout="removeHoverVert2"/>-->
      </g>
      <g class="drop_targets" ref="g_drop_targets_ref" :visibility="dropTargetGroupVisibility()"/>
    </g>
    <text
      x="10"
      y="20"
      fill="#FFFFFF"
      textAnchor="left"
      alignmentBaseline="central"
      class="cursor-pointer svg-button"
      @click="resetView"
    >
      Reset View
    </text>
    <!--<text
      x="200"
      y="20"
      fill="#FFFFFF"
      textAnchor="left"
      alignmentBaseline="central"
      class="cursor-pointer svg-button"
      @click="drawEverything"
    >
      Redraw Tree
    </text>-->
  </svg>
</template>

<style lang="scss">
  @import "src/assets/editor.scss";
</style>

