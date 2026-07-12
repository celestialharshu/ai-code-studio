import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    proxy: {
      // In development the app calls its own origin and Vite forwards to Express.
      // No CORS, no VITE_API_URL needed locally.
      '/api': { target: 'http://localhost:5000', changeOrigin: true },

      // Socket.IO starts as HTTP and upgrades to a websocket, so the proxy has
      // to be told to follow it (`ws: true`). Without this, collaboration
      // silently falls back to slow polling — or fails outright.
      '/socket.io': { target: 'http://localhost:5000', ws: true, changeOrigin: true },
    },
  },

  build: {
    chunkSizeWarningLimit: 1500, // Monaco is genuinely big; splitting it is the fix, not silence
    rollupOptions: {
      output: {
        // Keep the editor and the CRDT machinery in their own chunks so the app
        // shell can render before either has finished downloading.
        //
        // This has to match on the file path, not the package name: we import
        // Monaco through deep paths like `monaco-editor/esm/vs/editor/editor.api`,
        // which a plain { monaco: ['monaco-editor'] } mapping would miss.
        manualChunks(id) {
          if (id.includes('node_modules/monaco-editor')) return 'monaco';

          if (['yjs', 'y-monaco', 'y-protocols', 'lib0', 'socket.io'].some((pkg) => id.includes(`node_modules/${pkg}`))) {
            return 'collab';
          }
        },
      },
    },
  },
});
