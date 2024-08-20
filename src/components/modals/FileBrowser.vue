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

defineProps<{
    location: string,
    title: string,
    fromPackage?: boolean,
}>()

const emit = defineEmits<{
    (e: 'change', path: string): void
    (e: 'close'): void
}>()

</script>

<template>
    <button class="btn float-end" @click="emit('close')">
        <font-awesome-icon class="fa-3x" style="opacity: 0.1;" icon="fa-solid fa-xmark" />
    </button>

    <h1 class="fs-1 mb-3 mt-4 mx-4">{{ $props.title }}</h1>
    
    <div class="input-group mb-3 mx-4">
        <span class="input-group-text">
            {{ $props.location }}:
        </span>
        <input type="text" class="form-control">
        <button class="btn btn-outline-secondary">
            <font-awesome-icon icon="fa-solid fa-xmark" />
        </button>
    </div>
    <div class="mb-3 mx-4">
        <slot /><!--Control Buttons, Selects, ...-->
    </div>
    <div class="input-group mb-3 mx-4">
        <span class="input-group-text">
            Name:
        </span>
        <input type="text" class="form-control">
    </div>
    <div class="input-group mb-3 mx-4">
        <button class="btn btn-outline-secondary">
            <font-awesome-icon icon="fa-solid fa-angle-up" />
        </button>
        <!--Buttons for navigating up the file tree-->
    </div>
    <div class="mx-4 mb-4">
        Folder Content
    </div>
</template>