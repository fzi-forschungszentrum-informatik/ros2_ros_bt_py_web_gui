<script setup lang="ts">
import DebugControls from './DebugControls.vue'
import LoadSaveControls from './LoadSaveControls.vue'
import NamespaceSelect from './NamespaceSelect.vue'
import Spacer from './RightAlignSpacer.vue'
import TickControls from './TickControls.vue'
</script>

<template>
  <header id="header" class="d-flex flex-column flex-md-row align-items-center control-bar">
    <NamespaceSelect></NamespaceSelect>
    <DebugControls></DebugControls>
    <TickControls></TickControls>
    <Spacer></Spacer>
    <LoadSaveControls></LoadSaveControls>
  </header>
</template>

<style lang="scss">
.control-bar {
  width: 100%;
  background: #bebebe;
}
</style>
