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
import { EditorSkin, useEditorStore } from '@/stores/editor'
import { useEditNodeStore } from '@/stores/edit_node'
import { useROSStore } from '@/stores/ros'
import type {
  DataEdgePoint,
  DataEdgeTerminal,
  DataEdge,
  DocumentedNode,
  DropTarget,
  NodeDataLocation,
  OptionData,
  TrimmedNode,
  TrimmedNodeData,
  NodeStructure,
  NodeOption,
  NodeIO,
  Wiring,
} from '@/types/types'
import { Position, IOKind, NodeStateValues } from '@/types/types'
import { getDefaultValue, prettyprint_type, serializeNodeOptions, typesCompatible } from '@/utils'
import { notify } from '@kyvg/vue3-notification'
import * as d3 from 'd3'
import { onMounted, ref, watch, watchEffect } from 'vue'
import { addNode, moveNode, replaceNode } from '@/tree_manipulation'
import type { HierarchyNode, HierarchyLink } from 'd3-hierarchy'
import { flextree, type FlextreeNode } from 'd3-flextree'
import type { WireNodeDataRequest, WireNodeDataResponse } from '@/types/services/WireNodeData'
import { faBolt, faCheck, faPause, faPowerOff, faXmark } from '@fortawesome/free-solid-svg-icons'

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
const draw_indicator_ref = ref<SVGPathElement>()
const selection_rect_ref = ref<SVGRectElement>()

let zoomObject: d3.ZoomBehavior<SVGSVGElement, unknown> | undefined = undefined

let selection: boolean = false
let mouse_moved: boolean = false
let start_x: number = 0.0
let start_y: number = 0.0
const selected_nodes = ref<string[]>([])

let pan_interval_id: number | undefined = undefined
let pan_direction: number[] = [0.0, 0.0]
const pan_rate: number = 30
const drag_pan_boundary: number = 50
const pan_per_frame: number = 10.0

const line_wrap_regex: RegExp = /[a-z0-9][A-Z]|[_\- ][a-zA-Z]/gd

const io_gripper_size: number = 15
const io_gripper_spacing: number = 10

const io_edge_offset: number = 20
const io_edge_bump_thresh: number = 50
const io_edge_bump_factor: number = 0.02
const io_edge_curve_offset: number = 5
const io_edge_curve_factor: number = 0.0001

const forest_root_name: string = '__forest_root'
const node_padding: number = 10
const node_spacing: number = 80
const name_line_length: number = 20
const name_first_line_indent: number = 3
const class_line_length: number = 25
const icon_width: number = 30
const node_name_height: number = 40
const node_class_height: number = 30
const drop_target_root_size: number = 150

// constants for css classes & ids used with d3
const tree_node_css_class: string = 'node'
const node_body_css_class: string = 'btnode'
const node_name_css_class: string = 'node_name'
const node_class_css_class: string = 'class_name'
const node_state_css_class: string = 'state_icon'
const tree_edge_css_class: string = 'link'
const drop_target_css_class: string = 'drop_target'
const data_vert_group_css_class: string = 'gripper-group'
const data_vert_grip_css_class: string = 'gripper'
const data_vert_label_css_class: string = 'label'
const data_vert_label_type_css_class: string = 'label-type'
const data_edge_css_class: string = 'data-link'

const data_edge_highlight_css_id: string = 'hightlightEdge'
const data_vert1_highlight_css_id: string = 'highlightV1'
const data_vert2_highlight_css_id: string = 'highlightV2'

const data_graph_hover_css_class: string = 'data-hover'
const data_graph_comaptible_css_class: string = 'compatible'

const node_selected_css_class: string = 'node-selected'
const data_graph_select_css_class: string = 'data-select'

// This is the base transition for tree updates
// Use <selection>.transition(tree_transition)
let tree_transition: d3.Transition<d3.BaseType, unknown, null, undefined>

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
  const zoom_factor = d3.zoomTransform(viewport_ref.value).k
  const offset = height * 0.5 / zoom_factor - 60.0

  viewport.call(zoomObject.translateTo, 0.0, offset)
}

function buildNodeMessage(node: DocumentedNode): NodeStructure {
  const options = node.options.map((opt: NodeOption) => {
    return {
      key: opt.key,
      value: getDefaultValue(prettyprint_type(opt.serialized_type), node.options)
    } as OptionData
  })

  return {
    module: node.module,
    node_class: node.node_class,
    name: node.name,
    options: serializeNodeOptions(options),
    child_names: [],
    inputs: [],
    outputs: [],
    version: '',
    max_children: 0,
  }
}

function canvasMouseMovePanHandler(event: Event) {
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

  const mouseCoords = d3.pointer(event, viewport_ref.value)

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

watch(
  [
    () => editor_store.current_tree.structure,
    () => editor_store.is_layer_mode,
  ],
  drawEverything,
  { immediate: true }
)
function drawEverything() {
  if (svg_g_ref.value === undefined || 
    g_vertices_ref.value === undefined
  ) {
    console.warn('DOM is broken')
    return
  }

  if (editor_store.current_tree.structure === undefined) {
    console.warn("Nothing to draw")
    return
  }

  // Prepare transition config for synchronization, the typed select statement is necessary to give the transition appropriate typing
  tree_transition = d3
    .select<d3.BaseType, unknown>(svg_g_ref.value)
    .transition('tree-transition')
      .duration(100)
      .ease(d3.easeQuad)

  // Strips potentially additional properties
  const onlyKeyAndType = (nodeData: NodeIO) =>
    ({
      key: nodeData.key,
      serialized_type: nodeData.serialized_type
    }) as TrimmedNodeData

  // Trim the serialized data values from the node data - we won't
  // render them, so don't clutter the DOM with the data
  const trimmed_nodes: TrimmedNode[] = editor_store.current_tree.structure.nodes.map((node) => {
    return {
      node_class: node.node_class,
      module: node.module,
      name: node.name,
      max_children: node.max_children,
      child_names: node.child_names,
      options: node.options.map(onlyKeyAndType),
      inputs: node.inputs.map(onlyKeyAndType),
      outputs: node.outputs.map(onlyKeyAndType),
      size: { width: 1, height: 1 },
      offset: {x: 0, y: 0}
    } as TrimmedNode
  })

  const forest_root: TrimmedNode = {
    node_class: '',
    module: '',
    max_children: -1,
    name: forest_root_name,
    child_names: [],
    inputs: [],
    outputs: [],
    options: [],
    size: { width: 0, height: 0 },
    offset: {x: 0, y: 0}
  }

  if (trimmed_nodes.findIndex((x) => x.name === forest_root_name) < 0) {
    trimmed_nodes.push(forest_root)
  }

  // Update the visual tree
  const parents: Record<string, string> = {}
  //const node_dict: Record<string, TrimmedNode> = {}; Is unused?
  // Find parents for all nodes once
  for (const i in trimmed_nodes) {
    const node = trimmed_nodes[i]
    //node_dict[node.name] = node;
    for (const j in node.child_names) {
      parents[node.child_names[j]] = node.name
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
        forest_root.child_names.push(node.name)
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
    const child_list = a.parent!.data.child_names
    return (
      child_list.findIndex((x) => x === a.data.name) -
      child_list.findIndex((x) => x === b.data.name)
    )
  })

  const g_vertex = d3.select<SVGGElement, never>(g_vertices_ref.value)

  const node = g_vertex
    .selectAll<SVGSVGElement, d3.HierarchyNode<TrimmedNode>>('.' + tree_node_css_class)
    .data(
      root.descendants().filter((node) => node.data.name !== forest_root_name),
      (node) => node.id!
    ) // Join performs enter, update and exit at once
    .join(drawNewNodes)
    .call(updateNodeBody)
    
    updateNodeState()

  // Since we want to return the tree, we can't use the .call() syntax here
  const tree_layout = layoutTree(node, root)

  drawEdges(tree_layout)
  drawDropTargets(tree_layout)
  drawDataGraph(tree_layout, editor_store.current_tree.structure.data_wirings)
}

function drawNewNodes(
  selection: d3.Selection<d3.EnterElement, d3.HierarchyNode<TrimmedNode>, SVGGElement, never>
) {
  const group = selection
    .append<SVGGElement>('g')
    .classed(tree_node_css_class, true)
    // The two css-classes below are currently unused
    .classed('node--internal', (d) => d.children !== undefined && d.children.length > 0)
    .classed('node--leaf', (d) => d.children === undefined || d.children.length == 0)
    .on('click.select', (event, node: d3.HierarchyNode<TrimmedNode>) => {
      if (event.shiftKey) {
        edit_node_store.selectMultipleNodes([node.data.name])
      } else {
        edit_node_store.editorSelectionChange(node.data.name)
      }
      event.stopPropagation()
    })

  // No tree modifying if displaying a subtree
  if (!editor_store.has_selected_subtree) {
    group.on('mousedown.dragdrop', (event, node: d3.HierarchyNode<TrimmedNode>) => {
      editor_store.startDraggingExistingNode(node)
      event.stopPropagation()
    })
  }

  group.append<SVGRectElement>('rect')
      .classed(node_body_css_class, true)

  group.append<SVGTextElement>('text')
      .classed(node_name_css_class, true)

  group.append<SVGTextElement>('text')
      .classed(node_class_css_class, true)

  group.append('svg')
      .classed(node_state_css_class, true)
      .attr('width', icon_width)
      .attr('height', icon_width)
    .append('path')
  

  // The join pattern requires a return of the appended elements
  // For consistency the node body is filled using the update method
  return group
}

function getIcon(state: NodeStateValues | undefined) {
  switch (state) {
    case NodeStateValues.RUNNING:
      return faBolt.icon
    case NodeStateValues.IDLE:
      return faPause.icon
    case NodeStateValues.SUCCEEDED:
      return faCheck.icon
    case NodeStateValues.FAILED:
      return faXmark.icon
    case NodeStateValues.SHUTDOWN:
    default:
      return faPowerOff.icon
  }
}

function layoutText(
  element: SVGGElement,
  data: d3.HierarchyNode<TrimmedNode>,
): number {

  // Track width of longest line and return that for box sizing
  let max_width: number = 0

  const group_elem = d3.select<SVGGElement, d3.HierarchyNode<TrimmedNode>>(element)

  const name_elem = group_elem.select<SVGTextElement>('.' + node_name_css_class)
  const class_elem = group_elem.select<SVGTextElement>('.' + node_class_css_class)

  const node_name = data.data.name
  const node_class = data.data.node_class

  name_elem.selectAll<SVGTSpanElement, never>('tspan')
    .remove()

  class_elem.selectAll<SVGTSpanElement, never>('tspan')
    .remove()

  let title_lines: number = 0

  // Find positions for potential line breaks
  let wrap_indices: number[] = [0]
  for(const match of node_name.matchAll(line_wrap_regex)) {
    wrap_indices.push(match.index + 1)
  }
  wrap_indices.push(node_name.length)
  wrap_indices.reverse()

  // Place text into multiple lines
  let current_index: number = 0
  while (current_index < node_name.length) {

    // Prepare DOM-element for next line
    const tspan = name_elem.append('tspan')
    tspan.attr('x', 0)
    if (current_index > 0) {
      tspan.attr('dy', node_name_height)
    }

    // Since this predicate is guaranteed to hold at some point, next_idx is always >= 0
    let next_idx: number = wrap_indices.findIndex((val) => {
      if (current_index === 0) {
        return val < name_line_length - name_first_line_indent
      } else {
        return val < current_index + name_line_length
      }
    })

    // If the next word is longer than the max line length, print it anyway
    if (wrap_indices[next_idx] === current_index) {
      next_idx -= 1
    }
    
    const next_index = wrap_indices[next_idx]
    tspan.text(node_name.slice(current_index, next_index))

    // Update variables for next line
    if (current_index === 0) {
      max_width = tspan.node()!.getComputedTextLength() + icon_width + node_padding
    } else {
      max_width = Math.max(max_width, tspan.node()!.getComputedTextLength())
    }
    current_index = next_index
    title_lines += 1
  }

  class_elem.attr('y', title_lines * node_name_height)

  // Find positions for potential line breaks
  wrap_indices = [0]
  for(const match of node_class.matchAll(line_wrap_regex)) {
    wrap_indices.push(match.index + 1)
  }
  wrap_indices.push(node_class.length)
  wrap_indices.reverse()

  // Place text into multiple lines
  current_index = 0
  while (current_index < node_class.length) {

    // Prepare DOM-element for next line
    const tspan = class_elem.append('tspan')
    tspan.attr('x', 0)
    if (current_index > 0) {
      tspan.attr('dy', node_class_height)
    }

    // Since this predicate is guaranteed to hold at some point, next_idx is always >= 0
    let next_idx: number = wrap_indices.findIndex(
      (val) => val < current_index + class_line_length
    )

    // If the next word is longer than the max line length, print it anyway
    if (wrap_indices[next_idx] === current_index) {
      next_idx -= 1
    }

    const next_index = wrap_indices[next_idx]
    tspan.text(node_class.slice(current_index, next_index))

    // Update variables for next line
    max_width = Math.max(max_width, tspan.node()!.getComputedTextLength())
    current_index = next_index
  }

  return max_width
}

function updateNodeBody(
  selection: d3.Selection<
    SVGGElement,
    d3.HierarchyNode<TrimmedNode>,
    SVGGElement,
    never
  >
) {

  selection
      .each(function (node) 
        { node.data.size.width = layoutText(this, node) }
      )

  // Reset width and height of background rect
  selection
    .select<SVGRectElement>('.' + node_body_css_class)
      .attr('x', null)
      .attr('y', null)
      .attr('width', null)
      .attr('height', null)

  // Get width and height from text content
  selection.each(function (d) {
    const inputs = d.data.inputs || []
    const outputs = d.data.outputs || []
    const max_num_grippers = Math.max(inputs.length, outputs.length)
    const min_height = io_gripper_size * max_num_grippers + 
      io_gripper_spacing * (max_num_grippers + 1)
    const rect = this.getBBox()
    d.data.offset.x = rect.x - node_padding
    d.data.offset.y = rect.y - 0.5 * node_padding
    // Width has already been set by text layout function
    d.data.size.width += 2 * node_padding
    d.data.size.height = Math.max(rect.height +  1.5 * node_padding, min_height)
  })

  selection
    .select<SVGRectElement>('.' + node_body_css_class)
      .attr('x', (d) => d.data.offset.x)
      .attr('y', (d) => d.data.offset.y)
      .attr('width', (d) => d.data.size.width)
      .attr('height', (d) => d.data.size.height)

  return selection
}

watch(
  () => editor_store.current_tree.state,
  updateNodeState
)
function updateNodeState() {
  if (g_vertices_ref.value === undefined) {
    console.warn("DOM is broken")
    return
  }

  const g_vertex = d3.select<SVGGElement, never>(g_vertices_ref.value)

  const node = g_vertex
    .selectAll<SVGSVGElement, d3.HierarchyNode<TrimmedNode>>('.' + tree_node_css_class)
      .each((node) => {
        if (editor_store.current_tree.state === undefined) {
          console.warn("No state to update")
          return
        }
        const state = editor_store.current_tree.state.node_states.find(
          (state) => state.name === node.data.name
        )
        if (state !== undefined) {
          node.data.state = state.state
        }
      })
  node.select<SVGRectElement>('.' + node_body_css_class)
    .style('stroke', (d) => {
      switch (d.data.state) {
        case NodeStateValues.RUNNING:
          return 'var(--node-color-running)'
        case NodeStateValues.IDLE:
          return 'var(--node-color-idle)'
        case NodeStateValues.SUCCEEDED:
          return 'var(--node-color-succeeded)'
        case NodeStateValues.FAILED:
          return 'var(--node-color-failed)'
        case NodeStateValues.SHUTDOWN:
          return 'var(--node-color-shutdown)'
        case NodeStateValues.UNINITIALIZED:
        default:
          return 'var(--node-color-default)'
      }
    })
  node.select<SVGElement>('.' + node_state_css_class)
      .attr('viewBox', (node) => {
        const icon = getIcon(node.data.state)
        return "0 0 " + icon[0] + " " + icon[1]
      })
      .attr('x', (node) => node.data.size.width - icon_width - 2 * node_padding)
      .attr('y', (node) => node.data.offset.y + node_padding)
    .select<SVGPathElement>('path')
      .attr('d', (node) => {
        const icon = getIcon(node.data.state)
        if (typeof icon[4] === "string") {
          return icon[4]
        } else {
          console.warn("Potentially unhandled multivalue path", icon[4])
          return icon[4].join('')
        }
      })
}

function layoutTree(
  selection: d3.Selection<
    SVGGElement,
    d3.HierarchyNode<TrimmedNode>,
    SVGGElement,
    never
  >,
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
    } // This only applies to horizontal adjacent nodes
  })(root as HierarchyNode<TrimmedNode>)
  //FIXME This typecast shouldn't be necessary, but apparrently the types
  // d3.HierarchyNode and d3-hierarchy.HierarchyNode differ, as
  // d3.HierarchyNode doesn't expose the find function???
  // Potentially an issue with the typing library

  // Bind the new data to get a selection with all flextree properties
  selection
    .data(
      tree_layout.descendants().filter((node) => node.data.name !== forest_root_name),
      (node) => node.id!
    )
    .transition(tree_transition)
    .attr('transform', (d: FlextreeNode<TrimmedNode>) => {
      const x = d.x - d.data.size.width / 2.0
      const y = d.y
      return 'translate(' + x + ', ' + y + ')'
    })

  return tree_layout
}

function drawEdges(tree_layout: FlextreeNode<TrimmedNode>) {
  if (g_edges_ref.value === undefined) {
    console.warn('DOM is broken')
    return
  }

  d3.select(g_edges_ref.value)
    .selectAll<SVGPathElement, d3.HierarchyLink<TrimmedNode>>('.' + tree_edge_css_class)
    .data(
      tree_layout
        .links()
        .filter(
          (link: d3.HierarchyLink<TrimmedNode>) => link.source.data.name !== forest_root_name
        ),
      (link) => link.source.id! + '###' + link.target.id!
    )
    .join('path')
    .classed(tree_edge_css_class, true) // Redundant for update elements, preserves readability
    .transition(tree_transition)
    .attr(
      'd',
      d3
        .linkVertical<SVGPathElement, HierarchyLink<TrimmedNode>, [number, number]>()
        .source((link: HierarchyLink<TrimmedNode>) => {
          const source = link.source as FlextreeNode<TrimmedNode>
          return [
            source.x + source.data.offset.x, 
            source.y + source.data.offset.y + source.data.size.height
          ]
        })
        .target((link: HierarchyLink<TrimmedNode>) => {
          const target = link.target as FlextreeNode<TrimmedNode>
          return [
            target.x + target.data.offset.x, 
            target.y + target.data.offset.y
          ]
        })
    )
}

function drawDropTargets(tree_layout: FlextreeNode<TrimmedNode>) {
  if (g_drop_targets_ref.value === undefined) {
    console.warn('DOM is broken')
    return
  }

  const drop_targets: DropTarget[] = []

  // Only draw drop targets if not displaying a subtree
  if (!editor_store.has_selected_subtree) {
    // Construct the list of drop targets that should exist
    tree_layout.each((node: FlextreeNode<TrimmedNode>) => {
      if (node.data.name === forest_root_name) {
        return
      }

      // Draw all left and right targets, even though they sometimes overlap
      // because it looks odd if they're missing once nodes are spaced out further
      drop_targets.push({ node: node, position: Position.LEFT })
      drop_targets.push({ node: node, position: Position.CENTER })
      drop_targets.push({ node: node, position: Position.RIGHT })
      drop_targets.push({ node: node, position: Position.TOP }) // Does this make sense?
      if (node.data.max_children === -1 || node.data.max_children > node.data.child_names.length) {
        drop_targets.push({ node: node, position: Position.BOTTOM })
      }
    })
  }

  // If there are no drop targets to draw, draw one at root
  // Adjust the size of the drop target here. Don't do this on init, it ruins the tree layout
  if (drop_targets.length === 0) {
    drop_targets.push({ node: tree_layout, position: Position.ROOT })
  }

  // Join those with the existing drop targets and draw them
  d3.select(g_drop_targets_ref.value)
    .selectAll<SVGRectElement, DropTarget>('.' + drop_target_css_class)
    .data(drop_targets, (d) => d.node.id! + '###' + d.position)
    .join('rect')
    .classed(drop_target_css_class, true)
    .attr('width', (d) => {
      // Switch cases without breaks work like a convenient OR
      switch (d.position) {
        case Position.LEFT:
        case Position.RIGHT:
          return node_spacing
        case Position.TOP:
        case Position.BOTTOM:
        case Position.CENTER:
          return d.node.data.size.width
        case Position.ROOT:
          return drop_target_root_size
        default:
          return 0
      }
    })
    .attr('height', (d) => {
      switch (d.position) {
        case Position.LEFT:
        case Position.RIGHT:
        case Position.CENTER:
          return d.node.data.size.height
        case Position.TOP:
        case Position.BOTTOM:
          return 0.5 * node_spacing
        case Position.ROOT:
          return drop_target_root_size
        default:
          return 0
      }
    })
    .attr('x', (d) => {
      if (d.position === Position.ROOT) {
        return -drop_target_root_size / 2
      }
      let x = d.node.x + d.node.data.offset.x
      if (d.position === Position.RIGHT) {
        x += 0.5 * d.node.data.size.width
      } else {
        x -= 0.5 * d.node.data.size.width
        if (d.position === Position.LEFT) {
          x -= node_spacing
        }
      }
      return x
    })
    .attr('y', (d) => {
      if (d.position === Position.ROOT)
    {
      return -0.5 * node_spacing
    }
      let y = d.node.y + d.node.data.offset.y
      if (d.position === Position.TOP) {
        y -= 0.5 * node_spacing
      }
      if (d.position === Position.BOTTOM) {
        y += d.node.data.size.height
      }
      return y
    })
    .attr('opacity', 0.2)
    .on('mouseover.highlight', function () {
      d3.select(this).attr('opacity', 0.8)
    })
    .on('mouseout.highlight', function () {
      d3.select(this).attr('opacity', 0.2)
    })
    .on('mouseup.dragdrop', (ev, d) => {
      if (editor_store.dragging_new_node) {
        addNewNode(d)
      } else if (editor_store.dragging_existing_node) {
        moveExistingNode(d)
      } else {
        console.warn('Unintended drag release')
      }
    })
}

function dropTargetGroupVisibility(): string {
  if (
    editor_store.dragging_new_node !== undefined ||
    editor_store.dragging_existing_node !== undefined
  ) {
    return 'visible'
  }
  return 'hidden'
}

async function moveExistingNode(drop_target: DropTarget) {
  if (editor_store.dragging_existing_node === undefined) {
    console.warn('Tried to move existing node by dragging but none selected')
    return
  }

  const node_name = editor_store.dragging_existing_node.data.name

  if (!drop_target.node.parent) {
    console.error('A tree with an existing node should never show the root target')
    return
  }

  if (drop_target.position === Position.BOTTOM) {
    await moveNode(node_name, drop_target.node.data.name, 0)
    return
  }

  if (
    drop_target.position === Position.LEFT ||
    drop_target.position === Position.RIGHT
  ) {
    let parent_name = drop_target.node.parent.data.name
    if (parent_name === forest_root_name) {
      parent_name = ''
    }
    let index = drop_target.node.parent.children!.indexOf(drop_target.node)
    if (drop_target.position === Position.RIGHT) {
      index++
    }
    // If the node is moved in it's own row (same parent), we need to offset the index
    if (
      parent_name === editor_store.dragging_existing_node.parent!.data.name &&
      index > drop_target.node.parent.children!.findIndex(
        (node: FlextreeNode<TrimmedNode>) => node.data.name === node_name
      )
    ) {
      index--
    }
    await moveNode(node_name, parent_name, index)
    return
  }

  // Checks on whether the new node is an appropriate replacement/ancestor
  // are presumed done based on whether this target was available in the first place.

  if (drop_target.position === Position.TOP) {
    let parent_name = drop_target.node.parent.data.name
    if (parent_name === forest_root_name) {
      parent_name = ''
    }
    let index = drop_target.node.parent.children!.indexOf(drop_target.node)
    // If the node is moved in it's own row (same parent), we need to offset the index
    if (
      parent_name === editor_store.dragging_existing_node.parent!.data.name &&
      index > drop_target.node.parent.children!.findIndex(
        (node: FlextreeNode<TrimmedNode>) => node.data.name === node_name
      )
    ) {
      index--
    }

    // Care has to be taken regarding order of operations to not overload the parent node.
    // Insert new node at the end, then move node to old position
    await moveNode(drop_target.node.data.name, node_name, -1)
    await moveNode(node_name, parent_name, index)
    return
  }

  if (drop_target.position === Position.CENTER) {
    await replaceNode(drop_target.node.data.name, node_name)
    return
  }

  console.warn("Couldn't identify drop target position, this should never happen")

}

watchEffect(toggleExistingNodeTargets)
function toggleExistingNodeTargets() {
  if (g_drop_targets_ref.value === undefined) {
    console.warn('DOM is broken')
    return
  }

  //Reset visibility for all targets
  const targets = d3
    .select(g_drop_targets_ref.value)
    .selectAll<SVGRectElement, DropTarget>('.' + drop_target_css_class)
    .attr('visibility', null)

  if (editor_store.dragging_existing_node === undefined) {
    return
  }

  // The first filter hides all nodes in the currently dragged subtree
  // The second filter hides all nodes where dropping would overload a child node count
  //TODO Maybe we should hide targets that would place the node in the same spot

  // If the filter returns true (keeps the node) it gets hidden
  targets
    .filter((drop_target: DropTarget) => {
      return (
        editor_store
          .dragging_existing_node!.descendants()
          .find((node: d3.HierarchyNode<TrimmedNode>) => {
            return node.data.name === drop_target.node.data.name
          }) !== undefined
      )
    })
    .attr('visibility', 'hidden')

  // If the filter returns true (keeps the node) it gets hidden
  targets
    .filter((drop_target: DropTarget) => {
      switch (drop_target.position) {
        case Position.CENTER:
          return (
            editor_store.dragging_existing_node!.data.max_children !== -1 &&
            drop_target.node.data.child_names.length +
              editor_store.dragging_existing_node!.data.child_names.length >
              editor_store.dragging_existing_node!.data.max_children
          )
        case Position.TOP:
          return (
            editor_store.dragging_existing_node!.data.max_children !== -1 &&
            editor_store.dragging_existing_node!.data.child_names.length >=
            editor_store.dragging_existing_node!.data.max_children
          )
        case Position.BOTTOM:
          return (
            drop_target.node.data.max_children !== -1 &&
            drop_target.node.data.name !== editor_store.dragging_existing_node!.parent!.data.name &&
            drop_target.node.data.child_names.length >= drop_target.node.data.max_children
          )
        case Position.LEFT:
        case Position.RIGHT:
          return (
            drop_target.node.parent!.data.max_children !== -1 &&
            drop_target.node.parent!.data.name !==
              editor_store.dragging_existing_node!.parent!.data.name &&
            drop_target.node.parent!.data.child_names.length >=
              drop_target.node.parent!.data.max_children
          )
        case Position.ROOT:
          // This should never happen, as an existing node implies a non-empty tree
        default:
          return true
      }
    })
    .attr('visibility', 'hidden')
}

async function addNewNode(drop_target: DropTarget) {
  if (editor_store.dragging_new_node === undefined){
    console.warn('Tried to add new node by dragging but none selected')
    return
  }

  const msg = buildNodeMessage(editor_store.dragging_new_node)

  if (drop_target.position === Position.ROOT) {
    await addNode(msg, '', 0)
    return
  }

  if (!drop_target.node.parent) {
    console.error('All non-root targets should have a set parent node')
    return
  }

  if (drop_target.position === Position.BOTTOM) {
    const parent_name = drop_target.node.data.name
    await addNode(msg, parent_name, 0)
    return
  }

  if (
    drop_target.position === Position.LEFT ||
    drop_target.position === Position.RIGHT
  ) {
    let parent_name = drop_target.node.parent.data.name
    if (parent_name === forest_root_name) {
      parent_name = ''
    }
    let index = drop_target.node.parent.children!.indexOf(drop_target.node)
    if (drop_target.position === Position.RIGHT) {
      index++
    }
    await addNode(msg, parent_name, index)
    return
  }

  // Checks on whether the new node is an appropriate replacement/ancestor
  // are presumed done based on whether this target was available in the first place.

  if (drop_target.position === Position.TOP) {
    let parent_name = drop_target.node.parent.data.name
    if (parent_name === forest_root_name) {
      parent_name = ''
    }
    const index = drop_target.node.parent.children!.indexOf(drop_target.node)

    // Care has to be taken regarding order of operations to not overload the parent node.
    // Insert at top temporarily
    const new_node_name = await addNode(msg, '', -1)
    await moveNode(drop_target.node.data.name, new_node_name, 0)
    await moveNode(new_node_name, parent_name, index)
    return
  }

  if (drop_target.position === Position.CENTER) {
    const new_node_name = await addNode(msg, '', -1)
    await replaceNode(drop_target.node.data.name, new_node_name)
    return
  }

  console.warn("Couldn't identify drop target position, this should never happen")

}

watchEffect(toggleNewNodeTargets)
function toggleNewNodeTargets() {
  if (g_drop_targets_ref.value === undefined) {
    console.warn('DOM is broken')
    return
  }

  //Reset visibility for all targets
  const targets = d3
    .select(g_drop_targets_ref.value)
    .selectAll<SVGRectElement, DropTarget>('.' + drop_target_css_class)
    .attr('visibility', null)

  if (editor_store.dragging_new_node === undefined) {
    return
  }

  // If the filter returns true (keeps the node) it gets hidden
  targets
    .filter((drop_target: DropTarget) => {
      switch (drop_target.position) {
        case Position.CENTER:
          return (
            editor_store.dragging_new_node!.max_children !== -1 &&
            drop_target.node.data.child_names.length > editor_store.dragging_new_node!.max_children
          )
        case Position.TOP:
          return editor_store.dragging_new_node!.max_children === 0
        case Position.BOTTOM:
          return (
            drop_target.node.data.max_children !== -1 &&
            drop_target.node.data.child_names.length >= drop_target.node.data.max_children
          )
        case Position.LEFT:
        case Position.RIGHT:
          return (
            drop_target.node.parent!.data.max_children !== -1 &&
            drop_target.node.parent!.data.child_names.length >=
              drop_target.node.parent!.data.max_children
          )
        case Position.ROOT:
          return false
        default:
          return true
      }
    })
    .attr('visibility', 'hidden')
}

function drawDataGraph(tree_layout: FlextreeNode<TrimmedNode>, data_wirings: Wiring[]) {
  if (g_data_graph_ref.value === undefined || g_data_vertices_ref.value === undefined) {
    console.warn('DOM is broken')
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
        x: node.x + node.data.offset.x - node.data.size.width * 0.5 - io_gripper_size,
        y: node.y + node.data.offset.y + io_gripper_spacing + index * (io_gripper_size + io_gripper_spacing)
      })
    })
    node.data.outputs.map((output: TrimmedNodeData, index: number) => {
      data_points.push({
        node: node,
        index: index,
        kind: IOKind.OUTPUT,
        key: output.key,
        type: output.serialized_type,
        x: node.x + node.data.offset.x + node.data.size.width * 0.5,
        y: node.y + node.data.offset.y + io_gripper_spacing + index * (io_gripper_size + io_gripper_spacing)
      })
    })
  })

  const g_data_vertices = d3
    .select(g_data_vertices_ref.value)
    .selectAll<SVGGElement, DataEdgeTerminal>('.' + data_vert_group_css_class)
    .data(data_points, (d) => d.node.id! + '###' + d.kind + '###' + d.key)
    .join(drawNewDataVert)

  if (!editor_store.has_selected_subtree) {
    //NOTE These are added here, because they see an outdated datum otherwise
    // d3 claims that listeners are passed a "current" datum, 
    // but that appears to be wrong.
    g_data_vertices
      .select('.' + data_vert_grip_css_class)
        .on('mousedown.drawedge', (ev, term: DataEdgeTerminal) => {
          editor_store.startDrawingDataEdge(term)
        })
        .on('mouseup.drawedge', (ev, term: DataEdgeTerminal) => {
          if (editor_store.data_edge_endpoint === undefined) {
            console.warn('Unintended data edge draw')
            return
          }

          if (!typesCompatible(term, editor_store.data_edge_endpoint)) {
            console.warn('Invalid edge')
            return
          }

          if (term.kind === IOKind.INPUT) {
            addNewDataEdge(editor_store.data_edge_endpoint, term)
          } else {
            addNewDataEdge(term, editor_store.data_edge_endpoint)
          }
        })
  }

  // Since types of DataVerts can change, type values are added out here
  g_data_vertices
    .select('.' + data_vert_label_css_class)
    .select('.' + data_vert_label_type_css_class)
    .text((d) => '(type: ' + prettyprint_type(d.type) + ')')     

  g_data_vertices
    .transition(tree_transition)
    //NOTE group elements can't be positioned with x= and y=
    .attr('transform', (d) => 'translate(' + d.x + ', ' + d.y + ')')

  drawDataEdges(data_points, g_data_vertices, data_wirings)
}

function drawNewDataVert(
  selection: d3.Selection<d3.EnterElement, DataEdgeTerminal, SVGGElement, unknown>
) {
  const groups = selection
    .append('g')
    .classed(data_vert_group_css_class, true)
    .on('mouseover.highlight', function () {
      if (editor_store.is_dragging) {
        // Highlight compatible vertices when dragging
        const compat = d3.select(this).classed(data_graph_comaptible_css_class)
        d3.select(this).classed(data_graph_hover_css_class, compat)
        d3.select(draw_indicator_ref.value!).classed(data_graph_hover_css_class, compat)
      } else {
        d3.select(this)
          .classed(data_graph_hover_css_class, true)
          .attr('id', data_vert1_highlight_css_id)
          .select('.' + data_vert_label_css_class)
          .attr('visibility', 'visible')
      }
    })
    .on('mouseout.highlight', function () {
      if (editor_store.is_dragging) {
        d3.select(this).classed(data_graph_hover_css_class, false)
        d3.select(draw_indicator_ref.value!).classed(data_graph_hover_css_class, false)
      } else {
        d3.select(this)
          .classed(data_graph_hover_css_class, false)
          .attr('id', null)
          .select('.' + data_vert_label_css_class)
          .attr('visibility', 'hidden')
      }
    })

  groups
    .append('rect')
    .classed(data_vert_grip_css_class, true)
    .attr('width', io_gripper_size)
    .attr('height', io_gripper_size)

  const labels = groups
    .append('text')
    .classed(data_vert_label_css_class, true)
    .attr('dominant-baseline', 'middle')
    .attr('visibility', 'hidden')
    .attr('text-anchor', (d) => (d.kind === IOKind.INPUT ? 'end' : 'start'))
    .text((d) => d.key)
    .attr('x', (d) => {
      switch (d.kind) {
        case IOKind.INPUT:
          return -5
        case IOKind.OUTPUT:
          return io_gripper_size + 5
        case IOKind.OTHER:
        default:
          return 0
      }
    })
    .attr('y', 0.5 * io_gripper_size)

  labels
    .append('tspan')
    .classed(data_vert_label_type_css_class, true)
    .attr('x', function () {
      return d3.select(this.parentElement).attr('x')
    })
    .attr('dy', '1em') // Space out 2nd line

  // The join pattern requires a return of the appended elements
  return groups
}

function drawDataEdges(
  data_points: DataEdgeTerminal[],
  g_data_vertices: d3.Selection<SVGGElement, DataEdgeTerminal, SVGGElement, unknown>,
  data_wirings: Wiring[]
) {
  if (
    g_data_graph_ref.value === undefined ||
    g_data_vertices_ref.value === undefined ||
    g_data_edges_ref.value === undefined
  ) {
    console.warn('DOM is broken')
    return
  }

  // Construct edge array by matching tree_msg wirings
  const data_edges: DataEdge[] = []

  function matchEndpoint(wire_point: NodeDataLocation, terminal: DataEdgeTerminal): boolean {
    return (
      wire_point.node_name === terminal.node.data.name &&
      wire_point.data_kind === terminal.kind &&
      wire_point.data_key === terminal.key
    )
  }

  data_wirings.forEach((wiring: Wiring) => {
    // Match Terminals with wiring data
    const source = data_points.find((term: DataEdgeTerminal) => matchEndpoint(wiring.source, term))
    const target = data_points.find((term: DataEdgeTerminal) => matchEndpoint(wiring.target, term))

    if (source === undefined || target === undefined) {
      console.warn('Bad data edge', source, target)
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
    .selectAll<SVGPathElement, DataEdge>('.' + data_edge_css_class)
    .data(
      data_edges,
      (d: DataEdge) =>
        d.source.node.id! +
        '###' +
        d.source.kind +
        '###' +
        d.source.index +
        '#####' +
        d.target.node.id! +
        '###' +
        d.target.kind +
        '###' +
        d.target.index
    )
    .join('path')
      .classed(data_edge_css_class, true)
      .on('click.select', (event, edge: DataEdge) => {
        editor_store.selectEdge(edge.wiring)
        event.stopPropagation()
      })
      .on('mouseover.highlight', function (ev, edge: DataEdge) {
        if (editor_store.is_dragging) {
          return // No highlights while dragging
        }
        g_data_vertices
          .filter((term: DataEdgeTerminal) => term === edge.source || term === edge.target)
          .dispatch('mouseover')
          .attr('id', (term: DataEdgeTerminal) =>
            term.kind === IOKind.INPUT ? data_vert2_highlight_css_id : data_vert1_highlight_css_id
          )
          //Hide target label
          .select('.' + data_vert_label_css_class)
          .attr('visibility', (term: DataEdgeTerminal) => {
            if (term.kind === IOKind.INPUT) {
              return 'hidden'
            }
            return 'visible'
          })

        d3.select(this)
          .classed(data_graph_hover_css_class, true)
          .attr('id', data_edge_highlight_css_id)
      })
      .on('mouseout.highlight', function (ev, edge: DataEdge) {
        if (editor_store.is_dragging) {
          return // No highlights while dragging
        }
        g_data_vertices
          .filter((term: DataEdgeTerminal) => term === edge.source || term === edge.target)
          .dispatch('mouseout')
        d3.select(this).classed(data_graph_hover_css_class, false).attr('id', null)
      })
    .transition(tree_transition)
      .attr('d', (edge: DataEdge) => drawDataLine(edge.source, edge.target))
}

function drawDataLine(source: DataEdgePoint, target: DataEdgePoint) {
  const lineGen = d3
    .line<DataEdgePoint>()
    .x((p) => p.x + io_gripper_size / 2)
    .y((p) => p.y + io_gripper_size / 2)
    .curve(d3.curveCatmullRom.alpha(0.9))
  let y_offset = 0
  if (Math.abs(source.y - target.y) < io_edge_bump_thresh) {
    y_offset = Math.min(source.y, target.y) - 
      io_edge_bump_factor * Math.abs(source.x - target.x)
  }
  const source_offset: DataEdgePoint = {
    x: source.x + io_edge_offset,
    y: source.y
  }
  const target_offset: DataEdgePoint = {
    x: target.x - io_edge_offset,
    y: target.y
  }
  const midpoint: DataEdgePoint = {
    x: (source.x + target.x) / 2,
    y: y_offset ? y_offset : (source.y + target.y) / 2
  }
  // Backwards edges require some extra work
  if (source.x > target.x) {
    if (y_offset === 0) {
      source_offset.y += io_edge_curve_factor * (target.y - source.y) +
        Math.sign(target.y - source.y) * io_edge_curve_offset
      target_offset.y += io_edge_curve_factor * (source.y - target.y) +
        Math.sign(source.y - target.y) * io_edge_curve_offset
    } else {
      const curve_offset = io_edge_curve_offset + 
        io_edge_curve_factor * Math.abs(source.x - target.x)
      source_offset.y -= curve_offset
      midpoint.y -= curve_offset * 4
      target_offset.y -= curve_offset
    }
  }
  return lineGen([source, source_offset, midpoint, target_offset, target])
}

watchEffect(toggleDataEdgeTargets)
function toggleDataEdgeTargets() {
  if (g_data_vertices_ref.value === undefined || draw_indicator_ref.value === undefined) {
    console.warn('DOM is broken')
    return
  }

  // Reset visibility on all grippers
  const data_verts = d3
    .select(g_data_vertices_ref.value)
    .selectAll<SVGGElement, DataEdgeTerminal>('.' + data_vert_group_css_class)
    .classed(data_graph_comaptible_css_class, false)

  data_verts.select('.' + data_vert_label_css_class).attr('visibility', 'hidden')

  // Reset drawing indicator
  const draw_path = d3.select(draw_indicator_ref.value).attr('d', null)

  if (editor_store.data_edge_endpoint === undefined) {
    return
  }

  data_verts
    .filter((term: DataEdgeTerminal) => typesCompatible(term, editor_store.data_edge_endpoint!))
    .classed(data_graph_comaptible_css_class, true)

  draw_path.attr('d', () =>
    drawDataLine(editor_store.data_edge_endpoint!, editor_store.data_edge_endpoint!)
  )
}

// Caller needs to ensure to pass the input as source
function addNewDataEdge(source: DataEdgeTerminal, target: DataEdgeTerminal) {
  ros_store.wire_data_service.callService(
    {
      wirings: [
        {
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
        } as Wiring
      ],
      ignore_failure: false //TODO what does this do?
    } as WireNodeDataRequest,
    (response: WireNodeDataResponse) => {
      if (response.success) {
        notify({
          title: 'Added data edge',
          type: 'success'
        })
      } else {
        notify({
          title: 'Failed to add data edge',
          text: response.error_message,
          type: 'warn'
        })
      }
    },
    (error: string) => {
      notify({
        title: 'Failed to call dataWiring service',
        text: error,
        type: 'error'
      })
    }
  )
}

watch(
  () => [edit_node_store.selected_node_names, selected_nodes.value],
  () => colorSelectedNodes()
)
function colorSelectedNodes() {
  if (g_vertices_ref.value === undefined) {
    console.warn('DOM is broken')
    return
  }

  // Color all nodes that are in either set but not both
  const old_selected_nodes = edit_node_store.selected_node_names.filter(
    (node: string) => !selected_nodes.value.includes(node)
  )
  const new_selected_nodes = selected_nodes.value.filter(
    (node: string) => !edit_node_store.selected_node_names.includes(node)
  )
  const all_selected_nodes = old_selected_nodes.concat(new_selected_nodes)

  d3.select<SVGGElement, never>(g_vertices_ref.value)
    .selectAll<SVGForeignObjectElement, FlextreeNode<TrimmedNode>>('.' + tree_node_css_class)
    .select<HTMLBodyElement>('.' + node_body_css_class)
    .classed(node_selected_css_class, (node: FlextreeNode<TrimmedNode>) =>
      all_selected_nodes.includes(node.data.name)
    )
}

watch(
  () => editor_store.selected_edge,
  () => {
    colorSelectedEdge()
  }
)
function colorSelectedEdge() {
  if (g_data_edges_ref.value === undefined || g_data_vertices_ref.value === undefined) {
    console.warn('DOM is broken')
    return
  }

  const g_data_edges = d3.select(g_data_edges_ref.value)
  const g_data_vertices = d3.select(g_data_vertices_ref.value)

  g_data_edges
    .selectAll<SVGPathElement, DataEdge>('.' + data_edge_css_class)
    .classed(data_graph_select_css_class, false)

  g_data_vertices
    .selectAll<SVGGElement, DataEdgeTerminal>('.' + data_vert_group_css_class)
    .classed(data_graph_select_css_class, false)

  if (editor_store.selected_edge !== undefined) {
    const newEdge: DataEdge = g_data_edges
      .selectAll<SVGPathElement, DataEdge>('.' + data_edge_css_class)
      .filter((edge: DataEdge) => {
        return edge.wiring === editor_store.selected_edge
      })
      .classed(data_graph_select_css_class, true)
      .datum()

    g_data_vertices
      .selectAll<SVGGElement, DataEdgeTerminal>('.' + data_vert_group_css_class)
      .filter((term: DataEdgeTerminal) => {
        return term === newEdge.source || term === newEdge.target
      })
      .classed(data_graph_select_css_class, true)
  }
}

onMounted(() => {
  if (viewport_ref.value === undefined || svg_g_ref.value === undefined) {
    notify({
      title: 'Element reference undefined!',
      type: 'error'
    })
    return
  }

  const viewport = d3.select(viewport_ref.value)

  zoomObject = d3.zoom<SVGSVGElement, unknown>()
  zoomObject.scaleExtent([0.3, 1.0])

  const container = d3.select<SVGGElement, never>(svg_g_ref.value)

  viewport.call(
    zoomObject.on('zoom', (event) => {
      container.attr('transform', event.transform)
    })
  )

  zoomObject.filter((event) => {
    // Do not trigger panning if we're grabbing a node (initiate dragging).
    return !event.shiftKey && (!editor_store.is_dragging || event.type === 'wheel')
  })

  // Call resetView to center tree container
  resetView()

  viewport.on('mousemove.pan_if_drag', canvasMouseMovePanHandler)

  viewport.on('click.unselect', (event) => {
    if (!event.shiftKey) {
      edit_node_store.clearSelection()
      editor_store.unselectEdge()
    }
  })

  selection = false
  mouse_moved = false

  // start the selection
  viewport.on('mousedown.drawselect', (event) => {
    if (svg_g_ref.value === undefined) {
      console.warn('DOM is broken')
      return
    }

    if (event.shiftKey) {
      selection = true // indicates a shift-mousedown enabled selection rectangle

      const [x, y] = d3.pointer(event, svg_g_ref.value)

      start_x = x
      start_y = y
    }
  })

  // show the selection rectangle on mousemove
  viewport.on('mousemove.drawselect', (event) => {
    if (
      svg_g_ref.value === undefined ||
      g_vertices_ref.value === undefined ||
      selection_rect_ref.value === undefined
    ) {
      console.warn('DOM is broken')
      return
    }

    if (event.shiftKey && selection) {
      mouse_moved = true

      const sel_rect = d3.select<SVGRectElement, never>(selection_rect_ref.value)

      const [x, y] = d3.pointer(event, svg_g_ref.value)

      const new_x = Math.min(x, start_x)
      const new_y = Math.min(y, start_y)
      const width = Math.abs(x - start_x)
      const height = Math.abs(y - start_y)

      // flip the selection rectangle if the user moves in a negative direction from the start point
      sel_rect.attr('x', new_x).attr('y', new_y)

      sel_rect.attr('width', width).attr('height', height)

      const temp_selected_nodes: string[] = []

      // Update which nodes are in the selection
      d3.select<SVGGElement, never>(g_vertices_ref.value)
        .selectAll<SVGForeignObjectElement, FlextreeNode<TrimmedNode>>('.' + tree_node_css_class)
        .select<HTMLBodyElement>('.' + node_body_css_class)
        .each((node: FlextreeNode<TrimmedNode>) => {
          // Select all nodes in the selection rectangle
          // Node coordinates are given for the top-center point
          if (
            node.x - node.data.size.width / 2 >= new_x &&
            node.x + node.data.size.width / 2 <= new_x + width &&
            node.y >= new_y &&
            node.y + node.data.size.height <= new_y + height
          ) {
            temp_selected_nodes.push(node.data.name)
          }
        })

      selected_nodes.value = temp_selected_nodes
    }
  })

  // detect the selected nodes on mouseup
  viewport.on('mouseup.drawselect', () => {
    if (g_vertices_ref.value === undefined || selection_rect_ref.value === undefined) {
      console.warn('DOM is broken')
      return
    }

    if (selection && mouse_moved) {
      selection = false // hide the selection rectangle
      mouse_moved = false

      const sel_rect = d3.select<SVGRectElement, never>(selection_rect_ref.value)
      sel_rect.attr('width', 0).attr('height', 0)

      edit_node_store.selectMultipleNodes(selected_nodes.value)

      selected_nodes.value = []
    }
  })

  // draw proto edges on data-drag
  viewport.on('mousemove.drawedge', (event) => {
    if (svg_g_ref.value === undefined || draw_indicator_ref.value === undefined) {
      console.warn('DOM is broken')
      return
    }

    if (editor_store.data_edge_endpoint === undefined) {
      return // Nothing to draw
    }

    const [x, y] = d3.pointer(event, svg_g_ref.value)
    // Construct a fake DataEdgePoint to reuse drawing code
    const mouse_point: DataEdgePoint = {
      x: x - io_gripper_size / 2,
      y: y - io_gripper_size / 2
    }

    d3.select(draw_indicator_ref.value).attr('d', () => {
      if (editor_store.data_edge_endpoint!.kind === IOKind.INPUT) {
        return drawDataLine(mouse_point, editor_store.data_edge_endpoint!)
      } else {
        return drawDataLine(editor_store.data_edge_endpoint!, mouse_point)
      }
    })
  })

  viewport.on('mouseup.drawedge', () => {
    if (draw_indicator_ref.value === undefined) {
      console.warn('DOM is broken')
      return
    }
    editor_store.stopDrawingDataEdge()
    d3.select(draw_indicator_ref.value).attr('d', null)
  })
})
</script>

<template>
  <svg id="editor_viewport" ref="viewport_ref" class="reactive-svg" :class="editor_store.skin">
    <g id="container" ref="svg_g_ref">
      <g ref="g_edges_ref" class="edges" />
      <g ref="g_vertices_ref" class="vertices" />
      <g
        ref="g_data_graph_ref"
        class="data_graph"
        :visibility="editor_store.show_data_graph ? 'visible' : 'hidden'"
      >
        <g ref="g_data_edges_ref" class="data_edges" />
        <g ref="g_data_vertices_ref" class="data_vertices" />
        <!--Below is used to pull elements to the foreground on hover-->
        <use :href="'#' + data_vert1_highlight_css_id" pointer-events="none" />
        <use :href="'#' + data_vert2_highlight_css_id" pointer-events="none" />
        <use :href="'#' + data_edge_highlight_css_id" pointer-events="none" />
      </g>
      <g ref="g_drop_targets_ref" class="drop_targets" :visibility="dropTargetGroupVisibility()" />

      <path ref="draw_indicator_ref" class="drawing-indicator" />
      <rect ref="selection_rect_ref" class="selection" />
    </g>
    <text
      x="10"
      y="20"
      :fill="editor_store.skin === EditorSkin.DARK ? '#FFFFFF' : '#000000'"
      textAnchor="left"
      alignmentBaseline="central"
      class="cursor-pointer svg-button"
      @click="resetView"
    >
      Reset View
    </text>
  </svg>
</template>

<!--Cannot use "scoped" here because that ignores elements added dynamically-->
<style lang="scss">
@use '@/assets/editor.scss';
</style>
