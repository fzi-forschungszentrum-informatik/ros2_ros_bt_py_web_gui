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
import type {
  TreeStructure,
  NodeStructure,
  TreeState,
  NodeState,
  Wiring,
  TreeData,
  WiringData,
  UUIDMsg,
  UUIDString,
  NodeDataLocation
} from './types/types'
import { rosToUuid, compareWirings } from './utils'

export function getNodeStructures(t_struc: TreeStructure): NodeStructure[] {
  return t_struc.nodes
}

export function getNodeStates(t_state: TreeState): NodeState[] {
  return t_state.node_states
}

export function getWirings(t_struc: TreeStructure): Wiring[] {
  return t_struc.data_wirings
}

export function getWiringData(t_data: TreeData): WiringData[] {
  return t_data.wiring_data
}

interface TreeMsg {
  tree_id: UUIDMsg
}

interface NodeMsg {
  node_id: UUIDMsg
}

interface WiringOrData {
  source?: NodeDataLocation
  target?: NodeDataLocation
  wiring?: Wiring
}

export function findTree<T extends TreeMsg>(tree_list: T[], tree_id: UUIDString): T | undefined {
  return tree_list.find((tree) => rosToUuid(tree.tree_id) === tree_id)
}

export function findNode<N extends NodeMsg>(node_list: N[], node_id: UUIDString): N | undefined {
  return node_list.find((node) => rosToUuid(node.node_id) === node_id)
}

function compareTreeRefWithId(tree_ref: UUIDMsg | '', tree_id: UUIDString): boolean {
  if (tree_ref === '') {
    return false
  }
  return rosToUuid(tree_ref) === tree_id
}

export function findOuterTree(tree_list: TreeStructure[], tree_id: UUIDString) {
  return tree_list.find(
    (tree) => tree.nodes.find((node) => compareTreeRefWithId(node.tree_ref, tree_id)) !== undefined
  )
}

export function findNodeForSubtree(
  tree_list: TreeStructure[],
  tree_id: UUIDString
): NodeStructure | undefined {
  const tree = findOuterTree(tree_list, tree_id)
  if (tree === undefined) {
    return undefined
  }
  return tree.nodes.find((node) => compareTreeRefWithId(node.tree_ref, tree_id))
}

export function findNodeInTreeList<T extends TreeMsg, N extends NodeMsg>(
  tree_list: T[],
  node_list_acc: (t: T) => N[],
  tree_id: UUIDString,
  node_id: UUIDString
): N | undefined {
  const tree = findTree(tree_list, tree_id)
  if (tree === undefined) {
    return undefined
  }
  return findNode(node_list_acc(tree), node_id)
}

function unifyDataAndWiring(wire_in: WiringOrData): Wiring {
  if (wire_in.wiring !== undefined) {
    return wire_in.wiring
  }
  // If `wire_in` doesn't reference a wiring, it HAS to be one itself.
  //   Therefore we force the conversion here.
  return wire_in as Wiring
}

export function findWiring<W extends WiringOrData>(
  wiring_list: W[],
  target_wiring: Wiring
): W | undefined {
  return wiring_list.find((wire_msg) => compareWirings(unifyDataAndWiring(wire_msg), target_wiring))
}

export function findWiringInTreeList<T extends TreeMsg, W extends WiringOrData>(
  tree_list: T[],
  wiring_list_acc: (t: T) => W[],
  tree_id: UUIDString,
  target_wiring: Wiring
): W | undefined {
  const tree = findTree(tree_list, tree_id)
  if (tree === undefined) {
    return undefined
  }
  return findWiring(wiring_list_acc(tree), target_wiring)
}
