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
import { EditorSkin, useEditorStore } from '@/stores/editor'

const props = defineProps<{
  execBarVisible: boolean
}>()

const emits = defineEmits<{
  (e: 'show'): void
  (e: 'hide'): void
}>()

const editor_store = useEditorStore()
</script>

<template>
  <div class="d-flex align-items-center h-100">
    <div class="btn-group">
      <button
        class="btn btn-primary"
        title="Toggle Data Graph"
        @click="editor_store.enableShowDataGraph(!editor_store.show_data_graph)"
      >
        <FontAwesomeIcon
          :class="editor_store.show_data_graph ? 'text-white' : 'text-white-50'"
          icon="fa-solid fa-route"
        />
      </button>
      <button
        v-if="props.execBarVisible"
        class="btn btn-primary btn-spaced"
        title="Hide User Interface"
        @click="emits('hide')"
      >
        <FontAwesomeIcon icon="fa-solid fa-window-maximize" />
      </button>
      <button
        v-else
        class="btn btn-primary btn-spaced"
        title="Show User Interface"
        @click="emits('show')"
      >
        <FontAwesomeIcon icon="fa-solid fa-window-restore" />
      </button>
      <button
        class="btn btn-primary btn-spaced"
        title="Change tree layout (layers/subtrees)"
        @click="() => (editor_store.is_layer_mode = !editor_store.is_layer_mode)"
      >
        <FontAwesomeIcon
          :class="editor_store.is_layer_mode ? 'text-white' : 'text-white-50'"
          icon="fa-solid fa-layer-group"
        />
        <FontAwesomeIcon
          :class="editor_store.is_layer_mode ? 'text-white-50' : 'text-white'"
          icon="fa-solid fa-tree"
        />
      </button>
      <button
        class="btn btn-primary btn-spaced"
        title="Change editor appearance"
        @click="editor_store.cycleEditorSkin"
      >
        <FontAwesomeIcon
          :class="editor_store.skin === EditorSkin.DARK ? 'text-white' : 'text-white-50'"
          icon="fa-solid fa-moon"
        />
        <FontAwesomeIcon
          :class="editor_store.skin === EditorSkin.LIGHT ? 'text-white' : 'text-white-50'"
          icon="fa-solid fa-sun"
        />
      </button>
    </div>
  </div>
</template>
