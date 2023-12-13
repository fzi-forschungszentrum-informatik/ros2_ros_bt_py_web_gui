<script setup lang="ts">
import type { ParamData } from '@/types/types'

defineProps<{
  param: ParamData
}>()
</script>
<template>
  <div class="form-group m-1">
    <label class="d-block">
      {{ param.key }}
      <input
        type="text"
        class="form-control mt-2"
        :disabled="true"
        :value="param.value.value as string"
      />
    </label>
  </div>
</template>
