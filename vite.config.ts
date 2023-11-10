/// <reference types="vitest" />
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          d3: ['d3', 'd3-flextree'],
          jsyaml: ['js-yaml'],
          roslib: ['roslib'],
          fusejs: ['fuse.js'],
          'vue-extras': [
            'vue-final-modal',
            'velocity-animate',
            'focus-trap',
            '@kyvg/vue3-notification'
          ],
          fontawesome: [
            '@fortawesome/fontawesome-svg-core',
            '@fortawesome/free-brands-svg-icons',
            '@fortawesome/free-regular-svg-icons',
            '@fortawesome/free-solid-svg-icons',
            '@fortawesome/vue-fontawesome'
          ]
        }
      }
    }
  },
  test: {
    reporters: ['default', 'junit'],
    outputFile: './test-report.xml'
  }
})
