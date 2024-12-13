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

import type { DocumentedNode, NodeData, NodeMsg, ParamData, ValueTypes } from "@/types/types";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useEditorStore } from "./editor";
import { useNodesStore } from "./nodes";
import { getDefaultValue, prettyprint_type } from "@/utils";

export enum EditorSelectionSource {
    NONE = 'none',
    NODELIST = 'nodelist',
    EDITOR = 'editor',
    MULTIPLE = 'multiple'
}

function getInitialValues(data: NodeData, options?: NodeData[] | null): ParamData {
    options = options || []
    return {
        key: data.key,
        value: getDefaultValue(prettyprint_type(data.serialized_value), options)
    } as ParamData
}

export const useEditNodeStore = defineStore('edit_node', () => {
    const editor_store = useEditorStore()
    const nodes_store = useNodesStore()

    const is_new_node = ref<boolean>(false)
    const node_has_changed = ref<boolean>(false)
    const selected_node = ref<NodeMsg | undefined>(undefined)
    const reference_node = ref<DocumentedNode | undefined>(undefined)
    const selected_node_names = ref<string[]>([])
    const last_seletion_source = ref<EditorSelectionSource>(EditorSelectionSource.NONE)

    const new_node_name = ref<string>('')
    const new_node_class = ref<string>('')
    const new_node_module = ref<string>('')
    const new_node_options = ref<ParamData[]>([])
    const new_node_inputs = ref<ParamData[]>([])
    const new_node_outputs = ref<ParamData[]>([])
    const node_is_valid = ref<boolean>(false)
    const node_is_morphed = ref<boolean>(false)

    const flow_control_nodes = computed<DocumentedNode[]>(() => {
        return nodes_store.nodes.filter((item: DocumentedNode) => item.max_children == -1)
    }) 
    const is_flow_control_node = computed<boolean>(() => {
        return (
            flow_control_nodes.value.filter((item: DocumentedNode) => 
                new_node_module.value === item.module && new_node_class.value === item.node_class
            ).length > 0
        )
    })

    //TODO this appears to be unused
    const copy_node_mode = ref<boolean>(false)
    
    function setNodeHasChanged() {
        node_has_changed.value = true
    }
    
    function clearNodeHasChanged() {
        node_has_changed.value = false
    }

    function clearSelection() {
        if (node_has_changed.value) {
            if (window.confirm(
                'Are you sure you wish to discard all changes to the currently edited node?'
            )) {
                node_has_changed.value = false
            } else {
                return
            }
        }
        selected_node.value = undefined
        reference_node.value = undefined
        selected_node_names.value = []
        last_seletion_source.value = EditorSelectionSource.NONE
    }
    
    function nodeListSelectionChange(new_selected_node: DocumentedNode) {
        if (node_has_changed.value) {
            if (window.confirm(
                'Are you sure you wish to discard all changes to the currently edited node?'
            )) {
                node_has_changed.value = false
            } else {
                return
            }
        }
        
        selected_node.value = undefined
        reference_node.value = new_selected_node
        copy_node_mode.value = false
        is_new_node.value = true
        selected_node_names.value = []
        last_seletion_source.value = EditorSelectionSource.NODELIST

        // Initialize editable attributes

        new_node_name.value = new_selected_node.name
        new_node_class.value = new_selected_node.node_class
        new_node_module.value = new_selected_node.module
        node_is_valid.value = true
        node_is_morphed.value = false

        new_node_options.value = new_selected_node.options.map(x => getInitialValues(x, new_selected_node.options))
        new_node_inputs.value = new_selected_node.inputs.map(x => getInitialValues(x, new_selected_node.options))  
        new_node_outputs.value = new_selected_node.outputs.map(x => getInitialValues(x, new_selected_node.options))
    }
    
    function editorSelectionChange(new_selected_node_name: string) {
        if (node_has_changed.value) {
            if (window.confirm(
                'Are you sure you wish to discard all changes to the currently edited node?'
            )) {
                node_has_changed.value = false
            } else {
                return
            }
        }
        
        const current_tree = editor_store.selected_subtree.is_subtree ? 
        editor_store.selected_subtree.tree :
        editor_store.tree

        const new_selected_node = current_tree!.nodes.find(
            (x: NodeMsg) => x.name === new_selected_node_name
        )

        if (new_selected_node === undefined) {
            console.error("Could not find node in tree")
            clearSelection()
            return
        }

        const new_reference_node = nodes_store.nodes.find((node: DocumentedNode) => 
            node.node_class === new_selected_node.node_class &&
            node.module === new_selected_node.module)
      
        if (new_reference_node === undefined) {
            console.error("Cannot recover node information")
        }

        selected_node.value = new_selected_node
        reference_node.value = new_reference_node
        copy_node_mode.value = true
        is_new_node.value = false
        selected_node_names.value = [new_selected_node_name]
        last_seletion_source.value = EditorSelectionSource.EDITOR

        // Initialize editable attributes
        new_node_name.value = new_selected_node.name
        new_node_class.value = new_selected_node.node_class
        new_node_module.value = new_selected_node.module
        node_is_valid.value = true
        node_is_morphed.value = false

        function getValues(x: NodeData): ParamData {
            const type = prettyprint_type(x.serialized_type)
            let json_value = JSON.parse(x.serialized_value)
            if (type === 'type') {
                json_value = json_value['py/type'].replace('__builtin__.', '').replace('builtins.', '')
            }
            return {
                key: x.key,
                value: {
                    type: type,
                    value: json_value
                }
            } as ParamData
        }
        new_node_options.value = new_selected_node.options.map(x => getValues(x))
        new_node_inputs.value = new_selected_node.inputs.map(x => getValues(x))
        new_node_outputs.value = new_selected_node.outputs.map(x => getValues(x))
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
        reference_node.value = undefined
        last_seletion_source.value = EditorSelectionSource.MULTIPLE

        selected_node_names.value.forEach((node_name: string) => {
            const index = new_selected_node_names.indexOf(node_name)
            if (index === -1) {
                new_selected_node_names.push(node_name)
            } else {
                new_selected_node_names.splice(index, 1)
            }
        })

        //FIXME this explicit assignment is necessary to make watchers trigger (color nodes). 
        // This shouldn't be an issue (watchers are supposed to be deep by default)
        selected_node_names.value = new_selected_node_names
        
    }

    function changeCopyMode(new_mode: boolean) {
        copy_node_mode.value = new_mode
    }

    function changeNodeName(value: string) {
        node_has_changed.value = true
        new_node_name.value = value
    }

    function changeNodeClass(node_module_class: string) {
       
        // Find new node to replace attributes
        const new_reference_node = flow_control_nodes.value.find(
            (node: DocumentedNode) => 
                node.module + node.node_class === node_module_class
        )
        console.log(new_reference_node)

        if (new_reference_node === undefined) {
            console.warn("Can't locate node morph target")
            return
        }
        
        reference_node.value = new_reference_node
        new_node_class.value = new_reference_node.node_class
        new_node_module.value = new_reference_node.module

        new_node_options.value = new_reference_node.options.map(x => getInitialValues(x, new_reference_node.options))
        new_node_inputs.value = new_reference_node.inputs.map(x => getInitialValues(x, new_reference_node.options))  
        new_node_outputs.value = new_reference_node.outputs.map(x => getInitialValues(x, new_reference_node.options))

        node_has_changed.value = true
        node_is_morphed.value = true
    }

    function updateParamValue(paramType: string, //"options" | "inputs" | "outputs", 
        key: string, new_value: ValueTypes
    ) {
        node_has_changed.value = true
        function map_fun (x: ParamData): ParamData {
            if (x.key === key) {
                return {
                    key: key,
                    value: {
                    type: x.value.type,
                    value: new_value
                    }
                }
            } else {
                return x
            }
        }

        if (paramType.toLowerCase() === 'options') {
            // All of these are lists containing lists of [key, ref_key]
            //
            // That is, if options = { foo : int, bar : OptionRef(foo) }
            // ref_keys will be [[bar, foo]]

            if (reference_node.value === undefined) {
                console.error("Cannot recover node information")
                return
            }

            const option_ref_keys = reference_node.value.options
            .filter((x) => prettyprint_type(x.serialized_value).startsWith('OptionRef('))
            .map((x): [string, string] => [
                x.key,
                prettyprint_type(x.serialized_value).substring(
                'OptionRef('.length,
                prettyprint_type(x.serialized_value).length - 1
                )
            ])
            .filter((x) => x[1] === key)

            const input_ref_keys = reference_node.value.inputs
            .filter((x) => prettyprint_type(x.serialized_value).startsWith('OptionRef('))
            .map((x): [string, string] => [
                x.key,
                prettyprint_type(x.serialized_value).substring(
                'OptionRef('.length,
                prettyprint_type(x.serialized_value).length - 1
                )
            ])
            .filter((x) => x[1] === key)

            const output_ref_keys = reference_node.value.outputs
            .filter((x) => prettyprint_type(x.serialized_value).startsWith('OptionRef('))
            .map((x): [string, string] => [
                x.key,
                prettyprint_type(x.serialized_value).substring(
                'OptionRef('.length,
                prettyprint_type(x.serialized_value).length - 1
                )
            ])
            .filter((x) => x[1] === key)

            new_node_options.value = new_node_options.value.map(map_fun)
            function resolve_refs (refs: [string, string][], current_item: ParamData): ParamData {
                // See if the current option references the changed key
                const refData = refs.find((ref) => ref[0] === current_item.key)!
                if (refData) {
                    // If it does, find the type of the referred key
                    const optionType = new_node_options.value.find((opt) => opt.key === refData[1])
                    if (optionType) {
                        const opt_value = optionType.value.value as string
                        // Get a default value for the type indicated by the
                        // referenced option
                        return {
                            key: current_item.key,
                            value: getDefaultValue(opt_value.replace('__builtin__.', '').replace('builtins.', ''))
                        }
                    }
                }
                return current_item
            }
            new_node_options.value = new_node_options.value.map(
                (item) => resolve_refs(option_ref_keys, item)
            )

            if (input_ref_keys.length > 0) {
            new_node_inputs.value = new_node_inputs.value.map(
                (item) => resolve_refs(input_ref_keys, item)
            )
            }
            if (output_ref_keys.length > 0) {
            new_node_outputs.value = new_node_outputs.value.map(
                (item) => resolve_refs(output_ref_keys, item)
            )
            }
        } else if (paramType.toLowerCase() === 'inputs') {
            new_node_inputs.value = new_node_inputs.value.map(map_fun)
        } else if (paramType.toLowerCase() === 'outputs') {
            new_node_outputs.value = new_node_outputs.value.map(map_fun)
        }
    }
      
    return {
        selected_node,
        reference_node,
        selected_node_names,
        last_seletion_source,
        node_has_changed,
        copy_node_mode,
        node_is_valid,
        node_is_morphed,
        new_node_name,
        new_node_class,
        new_node_module,
        new_node_options,
        new_node_inputs,
        new_node_outputs,
        flow_control_nodes,
        is_flow_control_node,
        nodeListSelectionChange,
        editorSelectionChange,
        selectMultipleNodes,
        clearSelection,
        setNodeHasChanged,
        clearNodeHasChanged,
        changeCopyMode,
        changeNodeName,
        changeNodeClass,
        updateParamValue,
    }
})