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
import { useEditorStore } from '@/stores/editor'
import { useROSStore } from '@/stores/ros'
import type { ChangeTreeNameRequest, ChangeTreeNameResponse } from '@/types/services/ChangeTreeName'
import { TreeState } from '@/types/types'
import { notify } from '@kyvg/vue3-notification'
import { computed, ref, watchEffect } from 'vue'

const editor_store = useEditorStore()
const ros_store = useROSStore()

const tree_name = computed<string>(() => {
  if (editor_store.current_tree !== undefined) {
    return editor_store.current_tree.name
  } else {
    return ''
  }
})

const new_tree_name = ref<string>(tree_name.value)

const tree_state = computed<TreeState>(() => {
  if (editor_store.current_tree !== undefined) {
    return editor_store.current_tree.state
  } else {
    return TreeState.EDITABLE
  }
})

const tree_state_styles = computed<any>(() => {
  let bg_color_var = ''
  let border_color_var = '--bs-body-color'
  switch (tree_state.value) {
    case TreeState.ERROR:
      bg_color_var = '--bg-color-error'
      break
    case TreeState.IDLE:
      bg_color_var = '--bg-color-idle'
      break
    case TreeState.STOP_REQUESTED:
      bg_color_var = '--bg-color-stop-requested'
      break
    case TreeState.TICKING:
      bg_color_var = '--bg-color-ticking'
      break
    case TreeState.WAITING_FOR_TICK:
      bg_color_var = '--bg-color-waiting-for-tick'
      break
    case TreeState.EDITABLE:
    default:
      bg_color_var = '--bg-color-default'
      break
  }
  return {
    backgroundColor: 'var(' + bg_color_var + ')',
    //borderColor: 'var(' + border_color_var + ')'
  }
})

const tree_state_icon = computed<string>(() => {
  let icon: string
  switch (tree_state.value) {
    case TreeState.ERROR:
      icon = 'fa-exclamation'
      break
    case TreeState.IDLE:
      icon = 'fa-pause'
      break
    case TreeState.STOP_REQUESTED:
      icon = 'fa-pause'
      break
    case TreeState.TICKING:
      icon = 'fa-bolt'
      break
    case TreeState.WAITING_FOR_TICK:
      icon = 'fa-hourglass-half'
      break
    case TreeState.EDITABLE:
      icon = 'fa-pen'
      break
    default:
      icon = ''
      break
  }
  return 'fa-solid ' + icon
})

watchEffect(errorPopUp)
function errorPopUp(): void {
  if (tree_state.value === TreeState.ERROR) {
    window.alert(
      "There has been an error while running the tree"
    )
  }
}

function renameTree(): void {
  console.log(new_tree_name.value)
  ros_store.change_tree_name_service.callService(
    {
      name: new_tree_name.value
    } as ChangeTreeNameRequest,
    (response: ChangeTreeNameResponse) => {
      if (response.success) {
        notify({
          title: 'Successfully renamed tree!',
          text: new_tree_name.value,
          type: 'success'
        })
      } else {
        notify({
          title: 'Failed to rename tree!',
          text: response.error_message,
          type: 'warn'
        })
      }
    },
    (error: string) => {
      notify({
        title: 'Failed to call ChangeTreeName service!',
        text: error,
        type: 'error'
      })
    }
  )
}
</script>

<template>
  <div class="row my-2">
    <div class="col">
      <div class="input-group">
        <label class="input-group-text" for="treeNameForm"> Name </label>
        <input
          id="treeNameForm"
          class="form-control"
          type="text"
          :disabled="editor_store.selected_subtree.is_subtree"
          :value="tree_name"
          @input="(event: Event) => (new_tree_name = (event.target as HTMLInputElement).value)"
        />
        <button
          class="btn btn-primary"
          :disabled="editor_store.selected_subtree.is_subtree"
          @click="renameTree"
        >
          Save
        </button>
      </div>
    </div>
    <div class="col-auto">
      <div class="input-group state-display">
        <label class="input-group-text"> State </label>
        <label
          class="input-group-text"
          :style="tree_state_styles"
          style="width: 12em"
        >
          <font-awesome-icon :icon="tree_state_icon" class="me-2" />
          {{ tree_state }}
        </label>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>

.state-display {
  --bg-color-waiting-for-tick: #ffff51;
  --bg-color-idle: #4da3ff;
  --bg-color-ticking: #5bff81;
  --bg-color-error: #f74b5c;
  --bg-color-stop-requested: #ff9d3b;
  --bg-color-default: #c1c1c1;
}

[data-bs-theme='dark'] .state-display {
  --bg-color-waiting-for-tick: #6d6d00;
  --bg-color-idle: #002f60;
  --bg-color-ticking: #005d16;
  --bg-color-error: #6e010c;
  --bg-color-stop-requested: #682800;
  --bg-color-default: #4c4b4b;
}

</style>
