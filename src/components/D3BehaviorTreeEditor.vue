<!--
 *  Copyright 2024-2026 FZI Forschungszentrum Informatik
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
import {
  type DataEdgePoint,
  type DataEdgeTerminal,
  type DataEdge,
  type DropTarget,
  type BTEditorNode,
  NodeStateValues
} from '@/types/types'
import { IOKind } from '@/types/types'
import { notify } from '@kyvg/vue3-notification'
import * as d3 from 'd3'
import { onMounted, computed, ref, watch } from 'vue'
import type { FlextreeNode } from 'd3-flextree'
import { drawDataLine } from '@/tree_display/draw_tree_data'
import {
  faBolt,
  faCheck,
  faExclamation,
  faPause,
  faPowerOff,
  faXmark
} from '@fortawesome/free-solid-svg-icons'
import {
  data_edge_css_class,
  data_graph_comaptible_css_class,
  data_graph_select_css_class,
  data_edge_highlight_css_id,
  data_vert1_highlight_css_id,
  data_vert2_highlight_css_id,
  data_vert_group_css_class,
  data_vert_label_css_class,
  drop_target_css_class,
  io_gripper_size,
  node_body_css_class,
  node_selected_css_class,
  tree_node_css_class,
  node_state_css_class,
  state_icon_width,
  node_padding,
  data_graph_hover_css_class,
  vertical_tree_offset,
  horizontal_tree_padding
} from '@/tree_display/draw_tree_config'
import { D3TreeDisplay } from '@/tree_display/draw_tree'
import { findNodeInTreeList, getNodeStates } from '@/tree_selection'

const editor_store = useEditorStore()
const edit_node_store = useEditNodeStore()

const viewport_ref = ref<SVGSVGElement>()
const svg_g_ref = ref<SVGGElement>()
const tree_root_ref = ref<SVGGElement>()
const draw_indicator_ref = ref<SVGPathElement>()
const selection_rect_ref = ref<SVGRectElement>()
const highlight_v1_ref = ref<SVGUseElement>()
const highlight_v2_ref = ref<SVGUseElement>()
const highlight_e_ref = ref<SVGUseElement>()

const tree_display = computed<D3TreeDisplay | undefined>((previous) => {
  if (previous !== undefined) {
    previous.clearTree()
  }

  if (tree_root_ref.value === undefined || draw_indicator_ref.value === undefined) {
    console.warn('DOM is broken')
    return
  }

  const root_element = d3.select(tree_root_ref.value)

  return new D3TreeDisplay(
    editor_store.selected_tree,
    !editor_store.has_selected_subtree,
    draw_indicator_ref.value,
    new Map(), // No outer IO to connect to
    highlightElem,
    root_element
  )
})

let zoomObject: d3.ZoomBehavior<SVGSVGElement, unknown> | undefined = undefined

let selection: boolean = false
let mouse_moved: boolean = false
let start_x: number = 0.0
let start_y: number = 0.0
const selected_nodes = ref<BTEditorNode[]>([])

let pan_interval_id: number | undefined = undefined
let pan_direction: number[] = [0.0, 0.0]
const pan_rate: number = 30
const drag_pan_boundary: number = 50
const pan_per_frame: number = 10.0

function getTransformMatrixFromRoot(elem: SVGGraphicsElement): DOMMatrix {
  let matrix = tree_root_ref.value!.getCTM()!.inverse().multiply(elem.getCTM()!)
  // Undo local transforms
  for (let index = 0; index < elem.transform.baseVal.length; index++) {
    const local_transform = elem.transform.baseVal[index]
    matrix = matrix.multiply(local_transform.matrix.inverse())
  }
  return matrix
}

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
  const width = viewport.node()!.getBoundingClientRect().width

  viewport.call(zoomObject.translateTo, horizontal_tree_padding, vertical_tree_offset, [
    width / 2,
    30.0
  ])
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
    tree_display,
    () => editor_store.tree_structure_list,
    () => editor_store.expanded_subtrees,
    () => editor_store.is_layer_mode
  ],
  drawEverything,
  {
    immediate: true
  }
)
function drawEverything() {
  if (svg_g_ref.value === undefined) {
    console.warn('DOM is broken')
    return
  }

  if (tree_display.value === undefined) {
    console.warn('Tree display unset')
    return
  }

  // TODO Clear outdated subtrees from expanded list

  // Prepare transition config for synchronization, the typed select statement is necessary to give the transition appropriate typing
  const tree_transition = d3
    .select<d3.BaseType, unknown>(svg_g_ref.value)
    .transition('tree-transition')
    .duration(100)
    .ease(d3.easeQuad)

  tree_display.value.updateTransition(tree_transition)

  tree_display.value.drawTree()

  updateNodeState()
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
    case NodeStateValues.BROKEN:
      return faExclamation.icon
    case NodeStateValues.SHUTDOWN:
    default:
      return faPowerOff.icon
  }
}

watch(() => editor_store.tree_state_list, updateNodeState)
function updateNodeState() {
  if (svg_g_ref.value === undefined) {
    console.warn('DOM is broken')
    return
  }

  const vertices_group = d3.select<SVGGElement, never>(svg_g_ref.value)

  const node = vertices_group
    .selectAll<SVGGElement, d3.HierarchyNode<BTEditorNode>>('.' + tree_node_css_class)
    .each((node) => {
      const node_state = findNodeInTreeList(
        editor_store.tree_state_list,
        getNodeStates,
        node.data.tree_id,
        node.data.node_id
      )
      if (node_state !== undefined) {
        node.data.state = node_state.state
      }
    })

  node
    .select<SVGRectElement>('.' + node_body_css_class)
    .style('stroke', (d) => {
      switch (d.data.state) {
        case NodeStateValues.RUNNING:
          return 'var(--node-color-running)'
        case NodeStateValues.IDLE:
          return 'var(--node-color-idle)'
        case NodeStateValues.SUCCEEDED:
          return 'var(--node-color-succeeded)'
        case NodeStateValues.FAILED:
        case NodeStateValues.BROKEN:
          return 'var(--node-color-failed)'
        case NodeStateValues.SHUTDOWN:
          return 'var(--node-color-shutdown)'
        case NodeStateValues.UNINITIALIZED:
        default:
          return 'var(--node-color-default)'
      }
    })
    .style('fill', (d) => {
      if (d.data.state == NodeStateValues.BROKEN) {
        return 'var(--node-bg-broken)'
      } else {
        return 'var(--node-bg-default)'
      }
    })
  node
    .select<SVGSVGElement>('.' + node_state_css_class)
    .attr('viewBox', (node) => {
      const icon = getIcon(node.data.state)
      return '0 0 ' + icon[0] + ' ' + icon[1]
    })
    .attr(
      'x',
      (node) => node.data.offset.x + node.data.size.width - state_icon_width - node_padding
    )
    .attr('y', (node) => node.data.offset.y + node_padding)
    .select<SVGPathElement>('path')
    .attr('d', (node) => {
      const icon = getIcon(node.data.state)
      if (typeof icon[4] === 'string') {
        return icon[4]
      } else {
        console.warn('Potentially unhandled multivalue path', icon[4])
        return icon[4].join('')
      }
    })
}

watch(
  [() => editor_store.dragging_existing_node, () => editor_store.dragging_new_node],
  toggleValidDropTargets
)
function toggleValidDropTargets() {
  if (svg_g_ref.value === undefined) {
    console.warn('DOM is broken')
    return
  }

  //Reset visibility for all targets
  d3.select(svg_g_ref.value)
    .selectAll<SVGRectElement, DropTarget>('.' + drop_target_css_class)
    .attr('visibility', 'hidden')

  if (tree_display.value === undefined) {
    console.warn('Tree is not drawn')
    return
  }

  if (editor_store.dragging_existing_node !== undefined) {
    tree_display.value.toggleExistingNodeDropTargets(editor_store.dragging_existing_node)
  }
  if (editor_store.dragging_new_node !== undefined) {
    tree_display.value.toggleNewNodeDropTargets(editor_store.dragging_new_node)
  }
}

watch(() => editor_store.data_edge_endpoint, toggleDataEdgeTargets)
function toggleDataEdgeTargets() {
  if (svg_g_ref.value === undefined || draw_indicator_ref.value === undefined) {
    console.warn('DOM is broken')
    return
  }

  // Reset visibility on all grippers
  const data_verts = d3
    .select(svg_g_ref.value)
    .selectAll<SVGGElement, DataEdgeTerminal>('.' + data_vert_group_css_class)
    .classed(data_graph_comaptible_css_class, false)

  data_verts.select('.' + data_vert_label_css_class).attr('visibility', 'hidden')

  // Reset drawing indicator
  d3.select(draw_indicator_ref.value).attr('d', null)

  if (editor_store.data_edge_endpoint === undefined) {
    return
  }

  if (tree_display.value === undefined) {
    console.warn('Tree is not drawn')
    return
  }

  tree_display.value.highlightCompatibleDataVertices(editor_store.data_edge_endpoint)
}

watch(
  () => [edit_node_store.selected_node_id_pairs, selected_nodes.value],
  () => colorSelectedNodes()
)
function colorSelectedNodes() {
  if (svg_g_ref.value === undefined) {
    console.warn('DOM is broken')
    return
  }

  // Color all nodes that are in either set but not both
  const old_selected_nodes = edit_node_store.selected_node_id_pairs.filter(
    (id_pair) =>
      selected_nodes.value.find(
        (node) => node.tree_id === id_pair.tree && node.node_id === id_pair.node
      ) === undefined
  )
  const new_selected_nodes = selected_nodes.value
    .filter(
      (node) =>
        edit_node_store.selected_node_id_pairs.find(
          (id_pair) => node.tree_id === id_pair.tree && node.node_id === id_pair.node
        ) === undefined
    )
    .map((node) => {
      return { tree: node.tree_id, node: node.node_id }
    })
  const all_selected_nodes = old_selected_nodes.concat(new_selected_nodes)

  d3.select<SVGGElement, never>(svg_g_ref.value)
    .selectAll<SVGSVGElement, FlextreeNode<BTEditorNode>>('.' + tree_node_css_class)
    .select<SVGRectElement>('.' + node_body_css_class)
    .classed(
      node_selected_css_class,
      (node: FlextreeNode<BTEditorNode>) =>
        all_selected_nodes.find(
          (id_pair) => node.data.tree_id === id_pair.tree && node.data.node_id === id_pair.node
        ) !== undefined
    )
}

watch(
  () => editor_store.selected_edge,
  () => {
    colorSelectedEdge()
  }
)
function colorSelectedEdge() {
  if (svg_g_ref.value === undefined) {
    console.warn('DOM is broken')
    return
  }

  const root_element = d3.select(svg_g_ref.value)

  root_element
    .selectAll<SVGPathElement, DataEdge>('.' + data_edge_css_class)
    .classed(data_graph_select_css_class, false)

  root_element
    .selectAll<SVGGElement, DataEdgeTerminal>('.' + data_vert_group_css_class)
    .classed(data_graph_select_css_class, false)

  if (editor_store.selected_edge !== undefined) {
    const newEdge: DataEdge = root_element
      .selectAll<SVGPathElement, DataEdge>('.' + data_edge_css_class)
      .filter((edge: DataEdge) => {
        return edge.wiring === editor_store.selected_edge
      })
      .classed(data_graph_select_css_class, true)
      .datum()

    root_element
      .selectAll<SVGGElement, DataEdgeTerminal>('.' + data_vert_group_css_class)
      .filter((term: DataEdgeTerminal) => {
        return term === newEdge.source || term === newEdge.target
      })
      .classed(data_graph_select_css_class, true)
  }
}

function highlightElem(elem: SVGGraphicsElement, target: 'v1' | 'v2' | 'e', onoff: boolean) {
  if (
    highlight_v1_ref.value === undefined ||
    highlight_v2_ref.value === undefined ||
    highlight_e_ref.value === undefined
  ) {
    console.warn('DOM is broken')
    return
  }

  let css_id: string
  let highlight: SVGUseElement

  switch (target) {
    case 'v1':
      css_id = data_vert1_highlight_css_id
      highlight = highlight_v1_ref.value
      break
    case 'v2':
      css_id = data_vert2_highlight_css_id
      highlight = highlight_v2_ref.value
      break
    case 'e':
      css_id = data_edge_highlight_css_id
      highlight = highlight_e_ref.value
      break
  }

  d3.select(elem)
    .classed(data_graph_hover_css_class, onoff)
    .attr('id', onoff ? css_id : null)

  if (onoff) {
    const matrix = getTransformMatrixFromRoot(elem)
    const transform = highlight.transform.baseVal.createSVGTransformFromMatrix(matrix)
    highlight.transform.baseVal.initialize(transform)
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
  zoomObject.scaleExtent([0.3, 10.0])

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
    if (svg_g_ref.value === undefined || selection_rect_ref.value === undefined) {
      console.warn('DOM is broken')
      return
    }

    if (event.shiftKey && selection) {
      mouse_moved = true

      const sel_rect = d3.select<SVGRectElement, never>(selection_rect_ref.value)

      const [x, y] = d3.pointer(event, svg_g_ref.value)

      const x_min = Math.min(x, start_x)
      const y_min = Math.min(y, start_y)
      const x_max = Math.max(x, start_x)
      const y_max = Math.max(y, start_y)

      // flip the selection rectangle if the user moves in a negative direction from the start point
      sel_rect.attr('x', x_min).attr('y', y_min)

      sel_rect.attr('width', x_max - x_min).attr('height', y_max - y_min)

      const temp_selected_nodes: BTEditorNode[] = []

      // Update which nodes are in the selection
      d3.select<SVGGElement, never>(svg_g_ref.value)
        .selectAll<SVGGElement, FlextreeNode<BTEditorNode>>('.' + tree_node_css_class)
        .each(function (node: FlextreeNode<BTEditorNode>) {
          // Select all nodes in the selection rectangle
          // Node coordinates are given for the top-center point
          const matrix = getTransformMatrixFromRoot(this)
          const top_left = new DOMPoint(node.x - node.data.size.width / 2, node.y).matrixTransform(
            matrix
          )
          const bot_right = new DOMPoint(
            node.x + node.data.size.width / 2,
            node.y + node.data.size.height
          ).matrixTransform(matrix)
          if (
            top_left.x >= x_min &&
            bot_right.x <= x_max &&
            top_left.y >= y_min &&
            bot_right.y <= y_max
          ) {
            temp_selected_nodes.push(node.data)
          }
        })

      selected_nodes.value = temp_selected_nodes
    }
  })

  // detect the selected nodes on mouseup
  viewport.on('mouseup.drawselect', () => {
    if (svg_g_ref.value === undefined || selection_rect_ref.value === undefined) {
      console.warn('DOM is broken')
      return
    }

    if (selection && mouse_moved) {
      selection = false // hide the selection rectangle
      mouse_moved = false

      const sel_rect = d3.select<SVGRectElement, never>(selection_rect_ref.value)
      sel_rect.attr('width', 0).attr('height', 0)

      edit_node_store.selectMultipleNodes(
        selected_nodes.value.map((node) => {
          return {
            tree: node.tree_id,
            node: node.node_id
          }
        })
      )

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

    // Apply offsets from tree display
    const other_endpoint: DataEdgePoint = {
      x: editor_store.data_edge_endpoint.x + horizontal_tree_padding,
      y: editor_store.data_edge_endpoint.y + vertical_tree_offset
    }

    d3.select(draw_indicator_ref.value).attr('d', () => {
      if (editor_store.data_edge_endpoint!.kind === IOKind.INPUT) {
        return drawDataLine(mouse_point, other_endpoint)
      } else {
        return drawDataLine(other_endpoint, mouse_point)
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
    <!--Defines patterns that are used in tree display-->
    <defs>
      <pattern
        id="pattern_stripes"
        patternUnits="userSpaceOnUse"
        width="5"
        height="5"
        patternTransform="rotate(45)"
      >
        <rect x="0" y="0" width="5" height="5" fill="slategray" />
        <line x1="0" y="0" x2="0" y2="5" stroke="orange" stroke-width="5" />
      </pattern>
    </defs>

    <g id="container" ref="svg_g_ref">
      <g ref="tree_root_ref" />

      <!--Below is used to pull elements to the foreground on hover-->
      <use ref="highlight_v1_ref" :href="'#' + data_vert1_highlight_css_id" pointer-events="none" />
      <use ref="highlight_v2_ref" :href="'#' + data_vert2_highlight_css_id" pointer-events="none" />
      <use ref="highlight_e_ref" :href="'#' + data_edge_highlight_css_id" pointer-events="none" />

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
