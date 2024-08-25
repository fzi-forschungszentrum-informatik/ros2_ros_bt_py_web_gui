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
import { computed, onMounted, ref } from 'vue';
import Fuse from 'fuse.js'
import { useROSStore } from '@/stores/ros';
import type { GetStorageFoldersRequest, GetStorageFoldersResponse } from '@/types/services/GetStorageFolders';
import { notify } from '@kyvg/vue3-notification';
import { usePackageStore } from '@/stores/package';

const props = defineProps<{
    location: string,
    title: string,
    fromPackages?: boolean,
}>()

const emit = defineEmits<{
    (e: 'change', selected_path: string, input_name: string): void
    (e: 'close'): void
}>()


const ros_store = useROSStore()
const packages_store = usePackageStore()


const chosen_location = ref<string | null>(null)
const locations = ref<string[]>([])

const location_search_term = ref<string>("")
const location_fuse = ref<Fuse<string> | undefined>()
const location_search_results = computed<string[]>(() => {
    if (props.fromPackages) {
        if (location_search_term.value === '') {
            return packages_store.packages.map((x) => x.package)
        }
        return packages_store.packages_fuse.search(location_search_term.value).map((x) => x.item.package)
    } else {
        if (location_fuse.value === undefined) {
            return []
        }
        if (location_search_term.value === '') {
            return locations.value
        }
        return location_fuse.value.search(location_search_term.value).map((x) => x.item)
    }
})


function getStorageFolders() {
    ros_store.get_storage_folders_service.callService({

    } as GetStorageFoldersRequest,
    (response: GetStorageFoldersResponse) => {
        location_fuse.value = new Fuse(response.storage_folders)
        locations.value = response.storage_folders
    },
    (error: string) => {
        notify({
        title: 'Failed to call GetStorageFolders service!',
        text: error,
        type: 'error'
      })
    })
}

function getPackages() {

}

function setChosenLocation(value: string | null) {
    if (value === null) {
        chosen_location.value = null
        location_search_term.value = ''
    } else {
        chosen_location.value = value
        location_search_term.value = value
    }
}

onMounted(() => {
    //TODO fetch storage folders or packages, based on fromPackages
    if (props.fromPackages) {
        getPackages()
    } else {
        getStorageFolders()
    }
})

</script>

<template>
    <button class="btn float-end" @click="emit('close')">
        <font-awesome-icon class="fa-3x" style="opacity: 0.1;" icon="fa-solid fa-xmark" />
    </button>

    <h1 class="fs-1 mb-3 mt-4 mx-4">{{ props.title }}</h1>
    
    <div v-if="(fromPackages && packages_store.packages_available) || location_fuse" class="mx-4 mb-4">
        <div class="input-group mb-3">
            <span class="input-group-text">
                {{ props.location }}:
            </span>
            <input v-model="location_search_term" :disabled="chosen_location !== null" type="text" class="form-control">
            <button @click="setChosenLocation(null)" class="btn btn-outline-secondary">
                <font-awesome-icon icon="fa-solid fa-xmark" />
            </button>
        </div>
        <div v-if="chosen_location === null" class="d-grid overflow-auto" style="max-height: 70vh">
            <button v-for="location in location_search_results" 
            @click="setChosenLocation(location)" class="btn btn-outline-dark ms-4 mb-3">
                {{ location }}
            </button>
        </div>
        <div v-else>
            <div class="mb-3">
                <slot /><!--Control Buttons, Selects, ...-->
            </div>
            <div class="input-group mb-3">
                <span class="input-group-text">
                    Name:
                </span>
                <input type="text" class="form-control">
            </div>
            <div class="input-group mb-3">
                <button class="btn btn-outline-secondary">
                    <font-awesome-icon icon="fa-solid fa-angle-up" />
                </button>
                <!--Buttons for navigating up the file tree-->
            </div>
            <div>
                Folder Content
            </div>
        </div>
    </div>
    <div v-else>
        Loading possible storage locations
    </div>
</template>