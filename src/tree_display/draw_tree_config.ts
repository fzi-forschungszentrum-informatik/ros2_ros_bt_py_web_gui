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
export const io_gripper_size: number = 15
export const io_gripper_spacing: number = 10

export const io_edge_offset: number = 20
export const io_edge_bump_thresh: number = 50
export const io_edge_bump_factor: number = 0.02
export const io_edge_curve_offset: number = 5
export const io_edge_curve_factor: number = 0.0001

export const node_padding: number = 10
export const top_padding: number = 0.5 * node_padding
export const node_spacing: number = 80
export const name_line_length: number = 20
export const name_first_line_indent: number = 3
export const class_line_length: number = 25
export const state_icon_width: number = 30
export const button_icon_size: number = 50
export const button_icon_height: number = button_icon_size * 0.7
export const node_name_height: number = 40
export const node_class_height: number = 30
export const drop_target_root_size: number = 150
export const nested_tree_scaling: number = 0.5
export const vertical_tree_offset: number = button_icon_height / nested_tree_scaling
export const horizontal_tree_padding: number = 20

// constants for css classes & ids used with d3
export const tree_node_css_class: string = 'node'
export const node_body_css_class: string = 'btnode'
export const node_inner_css_class: string = 'inner'
export const node_connect_css_class: string = 'connect'
export const node_warn_css_class: string = 'warn_msg'
export const node_name_css_class: string = 'node_name'
export const node_class_css_class: string = 'class_name'
export const node_state_css_class: string = 'state_icon'
export const node_button_css_class: string = 'button_icon'
export const tree_edge_css_class: string = 'link'
export const drop_target_css_class: string = 'drop_target'
export const data_vert_group_css_class: string = 'gripper-group'
export const data_vert_grip_css_class: string = 'gripper'
export const data_vert_label_css_class: string = 'label'
export const data_vert_label_name_css_class: string = 'label-name'
export const data_vert_label_type_css_class: string = 'label-type'
export const data_vert_duplicate_css_class: string = 'gripper-duplicate'
export const data_edge_css_class: string = 'data-link'

export const data_edge_highlight_css_id: string = 'hightlightEdge'
export const data_vert1_highlight_css_id: string = 'highlightV1'
export const data_vert2_highlight_css_id: string = 'highlightV2'

export const data_graph_hover_css_class: string = 'data-hover'
export const data_graph_comaptible_css_class: string = 'compatible'

export const node_selected_css_class: string = 'node-selected'
export const data_graph_select_css_class: string = 'data-select'
