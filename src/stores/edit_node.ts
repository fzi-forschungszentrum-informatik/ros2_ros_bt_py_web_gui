/*
* Copyright 2024 FZI Forschungszentrum Informatik
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

import type { DocumentedNode, NodeMsg } from "@/types/types";
import { defineStore } from "pinia";
import { ref } from "vue";
import { useEditorStore } from "./editor";
import { useNodesStore } from "./nodes";

export enum EditorSelectionSource {
    NONE = 'none',
    NODELIST = 'nodelist',
    EDITOR = 'editor',
    MULTIPLE = 'multiple'
}

export const useEditNodeStore = defineStore('edit_node', () => {
    const editor_store = useEditorStore()
    const nodes_store = useNodesStore()
    
    const node_has_changed = ref<boolean>(false)
    
    const selected_node = ref<DocumentedNode | undefined>(undefined)
    
    const selected_node_names = ref<string[]>([])
    
    const last_seletion_source = ref<EditorSelectionSource>(EditorSelectionSource.NONE)

    //TODO this appears to be unused
    const copy_node_mode = ref<boolean>(false)
    
    function setNodeHasChanged() {
        node_has_changed.value = true
    }
    
    function clearNodeHasChanged() {
        node_has_changed.value = false
    }
    
    function nodeListSelectionChange(new_selected_node: DocumentedNode) {
        if (node_has_changed.value) {
            if (
                window.confirm('Are you sure you wish to discard all changes to the currently edited node?')
            ) {
                node_has_changed.value = false
            } else {
                return
            }
        }
        selected_node.value = new_selected_node
        selected_node_names.value = []
        last_seletion_source.value = EditorSelectionSource.NODELIST
    }
    
    function editorSelectionChange(new_selected_node_name: string | undefined) {
        if (node_has_changed.value) {
            if (
                (selected_node_names.value.length > 0 &&
                    selected_node_names.value[0] !== new_selected_node_name) ||
                    new_selected_node_name === undefined
            ) {
                if (
                    window.confirm(
                        'Are you sure you wish to discard all changes to the currently edited node?'
                    )
                ) {
                    node_has_changed.value = false
                } else {
                    return
                }
            }
        }
            
        if (new_selected_node_name === undefined || 
            (editor_store.tree === undefined && editor_store.selected_subtree.tree === undefined)
        ) {
            selected_node.value = undefined
            selected_node_names.value = []
            last_seletion_source.value = EditorSelectionSource.NONE
            return
        }
            
        const current_tree = editor_store.selected_subtree.is_subtree ? 
        editor_store.selected_subtree.tree :
        editor_store.tree
        
        const new_selected_name = current_tree!.nodes.find(
            (x: NodeMsg) => x.name === new_selected_node_name
        )
        
        if (!new_selected_name) {
            selected_node.value = undefined
            selected_node_names.value = []
            last_seletion_source.value = EditorSelectionSource.EDITOR
            return
        }
        
        const doc_node = new_selected_name as DocumentedNode
        
        copy_node_mode.value = true
        selected_node.value = doc_node
        selected_node_names.value = [new_selected_node_name]
        last_seletion_source.value = EditorSelectionSource.EDITOR
    }

    function selectMultipleNodes(new_selected_node_names: string[]) {
        if (node_has_changed.value) {
          if (
            window.confirm('Are you sure you wish to discard all changes to the currently edited node?')
          ) {
            node_has_changed.value = false
          } else {
            return
          }
        }
    
        selected_node.value = undefined
        selected_node_names.value = new_selected_node_names
        last_seletion_source.value = EditorSelectionSource.MULTIPLE
    }

    function changeCopyMode(new_mode: boolean) {
        copy_node_mode.value = new_mode
    }
      
    return {
        selected_node,
        selected_node_names,
        last_seletion_source,
        node_has_changed,
        copy_node_mode,
        nodeListSelectionChange,
        editorSelectionChange,
        selectMultipleNodes,
        setNodeHasChanged,
        clearNodeHasChanged,
        changeCopyMode
    }
})