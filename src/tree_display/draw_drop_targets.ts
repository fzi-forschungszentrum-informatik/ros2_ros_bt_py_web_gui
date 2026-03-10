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
import * as d3 from 'd3'
import * as uuid from 'uuid'
import {
  Position,
  type BTEditorNode,
  type DocumentedNode,
  type DropTarget,
  type UUIDString
} from '@/types/types'
import type { FlextreeNode } from 'd3-flextree'
import { drop_target_css_class, drop_target_root_size, node_spacing } from './draw_tree_config'
import { useEditorStore } from '@/stores/editor'
import { moveNode, replaceNode, buildDefaultNodeMessage, addNode } from '@/tree_manipulation'

async function moveExistingNode(drop_target: DropTarget) {
  const editor_store = useEditorStore()

  if (editor_store.dragging_existing_node === undefined) {
    console.warn('Tried to move existing node by dragging but none selected')
    return
  }

  const target_node_id = editor_store.dragging_existing_node.data.node_id
  const target_node_name = editor_store.dragging_existing_node.data.name

  if (!drop_target.node.parent) {
    console.error('A tree with an existing node should never show the root target')
    return
  }

  if (drop_target.position === Position.BOTTOM) {
    await moveNode(target_node_id, target_node_name, drop_target.node.data.node_id, 0)
    return
  }

  if (drop_target.position === Position.LEFT || drop_target.position === Position.RIGHT) {
    const parent_node_id = drop_target.node.parent.data.node_id
    let index = drop_target.node.parent.children!.indexOf(drop_target.node)
    if (drop_target.position === Position.RIGHT) {
      index++
    }
    // If the node is moved in it's own row (same parent), we need to offset the index
    if (
      parent_node_id === editor_store.dragging_existing_node.parent!.data.node_id &&
      index >
        drop_target.node.parent.children!.findIndex(
          (node: FlextreeNode<BTEditorNode>) => node.data.node_id === target_node_id
        )
    ) {
      index--
    }
    await moveNode(target_node_id, target_node_name, parent_node_id, index)
    return
  }

  // Checks on whether the new node is an appropriate replacement/ancestor
  // are presumed done based on whether this target was available in the first place.

  if (drop_target.position === Position.TOP) {
    const parent_node_id = drop_target.node.parent.data.node_id
    let index = drop_target.node.parent.children!.indexOf(drop_target.node)
    // If the node is moved in it's own row (same parent), we need to offset the index
    if (
      parent_node_id === editor_store.dragging_existing_node.parent!.data.node_id &&
      index >
        drop_target.node.parent.children!.findIndex(
          (node: FlextreeNode<BTEditorNode>) => node.data.node_id === target_node_id
        )
    ) {
      index--
    }

    // Care has to be taken regarding order of operations to not overload the parent node.
    // Insert new node at the end, then move node to old position
    await moveNode(drop_target.node.data.node_id, drop_target.node.data.name, target_node_id, -1)
    await moveNode(target_node_id, target_node_name, parent_node_id, index)
    return
  }

  if (drop_target.position === Position.CENTER) {
    await replaceNode(
      drop_target.node.data.node_id,
      drop_target.node.data.name,
      target_node_id,
      target_node_name
    )
    return
  }

  console.warn("Couldn't identify drop target position, this should never happen")
}

async function addNewNode(drop_target: DropTarget) {
  const editor_store = useEditorStore()

  if (editor_store.dragging_new_node === undefined) {
    console.warn('Tried to add new node by dragging but none selected')
    return
  }

  const msg = buildDefaultNodeMessage(editor_store.dragging_new_node)

  if (drop_target.position === Position.ROOT) {
    await addNode(msg, uuid.NIL, 0)
    return
  }

  if (!drop_target.node.parent) {
    console.error('All non-root targets should have a set parent node')
    return
  }

  if (drop_target.position === Position.BOTTOM) {
    const parent_node_id = drop_target.node.data.node_id
    await addNode(msg, parent_node_id, 0)
    return
  }

  if (drop_target.position === Position.LEFT || drop_target.position === Position.RIGHT) {
    const parent_node_id = drop_target.node.parent.data.node_id
    let index = drop_target.node.parent.children!.indexOf(drop_target.node)
    if (drop_target.position === Position.RIGHT) {
      index++
    }
    await addNode(msg, parent_node_id, index)
    return
  }

  // Checks on whether the new node is an appropriate replacement/ancestor
  // are presumed done based on whether this target was available in the first place.

  if (drop_target.position === Position.TOP) {
    const parent_node_id = drop_target.node.parent.data.node_id
    const index = drop_target.node.parent.children!.indexOf(drop_target.node)

    // Care has to be taken regarding order of operations to not overload the parent node.
    // Insert at top temporarily
    const new_node_id = await addNode(msg, uuid.NIL, -1)
    await moveNode(drop_target.node.data.node_id, drop_target.node.data.name, new_node_id, 0)
    await moveNode(new_node_id, msg.name, parent_node_id, index)
    return
  }

  if (drop_target.position === Position.CENTER) {
    const new_node_id = await addNode(msg, uuid.NIL, -1)
    await replaceNode(
      drop_target.node.data.node_id,
      drop_target.node.data.name,
      new_node_id,
      msg.name
    )
    return
  }

  console.warn("Couldn't identify drop target position, this should never happen")
}

export class D3DropTargetDisplay {
  readonly tree_id: UUIDString
  readonly editable: boolean
  readonly targets_element: d3.Selection<SVGGElement, unknown, null, undefined>

  constructor(
    tree_id: UUIDString,
    editable: boolean,
    root_element: d3.Selection<SVGGElement, unknown, null, undefined>
  ) {
    this.tree_id = tree_id
    this.editable = editable
    this.targets_element = root_element.append('g')
  }

  private prepareTargetData(tree_layout: FlextreeNode<BTEditorNode>): DropTarget[] {
    const drop_targets: DropTarget[] = []
    // Construct the list of drop targets that should exist
    tree_layout.each((node: FlextreeNode<BTEditorNode>) => {
      if (node.data.node_id === uuid.NIL) {
        return
      }

      // Draw all left and right targets, even though they sometimes overlap
      // because it looks odd if they're missing once nodes are spaced out further
      drop_targets.push({ node: node, position: Position.LEFT })
      drop_targets.push({ node: node, position: Position.CENTER })
      drop_targets.push({ node: node, position: Position.RIGHT })
      drop_targets.push({ node: node, position: Position.TOP }) // Does this make sense?
      if (node.data.max_children === -1 || node.data.max_children > node.data.child_ids.length) {
        drop_targets.push({ node: node, position: Position.BOTTOM })
      }
    })

    return drop_targets
  }

  public drawDropTargets(tree_layout: FlextreeNode<BTEditorNode>) {
    const editor_store = useEditorStore()

    if (!this.editable) {
      return
    }

    const drop_targets = this.prepareTargetData(tree_layout)

    // If there are no drop targets to draw, draw one at root
    // Adjust the size of the drop target here. Don't do this on init, it ruins the tree layout
    if (drop_targets.length === 0) {
      drop_targets.push({ node: tree_layout, position: Position.ROOT })
    }

    // Join those with the existing drop targets and draw them
    this.targets_element
      .selectChildren<SVGRectElement, DropTarget>('.' + drop_target_css_class)
      .data(drop_targets, (d) => d.node.id! + '###' + d.position)
      .join('rect')
      .classed(drop_target_css_class, true)
      .attr('visibility', 'hidden')
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
        let x = d.node.x
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
        if (d.position === Position.ROOT) {
          return -0.5 * node_spacing
        }
        let y = d.node.y
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

  public clearDropTargets() {
    this.targets_element.selectChildren().remove()
  }

  public toggleExistingNodeTargets(dragged_node: d3.HierarchyNode<BTEditorNode>) {
    const targets = this.targets_element.selectChildren<SVGRectElement, DropTarget>(
      '.' + drop_target_css_class
    )

    // The first filter hides all nodes in the currently dragged subtree
    // The second filter hides all nodes where dropping would overload a child node count
    //TODO Maybe we should hide targets that would place the node in the same spot

    // If the filter returns true (keeps the node) it becomes visible
    targets
      .filter((drop_target: DropTarget) => {
        return (
          dragged_node.descendants().find((node: d3.HierarchyNode<BTEditorNode>) => {
            return node.data.node_id === drop_target.node.data.node_id
          }) === undefined
        )
      })
      .filter((drop_target: DropTarget) => {
        switch (drop_target.position) {
          case Position.CENTER:
            return (
              dragged_node.data.max_children === -1 ||
              dragged_node.data.max_children >
                drop_target.node.data.child_ids.length + dragged_node.data.child_ids.length
            )
          case Position.TOP:
            return (
              dragged_node.data.max_children === -1 ||
              dragged_node.data.child_ids.length < dragged_node.data.max_children
            )
          case Position.BOTTOM:
            return (
              drop_target.node.data.max_children === -1 ||
              drop_target.node.data.node_id === dragged_node.parent!.data.node_id ||
              drop_target.node.data.child_ids.length < drop_target.node.data.max_children
            )
          case Position.LEFT:
          case Position.RIGHT:
            return (
              drop_target.node.parent!.data.max_children === -1 ||
              drop_target.node.parent!.data.node_id === dragged_node.parent!.data.node_id ||
              drop_target.node.parent!.data.child_ids.length <
                drop_target.node.parent!.data.max_children
            )
          case Position.ROOT:
          // This should never happen, as an existing node implies a non-empty tree
          default:
            return false
        }
      })
      .attr('visibility', 'visible')
  }

  public toggleNewNodeTargets(dragged_node: DocumentedNode) {
    // If the filter returns true (keeps the node) it becomes visible
    this.targets_element
      .selectChildren<SVGRectElement, DropTarget>('.' + drop_target_css_class)
      .filter((drop_target: DropTarget) => {
        switch (drop_target.position) {
          case Position.CENTER:
            return (
              dragged_node.max_children === -1 ||
              drop_target.node.data.child_ids.length > dragged_node.max_children
            )
          case Position.TOP:
            return dragged_node.max_children !== 0
          case Position.BOTTOM:
            return (
              drop_target.node.data.max_children === -1 ||
              drop_target.node.data.child_ids.length < drop_target.node.data.max_children
            )
          case Position.LEFT:
          case Position.RIGHT:
            return (
              drop_target.node.parent!.data.max_children === -1 ||
              drop_target.node.parent!.data.child_ids.length <
                drop_target.node.parent!.data.max_children
            )
          case Position.ROOT:
            return true
          default:
            return false
        }
      })
      .attr('visibility', 'visible')
  }
}
