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
import { useEditNodeStore } from '@/stores/edit_node'
import {
  type BTEditorNode,
  type TrimmedNodeData,
  type NodeIO,
  type UUIDString,
  type DocumentedNode,
  type DataEdgeTerminal,
  type IdentifiedDataEdgePoint,
  IOKind
} from '@/types/types'
import * as d3 from 'd3'
import type { HierarchyNode, HierarchyLink } from 'd3-hierarchy'
import { flextree, type FlextreeNode } from 'd3-flextree'
import * as uuid from 'uuid'
import { rosToUuid } from '@/utils'
import {
  tree_node_css_class,
  node_body_css_class,
  node_name_css_class,
  node_class_css_class,
  node_state_css_class,
  state_icon_width,
  node_name_height,
  name_line_length,
  name_first_line_indent,
  node_padding,
  node_class_height,
  class_line_length,
  node_spacing,
  tree_edge_css_class,
  node_inner_css_class,
  node_warn_css_class,
  node_button_css_class,
  button_icon_size,
  nested_tree_scaling,
  vertical_tree_offset,
  node_connect_css_class,
  horizontal_tree_padding,
  io_gripper_size,
  top_padding,
  button_icon_height
} from './draw_tree_config'
import { findTree } from '../tree_selection'
import { D3TreeDataDisplay, getDataVertOffsets } from './draw_tree_data'
import { D3DropTargetDisplay } from './draw_drop_targets'
import { faCaretDown, faCaretUp } from '@fortawesome/free-solid-svg-icons'

const line_wrap_regex: RegExp = /[a-z0-9][A-Z]|[_\- ][a-zA-Z]/dg

function drawNewNodes(
  selection: d3.Selection<d3.EnterElement, d3.HierarchyNode<BTEditorNode>, SVGGElement, never>
) {
  const edit_node_store = useEditNodeStore()

  const group = selection
    .append<SVGGElement>('g')
    .classed(tree_node_css_class, true)
    .on('click.select', (event, node: d3.HierarchyNode<BTEditorNode>) => {
      if (event.ctrlKey) {
        return // Do nothing if ctrl is pressed
      }
      if (event.shiftKey) {
        edit_node_store.selectMultipleNodes([
          {
            tree: node.data.tree_id,
            node: node.data.node_id
          }
        ])
      } else {
        edit_node_store.editorSelectionChange(node.data.tree_id, node.data.node_id)
      }
      event.stopPropagation()
    })

  group.append<SVGRectElement>('rect').classed(node_body_css_class, true)

  group.append<SVGGElement>('g').classed(node_connect_css_class, true)

  group.append<SVGTextElement>('text').classed(node_name_css_class, true)

  group.append<SVGTextElement>('text').classed(node_class_css_class, true)

  group
    .append<SVGSVGElement>('svg')
    .classed(node_state_css_class, true)
    .attr('width', state_icon_width)
    .attr('height', state_icon_width)
    .append('path')

  group.append<SVGGElement>('g').classed(node_inner_css_class, true)

  group
    .append<SVGSVGElement>('svg')
    .classed(node_button_css_class, true)
    .attr('width', button_icon_size)
    .attr('height', button_icon_size)
    .append('path')

  group.append<SVGTextElement>('text').classed(node_warn_css_class, true)

  // The join pattern requires a return of the appended elements
  // For consistency the node body is filled using the update method
  return group
}

function resetNodeBody(
  selection: d3.Selection<SVGGElement, d3.HierarchyNode<BTEditorNode>, SVGGElement, unknown>
) {
  // Reset width and height of background rect
  selection
    .selectChild<SVGRectElement>('.' + node_body_css_class)
    .attr('x', null)
    .attr('y', null)
    .attr('width', null)
    .attr('height', null)

  selection
    .selectChild<SVGTextElement>('.' + node_name_css_class)
    .attr('dx', null)
    .selectChildren<SVGTSpanElement, never>('tspan')
    .remove()

  selection
    .selectChild<SVGTextElement>('.' + node_class_css_class)
    .attr('dx', null)
    .selectChildren<SVGTSpanElement, never>('tspan')
    .remove()

  selection
    .selectChild<SVGSVGElement>('.' + node_state_css_class)
    .attr('x', null)
    .attr('y', null)

  selection
    .selectChild<SVGSVGElement>('.' + node_button_css_class)
    .attr('x', null)
    .attr('y', null)
}

function drawSubtrees(
  outer_tree_display: D3TreeDisplay,
  selection: d3.Selection<SVGGElement, d3.HierarchyNode<BTEditorNode>, SVGGElement, unknown>
) {
  const editor_store = useEditorStore()

  const old_subtree_nodes = new Set(outer_tree_display.nested_subtrees.keys())

  const new_subtree_nodes = new Set(editor_store.tree_structure_list.map((tree) => tree.tree_id))

  const expanded_subtrees = new Set(editor_store.expanded_subtrees)

  const removed_subtrees = old_subtree_nodes.difference(new_subtree_nodes)

  const added_subtrees = new_subtree_nodes.difference(old_subtree_nodes)

  removed_subtrees.forEach((key) => {
    outer_tree_display.nested_subtrees.get(key)!.clearTree()
    outer_tree_display.nested_subtrees.delete(key)
  })

  selection
    .filter((node) => added_subtrees.has(node.data.tree_ref))
    .each(function (node) {
      const outer_io_offsets = new Map<string, IdentifiedDataEdgePoint>()
      const input_offsets = getDataVertOffsets(node.data.inputs)
      node.data.inputs.forEach((data, index) => {
        outer_io_offsets.set(data.key, {
          x: 0,
          y: (input_offsets[index] - top_padding) / nested_tree_scaling,
          tree_id: node.data.tree_id,
          node_id: node.data.node_id,
          kind: IOKind.INPUT,
          key: data.key
        })
      })
      const output_offsets = getDataVertOffsets(node.data.outputs)
      node.data.outputs.forEach((data, index) => {
        outer_io_offsets.set(data.key, {
          x: 0,
          y: (output_offsets[index] - top_padding) / nested_tree_scaling,
          tree_id: node.data.tree_id,
          node_id: node.data.node_id,
          kind: IOKind.OUTPUT,
          key: data.key
        })
      })

      const nested_tree_display = new D3TreeDisplay(
        node.data.tree_ref,
        false,
        outer_tree_display.draw_indicator,
        outer_io_offsets,
        outer_tree_display.highlightElemCB,
        d3.select(this).selectChild('.' + node_inner_css_class)!
      )
      outer_tree_display.nested_subtrees.set(node.data.tree_ref, nested_tree_display)
    })

  outer_tree_display.nested_subtrees.values().forEach((display) => {
    if (expanded_subtrees.has(display.tree_id)) {
      display.drawTree()
    } else {
      display.clearTree()
    }
  })

  selection
    .filter((node) => new_subtree_nodes.has(node.data.tree_ref))
    .selectChild<SVGGElement>('.' + node_inner_css_class)
    .attr('transform', function (node) {
      if (expanded_subtrees.has(node.data.tree_ref)) {
        const rect = this.getBBox()
        // Downscale and center subtree
        return `translate(${
          (rect.width * nested_tree_scaling) / 2 - horizontal_tree_padding
        },0) scale(${nested_tree_scaling})`
      } else {
        return null
      }
    })
}

function layoutText(element: SVGGElement, data: d3.HierarchyNode<BTEditorNode>): number {
  // Track width of longest line and return that for box sizing
  let max_width: number = 0

  const group_elem = d3.select<SVGGElement, d3.HierarchyNode<BTEditorNode>>(element)

  const name_elem = group_elem.select<SVGTextElement>('.' + node_name_css_class)
  const class_elem = group_elem.select<SVGTextElement>('.' + node_class_css_class)

  const node_name = data.data.name
  const node_class = data.data.node_class

  let title_lines: number = 0

  // Find positions for potential line breaks
  let wrap_indices: number[] = [0]
  for (const match of node_name.matchAll(line_wrap_regex)) {
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
      max_width = tspan.node()!.getComputedTextLength() + state_icon_width + node_padding
    } else {
      max_width = Math.max(max_width, tspan.node()!.getComputedTextLength())
    }
    current_index = next_index
    title_lines += 1
  }

  class_elem.attr('y', title_lines * node_name_height)

  // Find positions for potential line breaks
  wrap_indices = [0]
  for (const match of node_class.matchAll(line_wrap_regex)) {
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
    let next_idx: number = wrap_indices.findIndex((val) => val < current_index + class_line_length)

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

function updateButton(
  element: SVGSVGElement,
  node: d3.HierarchyNode<BTEditorNode>,
  node_height: number
): number {
  const editor_store = useEditorStore()

  const subtree_nodes = new Set(editor_store.tree_structure_list.map((tree) => tree.tree_id))

  const expanded_subtrees = new Set(editor_store.expanded_subtrees)

  const svg_elem = d3.select(element)

  if (!subtree_nodes.has(node.data.tree_ref)) {
    svg_elem.selectChild('path').attr('d', null)
    return 0
  }

  let icon
  let extra_height
  let vert_offset
  if (expanded_subtrees.has(node.data.tree_ref)) {
    // Draw collapse icon top-center
    icon = faCaretUp.icon
    extra_height = 0
    vert_offset = 0
  } else {
    // Draw expand icon bottom-center
    icon = faCaretDown.icon
    extra_height = button_icon_height
    vert_offset = node_height
  }

  svg_elem
    .attr('viewBox', '0 0 ' + icon[0] + ' ' + icon[1])
    .attr('x', node.data.offset.x + node.data.size.width / 2 - button_icon_size / 2)
    .attr('y', node.data.offset.y + vert_offset)
    .on('click.expand', (event) => {
      if (event.ctrlKey) {
        return // Do nothing if ctrl is pressed
      }
      if (expanded_subtrees.has(node.data.tree_ref)) {
        editor_store.expanded_subtrees = editor_store.expanded_subtrees.filter(
          (val) => val !== node.data.tree_ref
        )
      } else {
        // Fresh assignment is necessary to trigger watchers
        editor_store.expanded_subtrees = editor_store.expanded_subtrees.concat([node.data.tree_ref])
      }
      event.stopPropagation()
    })
    .select('path')
    .attr('d', () => {
      if (typeof icon[4] === 'string') {
        return icon[4]
      } else {
        console.warn('Potentially unhandled multivalue path', icon[4])
        return icon[4].join('')
      }
    })

  return extra_height
}

function updateNodeBody(
  selection: d3.Selection<SVGGElement, d3.HierarchyNode<BTEditorNode>, SVGGElement, never>
) {
  selection.each(function (node) {
    const min_width = layoutText(this, node)

    const min_height = Math.max(
      getDataVertOffsets(node.data.inputs).at(-1)!,
      getDataVertOffsets(node.data.outputs).at(-1)!
    )

    const rect = this.getBBox()
    node.data.offset.x = rect.x
    node.data.offset.y = rect.y - top_padding
    // Width has already been set by text layout function
    node.data.size.width = Math.max(
      min_width + 2 * node_padding, // From text layout
      rect.width // From inner content
    )

    const extra_height = updateButton(
      d3
        .select(this)
        .selectChild<SVGSVGElement>('.' + node_button_css_class)
        .node()!,
      node,
      rect.height
    )

    node.data.size.height = Math.max(
      rect.height + top_padding + node_padding + extra_height,
      min_height
    )
  })

  selection
    .select<SVGRectElement>('.' + node_body_css_class)
    .attr('x', (d) => d.data.offset.x)
    .attr('y', (d) => d.data.offset.y)
    .attr('width', (d) => d.data.size.width)
    .attr('height', (d) => d.data.size.height)

  selection
    .select<SVGTextElement>('.' + node_name_css_class)
    .attr('dx', (d) => d.data.offset.x + node_padding)

  selection
    .select<SVGTextElement>('.' + node_class_css_class)
    .attr('dx', (d) => d.data.offset.x + node_padding)
}

export class D3TreeDisplay {
  nested_subtrees: Map<UUIDString, D3TreeDisplay> = new Map()

  readonly tree_id: UUIDString
  readonly editable: boolean
  readonly draw_indicator: SVGPathElement
  readonly outer_io_offsets: Map<string, IdentifiedDataEdgePoint>

  readonly drop_target_display: D3DropTargetDisplay
  readonly data_display: D3TreeDataDisplay
  readonly root_element: d3.Selection<SVGGElement, unknown, null, undefined>
  readonly tree_element: d3.Selection<SVGGElement, unknown, null, undefined>
  readonly vertices_element: d3.Selection<SVGGElement, unknown, null, undefined>
  readonly edges_element: d3.Selection<SVGGElement, unknown, null, undefined>
  readonly padding_element: d3.Selection<SVGRectElement, unknown, null, undefined>

  readonly highlightElemCB: (a0: SVGGraphicsElement, a1: 'v1' | 'v2' | 'e', a2: boolean) => void

  tree_transition: d3.Transition<d3.BaseType, unknown, null, undefined> | undefined

  constructor(
    tree_id: UUIDString,
    editable: boolean,
    draw_indicator: SVGPathElement,
    outer_io_offsets: Map<string, IdentifiedDataEdgePoint>,
    highlightElemCB: (a0: SVGGraphicsElement, a1: 'v1' | 'v2' | 'e', a2: boolean) => void,
    root_element: d3.Selection<SVGGElement, unknown, null, undefined>
  ) {
    root_element.selectChildren().remove()

    this.tree_id = tree_id
    this.editable = editable
    this.draw_indicator = draw_indicator
    this.outer_io_offsets = outer_io_offsets
    this.highlightElemCB = highlightElemCB

    this.root_element = root_element

    const outer_edges_element = this.root_element.append('g')

    this.tree_element = root_element
      .append('g')
      .attr('transform', `translate(${horizontal_tree_padding},${vertical_tree_offset})`)
    this.edges_element = this.tree_element.append('g')
    this.vertices_element = this.tree_element.append('g')

    this.drop_target_display = new D3DropTargetDisplay(
      this.tree_id,
      this.editable,
      this.tree_element
    )

    const data_graph_element = this.tree_element.append('g')
    this.data_display = new D3TreeDataDisplay(
      this.tree_id,
      this.editable,
      this.draw_indicator,
      this.highlightElemCB,
      data_graph_element,
      outer_edges_element
    )

    // We use this padding element to establish proper padding of our subtree, whether outer edges are drawn or not
    this.padding_element = this.root_element
      .append('rect')
      .attr('y', 0)
      .attr('height', 10)
      .attr('fill', 'none')
  }

  private prepareTreeData(): d3.HierarchyNode<BTEditorNode> | undefined {
    const editor_store = useEditorStore()

    const tree_structure = findTree(editor_store.tree_structure_list, this.tree_id)

    if (tree_structure === undefined) {
      return undefined
    }

    // Strips potentially additional properties
    const onlyKeyAndType = (nodeData: NodeIO) =>
      ({
        key: nodeData.key,
        serialized_type: nodeData.serialized_type
      } as TrimmedNodeData)

    // Trim the serialized data values from the node data - we won't
    // render them, so don't clutter the DOM with the data
    const editor_nodes: BTEditorNode[] = tree_structure.nodes.map((node) => {
      return {
        node_id: rosToUuid(node.node_id),
        name: node.name,
        node_class: node.node_class,
        module: node.module,
        max_children: node.max_children,
        child_ids: node.child_ids.map(rosToUuid),
        options: node.options.map(onlyKeyAndType),
        inputs: node.inputs.map(onlyKeyAndType),
        outputs: node.outputs.map(onlyKeyAndType),
        tree_ref: node.tree_ref ? rosToUuid(node.tree_ref) : '',
        tree_id: this.tree_id,
        size: { width: 1, height: 1 },
        offset: { x: 0, y: 0 }
      } as BTEditorNode
    })

    const forest_root: BTEditorNode = {
      node_id: uuid.NIL,
      name: '',
      node_class: '',
      module: '',
      max_children: -1,
      child_ids: [],
      inputs: [],
      outputs: [],
      options: [],
      tree_ref: '',
      tree_id: this.tree_id,
      size: { width: 0, height: 0 },
      offset: { x: 0, y: 0 }
    }

    if (editor_nodes.findIndex((x) => x.node_id === uuid.NIL) < 0) {
      editor_nodes.push(forest_root)
    }

    // Update the visual tree
    const parents: Record<UUIDString, UUIDString> = {}
    //const node_dict: Record<string, TrimmedNode> = {}; Is unused?
    // Find parents for all nodes once
    for (const i in editor_nodes) {
      const node = editor_nodes[i]
      //node_dict[node.name] = node;
      for (const j in node.child_ids) {
        parents[node.child_ids[j]] = node.node_id
      }
    }

    const root: d3.HierarchyNode<BTEditorNode> = d3
      .stratify<BTEditorNode>()
      .id((node) => {
        return node.node_id
      })
      .parentId((node) => {
        // undefined if it has no parent - does that break the layout?
        if (node.node_id in parents) {
          return parents[node.node_id]
        } else if (node.node_id === forest_root.node_id) {
          return undefined
        } else {
          forest_root.child_ids.push(node.node_id)
          return forest_root.node_id
        }
      })(editor_nodes)

    root.sort(function (a, b) {
      if (a.depth !== b.depth) {
        return b.depth - a.depth
      }
      while (a.parent !== b.parent) {
        a = a.parent!
        b = b.parent!
      }
      const child_list = a.parent!.data.child_ids
      return (
        child_list.findIndex((x) => x === a.data.node_id) -
        child_list.findIndex((x) => x === b.data.node_id)
      )
    })

    return root
  }

  private layoutTree(
    selection: d3.Selection<SVGGElement, d3.HierarchyNode<BTEditorNode>, SVGGElement, unknown>,
    tree: d3.HierarchyNode<BTEditorNode>
  ): FlextreeNode<BTEditorNode> {
    const editor_store = useEditorStore()

    // If the tree is in layer_mode, we have to get the max height for each layer
    const max_height_per_layer = Array<number>(tree.height + 1).fill(0.0)

    selection.each((node: d3.HierarchyNode<BTEditorNode>) => {
      max_height_per_layer[node.depth] = Math.max(
        node.data.size.height,
        max_height_per_layer[node.depth]
      )
    })

    const tree_layout = flextree<BTEditorNode>({
      nodeSize: (node: HierarchyNode<BTEditorNode>) => {
        let height: number
        if (editor_store.is_layer_mode) {
          height = max_height_per_layer[node.depth]
        } else {
          height = node.data.size.height
        }
        height += node.depth > 0 ? node_spacing : 0
        return [node.data.size.width, height]
      },
      spacing: (node: HierarchyNode<BTEditorNode>, oNode: HierarchyNode<BTEditorNode>) => {
        if (editor_store.is_layer_mode) {
          return node_spacing
        }
        if (node.parent !== oNode.parent) {
          return 2 * node_spacing
        } else {
          return node_spacing
        }
      } // This only applies to horizontal adjacent nodes
    })(tree as HierarchyNode<BTEditorNode>)
    //FIXME This typecast shouldn't be necessary, but apparrently the types
    // d3.HierarchyNode and d3-hierarchy.HierarchyNode differ, as
    // d3.HierarchyNode doesn't expose the find function???
    // Potentially an issue with the typing library

    // Bind the new data to get a selection with all flextree properties
    const new_selection = selection.data<FlextreeNode<BTEditorNode>>(
      tree_layout.descendants().filter((node) => node.data.node_id !== uuid.NIL),
      (node) => node.id!
    )
    let transition
    if (this.tree_transition === undefined) {
      transition = new_selection
    } else {
      transition = new_selection.transition(this.tree_transition)
    }
    transition.attr('transform', (d: FlextreeNode<BTEditorNode>) => {
      const x = d.x - d.data.offset.x - d.data.size.width / 2.0
      const y = d.y - d.data.offset.y
      return 'translate(' + x + ', ' + y + ')'
    })

    return tree_layout
  }

  private drawTreeNodes(tree: d3.HierarchyNode<BTEditorNode>): FlextreeNode<BTEditorNode> {
    const editor_store = useEditorStore()

    const node = this.vertices_element
      .selectChildren<SVGGElement, d3.HierarchyNode<BTEditorNode>>('.' + tree_node_css_class)
      .data(
        tree.descendants().filter((node) => node.data.node_id !== uuid.NIL),
        (node) => node.id!
      ) // Join performs enter, update and exit at once
      .join(drawNewNodes)
      .call(resetNodeBody)
      .call((selection) => drawSubtrees(this, selection))
      .call(updateNodeBody)

    // No tree modifying if displaying a subtree
    if (this.editable) {
      node.on('mousedown.dragdrop', (event, node: d3.HierarchyNode<BTEditorNode>) => {
        if (event.ctrlKey) {
          return // Do nothing if ctrl is pressed
        }
        editor_store.startDraggingExistingNode(node)
        event.stopPropagation()
      })
    }

    // Since we want to return the tree, we can't use the .call() syntax here
    const tree_layout = this.layoutTree(node, tree)

    return tree_layout
  }

  private drawTreeEdges(tree_layout: FlextreeNode<BTEditorNode>) {
    const edge_selection = this.edges_element
      .selectChildren<SVGPathElement, d3.HierarchyLink<BTEditorNode>>('.' + tree_edge_css_class)
      .data(
        tree_layout
          .links()
          .filter((link: d3.HierarchyLink<BTEditorNode>) => link.source.data.node_id !== uuid.NIL),
        (link) => link.source.id! + '###' + link.target.id!
      )
      .join('path')
      .classed(tree_edge_css_class, true) // Redundant for update elements, preserves readability
    let edge_transition
    if (this.tree_transition === undefined) {
      edge_transition = edge_selection
    } else {
      edge_transition = edge_selection.transition(this.tree_transition)
    }
    edge_transition.attr(
      'd',
      d3
        .linkVertical<SVGPathElement, HierarchyLink<BTEditorNode>, [number, number]>()
        .source((link: HierarchyLink<BTEditorNode>) => {
          const source = link.source as FlextreeNode<BTEditorNode>
          return [source.x, source.y + source.data.size.height]
        })
        .target((link: HierarchyLink<BTEditorNode>) => {
          const target = link.target as FlextreeNode<BTEditorNode>
          return [target.x, target.y]
        })
    )
  }

  public drawTree() {
    const tree = this.prepareTreeData()

    if (tree === undefined) {
      return
    }

    const tree_layout = this.drawTreeNodes(tree)

    this.drawTreeEdges(tree_layout)

    this.data_display.drawTreeData(tree_layout)

    this.drop_target_display.drawDropTargets(tree_layout)

    // Set the width of the padding element based on the width of the inner tree
    const tree_box = this.tree_element.node()!.getBBox()
    const full_width = tree_box.width + 2 * horizontal_tree_padding
    this.padding_element.attr('x', tree_box.x).attr('width', full_width)

    // Add the outer edges, if given
    const outer_io_positions = new Map<string, IdentifiedDataEdgePoint>()
    this.outer_io_offsets.forEach((val, key) => {
      const new_val = structuredClone(val)
      new_val.x = tree_box.x + (val.kind === IOKind.OUTPUT ? full_width : 0) - io_gripper_size / 2
      new_val.y -= io_gripper_size / 2
      outer_io_positions.set(key, new_val)
    })
    this.data_display.drawOuterDataEdges(outer_io_positions)
  }

  public updateTransition(tree_transition: d3.Transition<d3.BaseType, unknown, null, undefined>) {
    this.tree_transition = tree_transition
    this.data_display.tree_transition = tree_transition
    // Transitions aren't passed to nested trees, since they cause timing issues
  }

  public clearTree() {
    this.vertices_element.selectChildren().remove()
    this.edges_element.selectChildren().remove()
    this.data_display.clearTreeData()
    this.drop_target_display.clearDropTargets()
    this.nested_subtrees.clear()
    this.padding_element.attr('x', 0).attr('width', 0)
  }

  public toggleExistingNodeDropTargets(dragged_node: d3.HierarchyNode<BTEditorNode>) {
    if (this.tree_id === dragged_node.data.tree_id) {
      this.drop_target_display.toggleExistingNodeTargets(dragged_node)
    } else {
      this.nested_subtrees
        .values()
        .forEach((value) => value.toggleExistingNodeDropTargets(dragged_node))
    }
  }

  public toggleNewNodeDropTargets(dragged_node: DocumentedNode) {
    this.drop_target_display.toggleNewNodeTargets(dragged_node)
    this.nested_subtrees.values().forEach((value) => value.toggleNewNodeDropTargets(dragged_node))
  }

  public highlightCompatibleDataVertices(other_endpoint: DataEdgeTerminal) {
    if (this.tree_id === other_endpoint.node.data.tree_id) {
      this.data_display.highlightCompatibleVertices(other_endpoint)
    } else {
      this.nested_subtrees
        .values()
        .forEach((value) => value.highlightCompatibleDataVertices(other_endpoint))
    }
  }
}
