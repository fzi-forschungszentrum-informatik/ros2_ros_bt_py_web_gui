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
  TrimmedNode
} from '@/types/types'
import { getDefaultValue, prettyprint_type, python_builtin_types } from '@/utils'
import { faArrowDown19 } from '@fortawesome/free-solid-svg-icons'
import { notify } from '@kyvg/vue3-notification'
import * as d3 from 'd3'
import type { ZoomBehavior } from 'd3'
import { onMounted, ref } from 'vue'
import { flextree, FlextreeNode } from 'd3-flextree'

const editor_store = useEditorStore()
const ros_store = useROSStore()

const viewport_ref = ref<SVGSVGElement>()
const svg_g_ref = ref<SVGGElement>()

let zoomObject: ZoomBehavior<SVGSVGElement, unknown> | undefined = undefined

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

onMounted(() => {
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

  viewport
    .call(
      zoomObject.scaleExtent([0.3, 1.0]).on('zoom', () => {
        container.attr('transform', d3.event.transform)
      })
    )
    .call(zoomObject.translateTo, 0.0, height * 0.5 - 10.0)

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
      <g class="edges" />
      <g class="vertices" />
      <g class="data_graph">
        <g class="data_edges" />
        <g class="data_vertices" />
      </g>
      <g class="drop_targets" visibility="hidden" />
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
  </svg>
</template>
