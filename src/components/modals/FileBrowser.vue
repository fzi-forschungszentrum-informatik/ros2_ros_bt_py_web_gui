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
import { FileType } from '@/types/types';
import type { PackageStructure } from '@/types/types';
import type { GetFolderStructureRequest, GetFolderStructureResponse } from '@/types/services/GetFolderStructure';
import type { GetPackageStructureRequest, GetPackageStructureResponse } from '@/types/services/GetPackageStructure';
import * as d3 from 'd3'

const props = defineProps<{
    location: string,
    title: string,
    fromPackages?: boolean,
    file_filter?: RegExp
}>()

const emit = defineEmits<{
    (e: 'select', selected_path: string, is_directory: boolean): void,
    (e: 'input', input_name: string): void,
    (e: 'close'): void,
}>()


const ros_store = useROSStore()
const packages_store = usePackageStore()


const chosen_location = ref<string | null>(null)
const locations = ref<string[]>([])

const location_search_term = ref<string>("")
const location_fuse = ref<Fuse<string>>(new Fuse<string>([], {

}))
const location_search_results = computed<string[]>(() => {
    if (props.fromPackages) {
        if (location_search_term.value === '') {
            return packages_store.packages.map((x) => x.package)
        }
        return packages_store.packages_fuse.search(location_search_term.value).map((x) => x.item.package)
    } else {
        if (location_search_term.value === '') {
            return locations.value
        }
        return location_fuse.value.search(location_search_term.value).map((x) => x.item)
    }
})

const location_available = computed<boolean>(() => 
    (props.fromPackages && packages_store.packages_available) || locations.value.length > 0
)

const current_folder = ref<d3.HierarchyNode<PackageStructure> | null>(null)
const folder_search_term = ref<string>('')
const folder_item_fuse = ref<Fuse<d3.HierarchyNode<PackageStructure>>>(
    new Fuse<d3.HierarchyNode<PackageStructure>>([], {
        keys: ['data.name']
    })
)
const item_search_results =computed<d3.HierarchyNode<PackageStructure>[]>(() => {
    let list: d3.HierarchyNode<PackageStructure>[] = []
    if (folder_search_term.value === '') {
        list = current_folder.value?.children || []
    } else {
        list = folder_item_fuse.value.search(folder_search_term.value).map(x => x.item)
    }
    list = list.filter((item: d3.HierarchyNode<PackageStructure>) => {
        switch (item.data.type) {
            case FileType.DIR:
                return true //TODO add blacklist filter for folders
            case FileType.FILE:
                if (props.file_filter === undefined) {
                    return true
                }
                return props.file_filter.test(item.data.name)
            default:
                return false
        }    
    })
    return list
})


function getStorageFolders() {
    ros_store.get_storage_folders_service.callService({

    } as GetStorageFoldersRequest,
    (response: GetStorageFoldersResponse) => {
        location_fuse.value.setCollection(response.storage_folders)
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
    // Packages are handled through the package store. Nothing to do here.
}

function parseStructure(content_str: string) {
    current_folder.value = d3.hierarchy<PackageStructure>(JSON.parse(content_str))
    folder_item_fuse.value.setCollection(current_folder.value.children || [])
}

function getFolderStructure() {
    ros_store.get_folder_structure_service.callService({
        storage_folder: chosen_location.value,
        show_hidden: true //TODO is this correct
    } as GetFolderStructureRequest,
    (response: GetFolderStructureResponse) => {
        if (response.success) {
            parseStructure(response.storage_folder_structure)
        } else {
            notify({
                title: 'Error when calling GetFolderStructure service!',
                text: response.error_message,
                type: 'warn'
            })
        }
    },
    (error: string) => {
        notify({
            title: 'Failed to call GetFolderStructure service!',
            text: error,
            type: 'error'
        })
    })
}

function getPackageStructure() {
    ros_store.get_package_structure_service.callService({
        package: chosen_location.value,
        show_hidden: true //TODO is this correct
    } as GetPackageStructureRequest,
    (response: GetPackageStructureResponse) => {
        if (response.success) {
            parseStructure(response.package_structure)
        } else {
            notify({
                title: 'Error when calling GetFolderStructure service!',
                text: response.error_message,
                type: 'error'
            })
        }
    },
    (error: string) => {
        notify({
            title: 'Failed to call GetFolderStructure service!',
            text: error,
            type: 'error'
        })
    })
}

function setChosenLocation(value: string | null) {
    if (value === null) {
        chosen_location.value = null
        location_search_term.value = ''
        current_folder.value = null
    } else {
        chosen_location.value = value
        location_search_term.value = value
        if (props.fromPackages) {
            getPackageStructure()
        } else {
            getFolderStructure()
        }
    }
}

function setCurrentFolder(elem: d3.HierarchyNode<PackageStructure>) {
    switch (elem.data.type) {
        case FileType.DIR:
            current_folder.value = elem
            folder_search_term.value = ''
            folder_item_fuse.value.setCollection(elem.children || [])
            break;
        case FileType.FILE:
            folder_search_term.value = elem.data.name
            break;
        default:
            break;
    }
    // Emit selected path by stitching together parents
    emit("select", elem.ancestors().reverse().map( (parent) => parent.data.name ).join("/"), elem.data.type === FileType.DIR)

}

onMounted(() => {
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
    
    <div v-if="location_available" class="mx-4 mb-4">
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
            <button v-for="location in location_search_results" :key="location"
            @click="setChosenLocation(location)" class="btn btn-outline-dark ms-4 mb-3">
                {{ location }}
            </button>
        </div>
        <div v-else-if="current_folder !== null">
            <div class="d-flex justify-content-between mb-3">
                <slot>Control Buttons, Selects, ...</slot>
            </div>
            <div class="input-group mb-3">
                <span class="input-group-text">
                    Name:
                </span>
                <input v-model="folder_search_term" type="text" class="form-control"
                @change="emit('input', ($event.target as HTMLInputElement).value)">
                <!--TODO if this causes issues with not firing, try switching to @input-->
            </div>
            <div class="input-group mb-3">
                <button :disabled="current_folder.parent === null"
                @click="setCurrentFolder(current_folder.parent!)" class="btn btn-outline-secondary">
                    <font-awesome-icon icon="fa-solid fa-angle-up" />
                </button>
                <button v-for="elem in current_folder.ancestors().reverse()" :key="elem.data.item_id"
                @click="setCurrentFolder(elem)" class="btn btn-outline-secondary">
                    {{ elem.data.name }}
                </button>
            </div>
            <div class="d-grid overflow-auto" style="max-height: 50vh">
                <button v-for="elem in item_search_results" :key="elem.data.item_id"
                @click="setCurrentFolder(elem)" class="btn btn-outline-dark ms-4 mb-3">
                    {{ elem.data.name }}
                </button>
            </div>
        </div>
        <div v-else>
            Loading content of storage location
        </div>
    </div>
    <div v-else>
        Loading possible storage locations
    </div>
</template>