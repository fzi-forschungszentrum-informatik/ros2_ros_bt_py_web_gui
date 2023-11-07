import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "~bootstrap": path.resolve(__dirname, "node_modules/bootstrap"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          d3: ["d3", "d3-flextree", "d3-selection"],
          roslib: ["roslib"],
          bootstrap: ["bootstrap", "@popperjs/core"],
          fontawesome: ["@fortawesome/fontawesome-free"],
          jsoneditor: ["jsoneditor"],
        },
      },
    },
  },
});
