import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Increase chunk size limit warning threshold
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          // React runtime
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Map library
          'leaflet-vendor': ['leaflet'],
          // Icon library
          'lucide-vendor': ['lucide-react'],
        },
      },
    },
  },
});
