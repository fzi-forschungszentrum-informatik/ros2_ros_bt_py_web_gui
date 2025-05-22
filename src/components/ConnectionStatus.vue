<!--
 *  Copyright 2025 FZI Forschungszentrum Informatik
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
import { useROSStore } from '../stores/ros'
import { useMessasgeStore } from '@/stores/message'
import { usePackageStore } from '@/stores/package'
import { computed } from 'vue'

const ros_store = useROSStore()
const messages_store = useMessasgeStore()
const packages_store = usePackageStore()


const connection_status_attrs = computed<object>(() => {
  if (!ros_store.connected) {
    return {
      class: 'disconnected',
      title: 'Disconnected'
    }
  }
  if (!messages_store.messages_available) {
    return {
      class: 'messages-missing',
      title:
        'Connected, message info not (yet) available. ' + 'ROS-type autocompletion will not work.'
    }
  }
  if (!packages_store.packages_available) {
    return {
      class: 'packages-missing',
      title: 'Connected, package list not (yet) available. ' + 'File browser will not work.'
    }
  }
  return {
    class: 'connected',
    title: 'Connected'
  }
})


</script>

<template>
    <div class="d-flex align-items-center">
        <FontAwesomeIcon
            icon="fa-solid fa-wifi"
            aria-hidden="true"
            class="mx-2 fs-4"
            v-bind="connection_status_attrs"
        />

        <button 
            class="btn btn-outline-contrast" 
            type="button" 
            data-bs-toggle="offcanvas" 
            data-bs-target="#settings"
        >
            <FontAwesomeIcon icon="fa-solid fa-cog" />
        </button>
    </div>
</template>

<style scoped lang="scss">
.connected {
  padding: 0.25rem;
  color: #0caa19;
}

.disconnected {
  padding: 0.25rem;
  color: #ff0000;
}

.packages-missing {
  padding: 0.25rem;
  color: #ff7300;
}

.messages-missing {
  padding: 0.25rem;
  color: #ffd000;
}
</style>