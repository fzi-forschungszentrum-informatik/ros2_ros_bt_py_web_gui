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
import { useROSStore } from '@/stores/ros'
import type { AddNodeAtIndexRequest, AddNodeAtIndexResponse } from '@/types/services/AddNodeAtIndex'
import type {
  DataEdgePoints,
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
  TrimmedNodeData
} from '@/types/types'
import { Position } from '@/types/types'
import { getDefaultValue, prettyprint_type, python_builtin_types } from '@/utils'
import { faArrowDown19 } from '@fortawesome/free-solid-svg-icons'
import { notify } from '@kyvg/vue3-notification'
import * as d3 from 'd3'
import type { ZoomBehavior } from 'd3'
import { onMounted, ref } from 'vue'
import type { HierarchyNode, HierarchyLink } from 'd3-hierarchy'
import { flextree, type FlextreeNode } from 'd3-flextree'

const editor_store = useEditorStore()
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

let node_drop_target: DropTarget | undefined = undefined

let selection: boolean = false
let mouse_moved: boolean = false
let start_y: number = 0
let start_x: number = 0

let dragging: boolean = false
let pan_interval_id: number | undefined = undefined
let pan_rate: number = 30
let pan_direction: number[] = [0.0, 0.0]
let drag_pan_boundary: number = 50
let pan_per_frame: number = 10.0

let io_gripper_size: number = 15
let io_gripper_spacing: number = 10

let forest_root_name: string = "__forest_root"
let node_spacing: number = 80
let drop_target_root_size: number = 150

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
    .call(
      zoomObject.scaleExtent([0.3, 1.0]).on('zoom', function () {
        container.attr('transform', d3.event.transform)
      })
    )
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

  if (!dragging) {
    if (pan_interval_id !== undefined) {
      window.clearInterval(pan_interval_id)
      pan_direction = []
    }

    return
  }

  const viewport = d3.select(viewport_ref.value)
  const width = viewport.node()!.getBoundingClientRect().width
  const height = viewport.node()!.getBoundingClientRect().height

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
  if (!dragging && pan_interval_id) {
    window.clearInterval(pan_interval_id)
    pan_interval_id = undefined
    return
  }

  d3.select(viewport_ref.value!).call(zoomObject!.translateBy, pan_direction[0], pan_direction[1])
}

function drawEverything() {
  if (editor_store.tree === undefined) {
    // TODO draw drop targets if tree is null
    console.warn("Tree is undefined")
    return
  }
  
  if (
    g_vertices_ref.value === undefined
  ) {
    // TODO handle DOM is broken
    console.warn("DOM is broken")
    return
  }

  // Prepare transition config for synchronization
  tree_transition = d3.transition().duration(100).ease(d3.easeQuad)
  
  const onlyKeyAndType = (nodeData: NodeData) => ({
    key: nodeData.key,
    serialized_type: nodeData.serialized_type,
  } as TrimmedNodeData);

  // Trim the serialized data values from the node data - we won't
  // render them, so don't clutter the DOM with the data
  const trimmed_nodes: TrimmedNode[] = editor_store.tree.nodes.map((node) => {
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
      size: {width: 1, height: 1}
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
    size: { width: 0, height: 0 }
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
      ".node"
    )
    .data(
      root.descendants().filter((node) => node.data.name !== forest_root_name),
      (node) => node.id!
    ) // Join performs enter, update and exit at once
    .join(drawNewNodes)
    .call(updateNodeBody)
    .call(layoutTree, root)

  // TODO(nberg): Find a way to get rid of this - it's here because
  // the DOM changes in updateNodes take a while to actually happen,
  // and layoutNodes needs getBoundingClientRect information...
  //window.setTimeout(() => {
    //layoutNodes(svg, root)

    //drawDropTargets()

    //drawDataGraph(g_data, node2.data(), tree_msg.data_wirings)
  //}, 100)

}

function drawNewNodes(
    selection: d3.Selection<
      d3.EnterElement,
      d3.HierarchyNode<TrimmedNode>,
      SVGGElement,
      never
    >
) {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  //const that = this;

  const fo = selection
    .append("foreignObject")
      .classed("node", true)
      .classed("node--internal", 
        (d) => d.children !== undefined && d.children.length > 0)
      .classed("node--leaf",
        (d) => d.children === undefined || d.children.length == 0)
    /*.on("click", this.nodeClickHandler.bind(this))
    .on("mousedown", function (d) {
      that.nodeMousedownHandler(d, this);
    })
    .on("dblclick", this.nodeDoubleClickHandler.bind(this))*/
    // TODO add mouse event handlers

  const body = fo
    .append("xhtml:body")
      .classed("btnode p-2", true)
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
  body.append("h4").classed("node_name", true)
  body.append("h5").classed("class_name", true)

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

  const body = selection.select<HTMLBodyElement>(".btnode")

  body.style("max-width", "200px")

  body.select<HTMLHeadingElement>(".node_name")
      .html((d) => d.data.name)

  body.select<HTMLHeadingElement>(".class_name")
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

function layoutTree(selection: d3.Selection<
    SVGForeignObjectElement,
    d3.HierarchyNode<TrimmedNode>,
    SVGGElement,
    never>,
  root: d3.HierarchyNode<TrimmedNode>
) {

  const tree_layout = flextree<TrimmedNode>({
    nodeSize: (node: HierarchyNode<TrimmedNode>) => 
      [node.data.size.width, node.data.size.height + (node.depth > 0 ? node_spacing : 0)],
    spacing: node_spacing, // This only applies to horizontal adjacent nodes
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

  drawEdges(tree_layout)
  drawDropTargets(tree_layout)
}

function drawEdges(tree_layout: FlextreeNode<TrimmedNode>) {

  if (
    g_edges_ref.value === undefined
  ) {
    // TODO handle DOM is broken
    console.warn("DOM is broken")
    return
  }

  d3.select(g_edges_ref.value)
    .selectAll<SVGPathElement, d3.HierarchyLink<TrimmedNode>>(".link")
    .data(tree_layout.links().filter(
        (link : d3.HierarchyLink<TrimmedNode>) => link.source.data.name !== forest_root_name
      ), (link) => link.source.id! + "###" + link.target.id!)
    .join("path")
      .attr("class", "link") // Redundant for update elements, preserves readability
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
    //TODO handle DOM is broken
    return
  }

  console.log(tree_layout)

  const drop_targets: DropTarget[] = []

  // Construct the list of drop targets that should exist
  tree_layout.each((node) => {
    // Left target for first child of node
    if (node.children !== undefined) {
      drop_targets.push({node: node.children[0], position: Position.LEFT})
    }
    // Since other drop targets are constructed on node not node.children, 
    // we can return for the invisible __forest_root
    if (node.data.name === forest_root_name) {
      return
    }
    drop_targets.push({node: node, position: Position.CENTER})
    drop_targets.push({node: node, position: Position.RIGHT})
    drop_targets.push({node: node, position: Position.TOP}) // Does this make sense?
    if (node.data.max_children === -1 || node.data.max_children > node.data.child_names.length) {
      drop_targets.push({node: node, position: Position.BOTTOM})
    }

  })

  // If there are no drop targets to draw, draw one at root
  // Adjust the size of the drop target, don't do this on init, it ruins the tree layout
  if (drop_targets.length === 0) {
    tree_layout.data.size.width = drop_target_root_size
    tree_layout.data.size.height = drop_target_root_size
    drop_targets.push({node: tree_layout, position: Position.CENTER})
  }

  // Join those with the existing drop targets and draw them
  d3.select(g_drop_targets_ref.value)
    .selectAll<SVGRectElement, DropTarget>(".drop_target")
    .data(drop_targets, (d) => d.node.data.name + "###" + d.position)
    .join("rect")
      .classed("drop_target", true)
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
      .on("mouseover", function (d) {
        dropTargetDefaultMouseoverHandler(this, d)
      })
      .on("mouseout", function () {
        dropTargetDefaultMouseoutHandler(this)
      })
}

function dropTargetDefaultMouseoverHandler(
  domElement: SVGRectElement,
  datum: DropTarget
) {
  node_drop_target = datum;
  d3.select(domElement).attr("opacity", 0.8);
}

function dropTargetDefaultMouseoutHandler(
  domElement: SVGRectElement
) {
  node_drop_target = undefined;
  d3.select(domElement).attr("opacity", 0.2);
}


onMounted(() => {
  if (
    viewport_ref.value === undefined ||
    svg_g_ref.value === undefined ||
    false //TODO Why did this read zoomObject === undefined alt: init in let def  
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

  viewport.on('mouseup', () => {
    console.log('mouseup before zoom')
  })

  zoomObject = d3.zoom<SVGSVGElement, unknown>()
  const container = d3.select(svg_g_ref.value)

  zoomObject.filter(function () {
    return !d3.event.shiftKey
  })

  const svg_viewport = d3.select(svg_g_ref.value)
  svg_viewport.on('mouseup', () => {
    let msg: NodeMsg | null = null

    if (editor_store.dragging_node) {
      msg = buildNodeMessage(editor_store.dragging_node)
    }

    if (msg !== null) {
      let parent_name = ''
      let position = -1
      if (node_drop_target && node_drop_target.data) {
        if (node_drop_target.data.name === '__forest_root') {
          node_drop_target.data.name = ''
        } else {
          position = node_drop_target.position
        }
        parent_name = node_drop_target.data.name
      }
      ros_store.add_node_at_index_service.callService(
        {
          parent_name: parent_name,
          node: msg,
          allow_rename: true,
          new_child_index: position
        } as AddNodeAtIndexRequest,
        (response: AddNodeAtIndexResponse) => {
          if (response.success) {
            notify({
              title: 'Added node ' + response.actual_node_name,
              type: 'success'
            })
          } else {
            if (msg !== null) {
              notify({
                title: 'Failed to add node ' + msg.name,
                text: response.error_message,
                type: 'error'
              })
            } else {
              notify({
                title: 'Failed to add node',
                text: response.error_message,
                type: 'error'
              })
            }
          }
        }
      )
    }
  })

  // Call resetView to center tree container
  resetView()

  viewport.on('mousemove.pan_if_drag', canvasMouseMovePanHandler)

  viewport.on('click', () => {
    if (!d3.event.shiftKey) {
      editor_store.editorSelectionChange(undefined)
      editor_store.unselectEdge()
    }
  })

  selection = false
  mouse_moved = false
  start_y = 0

  // selection rectangle
  viewport
    .append('rect')
      .attr('class', 'selection')
      .attr('width', 0)
      .attr('height', 0)
      .attr('x', 0)
      .attr('y', 0)

  // start the selection
  viewport.on('mousedown', () => {
    if (d3.event.shiftKey) {
      selection = true // indicates a shift-mousedown enabled selection rectangle

      const s = viewport.select('rect.selection')

      if (!s.empty()) {
        s.attr('x', d3.event.pageX - viewport_x).attr('y', d3.event.pageY - viewport_y)
        start_x = parseInt(s.attr('x'))
        start_y = parseInt(s.attr('y'))
      }
    }
  })

  // show the selection rectangle on mousemove
  viewport.on('mousemove', () => {
    if (d3.event.shiftKey && selection) {
      mouse_moved = true

      const s = viewport.select('rect.selection')

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
  viewport.on('mouseup', () => {
    if (selection && mouse_moved) {
      selection = false // hide the selection rectangle
      mouse_moved = false
      const s = viewport.select('rect.selection')
      s.attr('width', 0).attr('height', 0)

      const selected_node_names: Set<string> = new Set()

      viewport
        .selectAll<SVGForeignObjectElement, FlextreeNode<TrimmedNode>>('foreignObject')
        .each(function (data) {
          if (d3.select(this).select('body').classed('node-selected')) {
            selected_node_names.add(data.id!)
          }
        })
      editor_store.selectMultipleNodes(Array.from(selected_node_names))
    }
  })
})
</script>

<template>
  <svg id="editor_viewport" ref="viewport_ref" class="reactive-svg" :class="editor_store.skin">
    <g id="container" ref="svg_g_ref">
      <g class="edges" ref="g_edges_ref"/>
      <g class="vertices" ref="g_vertices_ref"/>
      <g class="data_graph" ref="g_data_graph_ref">
        <g class="data_edges" ref="g_data_edges_ref"/>
        <g class="data_vertices" ref="g_data_vertices_ref"/>
      </g>
      <!--drop_targets has visibility="hidden", removed for testing-->
      <g class="drop_targets" ref="g_drop_targets_ref"/>
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
    <text
      x="200"
      y="20"
      fill="#FFFFFF"
      textAnchor="left"
      alignmentBaseline="central"
      class="cursor-pointer svg-button"
      @click="drawEverything"
    >
      Redraw Tree
    </text>
  </svg>
</template>

<style lang="scss">
  @import "src/assets/editor.scss";
</style>
