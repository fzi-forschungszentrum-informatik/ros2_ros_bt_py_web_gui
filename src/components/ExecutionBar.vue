<script setup lang="ts">
import DebugControls from './DebugControls.vue';
import LoadSaveControls from './LoadSaveControls.vue';
import NamespaceSelect from './NamespaceSelect.vue';
import ExecutionBarSpacer from './ExecutionBarSpacer.vue';
import TickControls from './TickControls.vue';


</script>

<template>
  <header id="header" class="d-flex flex-column flex-md-row align-items-center control-bar">
    <NamespaceSelect></NamespaceSelect>
    <DebugControls></DebugControls>
    <TickControls></TickControls>
    <ExecutionBarSpacer></ExecutionBarSpacer>
    <LoadSaveControls></LoadSaveControls>
  </header>
</template>

<style lang="scss">
.control-bar {
  background: #bebebe;
}
</style>