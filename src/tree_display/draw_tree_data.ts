/*
 * Copyright 2026 FZI Forschungszentrum Informatik
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
import { useEditorStore } from '@/stores/editor'
import type {
  DataEdgePoint,
  DataEdgeTerminal,
  DataEdge,
  NodeDataLocation,
  BTEditorNode,
  TrimmedNodeData,
  Wiring,
  UUIDString,
  IdentifiedDataEdge,
  IdentifiedDataEdgePoint
} from '@/types/types'
import { IOKind } from '@/types/types'
import { prettyprint_type, replaceNameIdParts, typesCompatible } from '@/utils'
import * as d3 from 'd3'
import type { FlextreeNode } from 'd3-flextree'
import * as uuid from 'uuid'
import { rosToUuid } from '@/utils'
import {
  data_vert_group_css_class,
  data_vert_label_css_class,
  data_vert_label_type_css_class,
  io_gripper_size,
  io_gripper_spacing,
  data_graph_comaptible_css_class,
  data_graph_hover_css_class,
  data_vert_grip_css_class,
  data_edge_css_class,
  io_edge_bump_thresh,
  io_edge_bump_factor,
  io_edge_offset,
  io_edge_curve_factor,
  io_edge_curve_offset,
  data_vert_label_name_css_class,
  data_vert_duplicate_css_class,
  vertical_tree_offset,
  horizontal_tree_padding
} from './draw_tree_config'
import { findTree } from '../tree_selection'
import { addDataEdge } from '@/tree_manipulation'

// Calculates vertical offsets for data vertices based on a shared prefix
//   also returns an extra offset at the end to give an indication of the total height.
export function getDataVertOffsets(data_list: TrimmedNodeData[]): number[] {
  let vertical_offset = io_gripper_spacing
  let previous_prefix = ''
  const offsets = data_list.map((data, index) => {
    const key_prefix = data.key.split('.').slice(0, -1).join('.')
    if (key_prefix !== previous_prefix && index > 0) {
      vertical_offset += io_gripper_spacing
    }
    const old_vertical_offset = vertical_offset
    vertical_offset += io_gripper_size + io_gripper_spacing
    previous_prefix = key_prefix
    return old_vertical_offset
  })
  offsets.push(vertical_offset)
  return offsets
}

export function drawDataLine(source: DataEdgePoint, target: DataEdgePoint) {
  const lineGen = d3
    .line<DataEdgePoint>()
    .x((p) => p.x + io_gripper_size / 2)
    .y((p) => p.y + io_gripper_size / 2)
    .curve(d3.curveCatmullRom.alpha(0.9))
  let y_offset = 0
  if (Math.abs(source.y - target.y) < io_edge_bump_thresh) {
    y_offset = Math.min(source.y, target.y) - io_edge_bump_factor * Math.abs(source.x - target.x)
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
      source_offset.y +=
        io_edge_curve_factor * (target.y - source.y) +
        Math.sign(target.y - source.y) * io_edge_curve_offset
      target_offset.y +=
        io_edge_curve_factor * (source.y - target.y) +
        Math.sign(source.y - target.y) * io_edge_curve_offset
    } else {
      const curve_offset =
        io_edge_curve_offset + io_edge_curve_factor * Math.abs(source.x - target.x)
      source_offset.y -= curve_offset
      midpoint.y -= curve_offset * 4
      target_offset.y -= curve_offset
    }
  }
  return lineGen([source, source_offset, midpoint, target_offset, target])
}

function drawNewDataVert(
  draw_indicator: SVGPathElement,
  highlightElemCB: (a0: SVGGraphicsElement, a1: 'v1' | 'v2' | 'e', a2: boolean) => void,
  selection: d3.Selection<d3.EnterElement, DataEdgeTerminal, SVGGElement, unknown>
) {
  const editor_store = useEditorStore()

  const groups = selection
    .append('g')
    .classed(data_vert_group_css_class, true)
    .on('mouseover.highlight', function (ev) {
      if (editor_store.is_dragging) {
        // Highlight compatible vertices when dragging
        const compat = d3.select(this).classed(data_graph_comaptible_css_class)
        d3.select(this).classed(data_graph_hover_css_class, compat)
        d3.select(draw_indicator).classed(data_graph_hover_css_class, compat)
      } else {
        d3.select(this)
          .select('.' + data_vert_label_css_class)
          .attr('visibility', 'visible')
        highlightElemCB(this, ev.detail.additional ? 'v2' : 'v1', true)
      }
    })
    .on('mouseout.highlight', function (ev) {
      if (editor_store.is_dragging) {
        d3.select(this).classed(data_graph_hover_css_class, false)
        d3.select(draw_indicator).classed(data_graph_hover_css_class, false)
      } else {
        d3.select(this)
          .select('.' + data_vert_label_css_class)
          .attr('visibility', 'hidden')
        highlightElemCB(this, ev.detail.additional ? 'v2' : 'v1', false)
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

  labels.append('tspan').classed(data_vert_label_name_css_class, true)

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

function drawNewDataEdge(
  data_vertices: d3.Selection<SVGGElement, DataEdgeTerminal, SVGGElement, unknown>,
  highlightElemCB: (a0: SVGGraphicsElement, a1: 'v1' | 'v2' | 'e', a2: boolean) => void,
  selection: d3.Selection<d3.EnterElement, DataEdge, SVGGElement, unknown>
) {
  const editor_store = useEditorStore()

  return selection
    .append('path')
    .classed(data_edge_css_class, true)
    .on('click.select', (event, edge: DataEdge) => {
      if (event.ctrlKey) {
        return // Do nothing if ctrl is pressed
      }
      // Can use either source or target to find tree_id since they're in the same tree
      editor_store.selectEdge(edge.source.node.data.tree_id, edge.wiring)
      event.stopPropagation()
    })
    .on('mouseover.highlight', function (ev, edge: DataEdge) {
      if (editor_store.is_dragging) {
        return // No highlights while dragging
      }
      data_vertices
        .filter((term: DataEdgeTerminal) => term === edge.source || term === edge.target)
        .dispatch('mouseover', (term) => {
          return {
            bubbles: false,
            cancelable: false,
            detail: { additional: term === edge.target }
          }
        })
        //Hide target label
        .select('.' + data_vert_label_css_class)
        .attr('visibility', (term: DataEdgeTerminal) => {
          if (term.kind === IOKind.INPUT) {
            return 'hidden'
          }
          return 'visible'
        })

      highlightElemCB(this, 'e', true)
    })
    .on('mouseout.highlight', function (ev, edge: DataEdge) {
      if (editor_store.is_dragging) {
        return // No highlights while dragging
      }
      data_vertices
        .filter((term: DataEdgeTerminal) => term === edge.source || term === edge.target)
        .dispatch('mouseout', (term) => {
          return {
            bubbles: false,
            cancelable: false,
            detail: { additional: term === edge.target }
          }
        })

      highlightElemCB(this, 'e', false)
    })
}

function drawNewOuterDataEdge(
  highlightElemCB: (a0: SVGGraphicsElement, a1: 'v1' | 'v2' | 'e', a2: boolean) => void,
  selection: d3.Selection<d3.EnterElement, IdentifiedDataEdge, SVGGElement, unknown>
) {
  function compareTermToIdPoint(term: DataEdgeTerminal, id_point: IdentifiedDataEdgePoint) {
    return (
      term.key === id_point.key &&
      term.kind === id_point.kind &&
      term.node.data.node_id === id_point.node_id &&
      term.node.data.tree_id === id_point.tree_id
    )
  }

  return (
    selection
      .append('path')
      .classed(data_edge_css_class, true)
      // Supress click events to not accidentally select node
      .style('cursor', 'default')
      .on('click.cancel', (ev) => ev.stopPropagation())
      .on('mouseover.highlight', function (ev, edge) {
        d3.selectAll<SVGGElement, DataEdgeTerminal>('.' + data_vert_group_css_class)
          .filter((term) => {
            return compareTermToIdPoint(term, edge.p1) || compareTermToIdPoint(term, edge.p2)
          })
          .dispatch('mouseover', (term) => {
            return {
              bubbles: false,
              cancelable: false,
              detail: { additional: compareTermToIdPoint(term, edge.p2) }
            }
          })
        highlightElemCB(this, 'e', true)
      })
      .on('mouseout.highlight', function (ev, edge) {
        d3.selectAll<SVGGElement, DataEdgeTerminal>('.' + data_vert_group_css_class)
          .filter((term) => {
            return compareTermToIdPoint(term, edge.p1) || compareTermToIdPoint(term, edge.p2)
          })
          .dispatch('mouseout', (term) => {
            return {
              bubbles: false,
              cancelable: false,
              detail: { additional: compareTermToIdPoint(term, edge.p2) }
            }
          })
        highlightElemCB(this, 'e', false)
      })
  )
}

export class D3TreeDataDisplay {
  readonly tree_id: UUIDString
  readonly editable: boolean
  readonly draw_indicator: SVGPathElement
  readonly vertices_element: d3.Selection<SVGGElement, unknown, null, undefined>
  readonly edges_element: d3.Selection<SVGGElement, unknown, null, undefined>
  readonly outer_edges_element: d3.Selection<SVGGElement, unknown, null, undefined>
  readonly highlightElemCB: (a0: SVGGraphicsElement, a1: 'v1' | 'v2' | 'e', a2: boolean) => void

  tree_transition: d3.Transition<d3.BaseType, unknown, null, undefined> | undefined

  constructor(
    tree_id: UUIDString,
    editable: boolean,
    draw_indicator: SVGPathElement,
    highlightElemCB: (a0: SVGGraphicsElement, a1: 'v1' | 'v2' | 'e', a2: boolean) => void,
    root_element: d3.Selection<SVGGElement, unknown, null, undefined>,
    outer_edges_element: d3.Selection<SVGGElement, unknown, null, undefined>
  ) {
    this.tree_id = tree_id
    this.editable = editable
    this.draw_indicator = draw_indicator
    this.highlightElemCB = highlightElemCB
    this.edges_element = root_element.append('g')
    this.vertices_element = root_element.append('g')
    this.outer_edges_element = outer_edges_element
  }

  private prepareVertexData(tree_layout: FlextreeNode<BTEditorNode>): DataEdgeTerminal[] {
    const data_points: DataEdgeTerminal[] = []

    tree_layout.each((node: FlextreeNode<BTEditorNode>) => {
      if (node.data.node_id === uuid.NIL) {
        return
      }

      const input_offsets = getDataVertOffsets(node.data.inputs)
      node.data.inputs.map((input: TrimmedNodeData, index: number) => {
        data_points.push({
          node: node,
          index: index,
          kind: IOKind.INPUT,
          key: input.key,
          type: input.serialized_type,
          x: node.x - node.data.size.width * 0.5 - io_gripper_size,
          y: node.y + input_offsets[index]
        })
      })
      const output_offsets = getDataVertOffsets(node.data.outputs)
      node.data.outputs.map((output: TrimmedNodeData, index: number) => {
        data_points.push({
          node: node,
          index: index,
          kind: IOKind.OUTPUT,
          key: output.key,
          type: output.serialized_type,
          x: node.x + node.data.size.width * 0.5,
          y: node.y + output_offsets[index]
        })
      })
    })

    return data_points
  }

  private drawDataVerts(data_points: DataEdgeTerminal[]) {
    const editor_store = useEditorStore()

    const data_vertices = this.vertices_element
      .selectChildren<SVGGElement, DataEdgeTerminal>('.' + data_vert_group_css_class)
      .data(data_points, (d) => d.node.id! + '###' + d.kind + '###' + d.key)
      .join((enter) => drawNewDataVert(this.draw_indicator, this.highlightElemCB, enter))

    // Since descriptions of DataVerts can change, they are added out here
    data_vertices
      .select('.' + data_vert_label_name_css_class)
      .text((d) => replaceNameIdParts(d.node.data.tree_ref, d.key))
    data_vertices
      .select('.' + data_vert_label_type_css_class)
      .text((d) => '(type: ' + prettyprint_type(d.type) + ')')

    // Highlight terminals with duplicate display names
    const display_name_set = new Map<UUIDString, Set<string>>()
    const duplicate_set = new Map<UUIDString, Set<string>>()
    data_vertices
      .select('.' + data_vert_grip_css_class)
      .each((d) => {
        if (!display_name_set.has(d.node.data.node_id)) {
          display_name_set.set(d.node.data.node_id, new Set<string>())
        }
        if (!duplicate_set.has(d.node.data.node_id)) {
          duplicate_set.set(d.node.data.node_id, new Set<string>())
        }
        const text = replaceNameIdParts(d.node.data.tree_ref, d.key)
        if (display_name_set.get(d.node.data.node_id)!.has(text)) {
          duplicate_set.get(d.node.data.node_id)!.add(text)
        } else {
          display_name_set.get(d.node.data.node_id)!.add(text)
        }
      })
      .classed(data_vert_duplicate_css_class, (d) => {
        const text = replaceNameIdParts(d.node.data.tree_ref, d.key)
        return duplicate_set.get(d.node.data.node_id)!.has(text)
      })

    if (this.editable) {
      data_vertices
        .on('mousedown.drawedge', (ev, term: DataEdgeTerminal) => {
          if (ev.ctrlKey) {
            return // Do nothing if ctrl is pressed
          }
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
            addDataEdge(editor_store.data_edge_endpoint, term)
          } else {
            addDataEdge(term, editor_store.data_edge_endpoint)
          }
        })
    }

    let vertex_transition
    if (this.tree_transition === undefined) {
      vertex_transition = data_vertices
    } else {
      vertex_transition = data_vertices.transition(this.tree_transition)
    }
    vertex_transition
      //NOTE group elements can't be positioned with x= and y=
      .attr('transform', (d) => 'translate(' + d.x + ', ' + d.y + ')')
  }

  private prepareEdgeData(data_points: DataEdgeTerminal[]): DataEdge[] {
    const editor_store = useEditorStore()

    const tree_structure = findTree(editor_store.tree_structure_list, this.tree_id)

    if (tree_structure === undefined) {
      return []
    }

    // Construct edge array by matching tree_msg wirings
    const data_edges: DataEdge[] = []

    function matchEndpoint(wire_point: NodeDataLocation, terminal: DataEdgeTerminal): boolean {
      return (
        rosToUuid(wire_point.node_id) === terminal.node.data.node_id &&
        wire_point.data_kind === terminal.kind &&
        wire_point.data_key === terminal.key
      )
    }

    tree_structure.data_wirings.forEach((wiring: Wiring) => {
      // Match Terminals with wiring data
      const source = data_points.find((term: DataEdgeTerminal) =>
        matchEndpoint(wiring.source, term)
      )
      const target = data_points.find((term: DataEdgeTerminal) =>
        matchEndpoint(wiring.target, term)
      )

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

    return data_edges
  }

  private drawDataEdges(data_points: DataEdgeTerminal[]) {
    const data_edges = this.prepareEdgeData(data_points)

    // This selection is needed for callbacks
    const data_vertices_elems = this.vertices_element.selectChildren<SVGGElement, DataEdgeTerminal>(
      '.' + data_vert_group_css_class
    )

    const edge_selection = this.edges_element
      .selectChildren<SVGPathElement, DataEdge>('.' + data_edge_css_class)
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
      .join((enter) => drawNewDataEdge(data_vertices_elems, this.highlightElemCB, enter))

    let edge_transition
    if (this.tree_transition === undefined) {
      edge_transition = edge_selection
    } else {
      edge_transition = edge_selection.transition(this.tree_transition)
    }
    edge_transition.attr('d', (edge: DataEdge) => drawDataLine(edge.source, edge.target))
  }

  public drawTreeData(tree_layout: FlextreeNode<BTEditorNode>) {
    const data_points = this.prepareVertexData(tree_layout)

    this.drawDataVerts(data_points)

    this.drawDataEdges(data_points)
  }

  private mapDataTerm(term: DataEdgeTerminal): IdentifiedDataEdgePoint {
    return {
      x:
        term.x +
        horizontal_tree_padding +
        ((term.kind === IOKind.OUTPUT ? 1 : -1) * io_gripper_size) / 2,
      y: term.y + vertical_tree_offset,
      tree_id: this.tree_id,
      node_id: term.node.data.node_id,
      kind: term.kind,
      key: term.key
    }
  }

  // Optionally draw extra edges to fixed positions
  public drawOuterDataEdges(outer_io_positions: Map<string, IdentifiedDataEdgePoint>) {
    const outer_data_edges: IdentifiedDataEdge[] = []
    this.vertices_element.selectChildren<SVGGElement, DataEdgeTerminal>().each((term) => {
      // NOTE This is based on how outer node IO is mapped to inner nodes
      const combined_key = term.node.data.node_id + '.' + term.key
      if (outer_io_positions.has(combined_key)) {
        const outer = outer_io_positions.get(combined_key)!
        const inner = this.mapDataTerm(term)
        outer_data_edges.push({
          p1: outer.kind === IOKind.INPUT ? outer : inner,
          p2: outer.kind === IOKind.INPUT ? inner : outer,
          key: combined_key + '#inputs'
        })
      }
    })

    const edge_selection = this.outer_edges_element
      .selectChildren<SVGPathElement, IdentifiedDataEdge>('.' + data_edge_css_class)
      .data(outer_data_edges, (d) => d.key)
      .join((enter) => drawNewOuterDataEdge(this.highlightElemCB, enter))

    let edge_transition
    if (this.tree_transition === undefined) {
      edge_transition = edge_selection
    } else {
      edge_transition = edge_selection.transition(this.tree_transition)
    }
    edge_transition.attr('d', (edge) => drawDataLine(edge.p1, edge.p2))
  }

  public clearTreeData() {
    this.vertices_element.selectChildren().remove()
    this.edges_element.selectChildren().remove()
    this.outer_edges_element.selectChildren().remove()
  }

  public highlightCompatibleVertices(other_endpoint: DataEdgeTerminal) {
    this.vertices_element
      .selectChildren<SVGGElement, DataEdgeTerminal>('.' + data_vert_group_css_class)
      .filter((term: DataEdgeTerminal) => typesCompatible(term, other_endpoint))
      .classed(data_graph_comaptible_css_class, true)
  }
}
