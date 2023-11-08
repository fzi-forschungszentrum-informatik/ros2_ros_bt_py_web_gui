<script setup lang="ts">
import { useEditorStore } from '@/stores/editor'
import { notify } from '@kyvg/vue3-notification'
import * as d3 from 'd3'
import type { ZoomBehavior } from 'd3'
import { ref } from 'vue'

const editor_store = useEditorStore()

const viewport_ref = ref<SVGSVGElement>()
const svg_g_ref = ref<SVGGElement>()

let zoomObject: ZoomBehavior<SVGSVGElement, unknown> | undefined = undefined

function resetView() {
  if (
    viewport_ref.value === undefined ||
    svg_g_ref.value === undefined ||
    zoomObject === undefined
  ) {
    notify({
      title: 'Element reference undefined!',
      type: 'error'
    })
    return
  }
  const viewport = d3.select(viewport_ref.value)
  const height = viewport.node()!.getBoundingClientRect().height

  const container = d3.select(svg_g_ref.value)

  viewport
    .call(
      zoomObject.scaleExtent([0.3, 1.0]).on('zoom', function () {
        container.attr('transform', d3.event.transform)
      })
    )
    .call(zoomObject.translateTo, 0.0, height * 0.5 - 10.0)
}
</script>

<template>
  <svg id="editor_viewport" ref="viewport_ref" class="reactive-svg" :class="editor_store.skin">
    <g id="container" ref="svg_g_ref">
      <g class="edges" />
      <g class="vertices" />
      <g class="data_graph">
        <g class="data_edges" />
        <g class="data_vertices" />
      </g>
      <g class="drop_targets" visibility="hidden" />
    </g>
    <text
      x="10"
      y="20"
      fill="#FFFFFF"
      textAnchor="left"
      alignmentBaseline="central"
      class="cursor-pointer svg-button"
      @click="resetView"
    >
      Reset View
    </text>
  </svg>
</template>
