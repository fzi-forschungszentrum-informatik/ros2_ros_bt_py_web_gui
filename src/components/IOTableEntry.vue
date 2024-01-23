<script setup lang="ts">
import type { NodeData } from '@/types/types'
import { prettyprint_type } from '@/utils'

defineProps<{
  io_node_data: NodeData[]
  title: string
}>()
</script>

<template>
  <div class="io_values list-group-item">
    <h5>{{ title }}</h5>
    <table class="table">
      <tbody>
        <tr v-for="node_data in io_node_data" :key="title + node_data.key">
          <td :title="node_data.key" class="io_key text-truncate maxw0">
            {{ node_data.key }}
          </td>
          <td
            :title="prettyprint_type(node_data.serialized_value)"
            class="io_type text-truncate maxw0 text-muted pl-2"
          >
            {{ prettyprint_type(node_data.serialized_value) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
