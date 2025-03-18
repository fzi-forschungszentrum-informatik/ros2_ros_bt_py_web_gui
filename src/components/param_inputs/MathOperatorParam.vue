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
import { useEditNodeStore } from '@/stores/edit_node';
import { useEditorStore } from '@/stores/editor';
import type { PyOperator } from '@/types/python_types';
import type { OptionData } from '@/types/types';
import { computed } from 'vue';


const editor_store = useEditorStore()
const edit_node_store = useEditNodeStore()

const props = defineProps<{
    category: 'options',
    data_key: string,
    op_type: 'unary' | 'binary'
}>()

const param = computed<OptionData | undefined>(() => 
    edit_node_store.new_node_options.find((x) => x.key === props.data_key)
)

function handleChange(event: Event) {
    if (param.value === undefined) {
        console.error("Undefined parameter")
        return
    }

    const target = event.target as HTMLSelectElement

    const operator_obj = param.value.value.value as PyOperator
    operator_obj.operator = target.value

    edit_node_store.updateParamValue(props.category, param.value.key, operator_obj)
}

// Lookup for all possible values for operators and operands
const options = {
    unary: [
        'not',
        'inv',
        '~',
        'neg',
        '-',
        'pos',
        '+',
        'exp',
        'expm1',
        'log',
        'log1p',
        'log10',
        'ceil',
        'fabs',
        'factorial',
        'floor',
        'sqrt',
        'acos',
        'asin',
        'atan',
        'acosh',
        'asinh',
        'atanh',
        'cos',
        'sin',
        'tan',
        'cosh',
        'sinh',
        'tanh',
        'degrees',
        'radians',
        'erf',
        'erfc',
        'gamma',
        'lgamma'
    ],
    binary: [
        'add',
        '+',
        'and',
        '&',
        'div',
        '/',
        'floordiv',
        '//',
        'lshift',
        '<<',
        'mod',
        '%',
        'mul',
        '*',
        'or',
        '|',
        'pow',
        '**',
        'rshift',
        '>>',
        'sub',
        '-',
        'truediv',
        'xor',
        '^'
    ]
}


</script>

<template>
    <div v-if="param !== undefined" class="form-group">
        <label class="d-block">
            {{ param.key }}
        </label>
        <select
            class="form-select" 
            :value="(param.value.value as PyOperator).operator"
            :disabled="editor_store.selected_subtree.is_subtree" 
            @change="handleChange" 
        >
            <option
                v-for="operator_option in options[props.op_type]" 
                :key="operator_option" :value="operator_option"
            >
                {{ operator_option }}
            </option>
        </select>
    </div>
    <div v-else>
        Error loading param data
    </div>
</template>