<script setup lang="ts">
import type { ParamData } from '@/types/types'

defineProps<{
  param: ParamData
  name: string
}>()
</script>

<template>
  <div class="list-group-item">
    <div
      v-if="
        param.value.type === 'int' || param.value.type === 'float' || param.value.type === 'string'
      "
    >
      <h5>
        {{ param.key + ' ' }}
        <span className="text-muted">(type: {{ param.value.type }})</span>
      </h5>
      <span>{{ param.value.value as string }}</span>
    </div>
    <div v-else-if="param.value.type === 'type'">
      <h5>
        {{ param.key + ' ' }}
        <span className="text-muted">(type: {{ param.value.type }})</span>
      </h5>
      <pre>{{ param.value.value as string }}</pre>
    </div>
    <div v-else-if="param.value.type === 'boolean'">
      <h5>
        {{ param.key + ' ' }}
        <span className="text-muted">(type: {{ param.value.type }})</span>
      </h5>
      <pre>{{ param.value.value ? 'True' : 'False' }}</pre>
    </div>
    <div v-else-if="param.value.type === 'unset_optionref'">
      <h5>
        {{ param.key + ' ' }}
        <span className="text-muted">(type: {{ param.value.type }})</span>
      </h5>
      <pre class="text-muted">{{ param.value.value as string }}</pre>
    </div>
    <div v-else>
      <h5>
        {{ param.key + ' ' }}
        <span className="text-muted">(type: {{ param.value.type }})</span>
      </h5>
      <pre>{{ JSON.stringify(param.value.value, null, 2) }}</pre>
    </div>
  </div>
</template>
